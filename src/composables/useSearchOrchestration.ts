/**
 * 搜索编排 —— SSE 流式搜索 + URL 双向同步 + VNDB 预取
 *
 * 整块从 SearchHeader.vue 搬出（原 L412-L727），SearchHeader 只负责渲染。
 *
 * 这里刻意保持「逐行搬运」：五处竞态防护、参数快照与实时 ref 之间的不对称、
 * 以及几个已知瑕疵（见文末「已知缺口」）全部按原样保留。原因是沙箱里连不上
 * 真实搜索后端，任何行为变化都验证不了，所以宁可保留已知瑕疵也不夹带修复。
 * 注释里的 L### 指重构前 SearchHeader.vue 的行号，方便回溯 diff。
 */

import type { Ref } from 'vue'
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useStatsStore } from '@/stores/stats'
import { useCacheStore } from '@/stores/cache'
import { useHistoryStore } from '@/stores/history'
import { searchGameStream, fetchVndbData } from '@/api'
import { playSwipe, playSelect, playCelebration, playCaution, playType } from '@/composables/useSound'
import { useDebouncedClick } from '@/composables/useDebounce'
import { getSearchParamsFromURL, updateURLParams, onURLParamsChange } from '@/utils/urlParams'

export type SearchMode = 'game' | 'patch'

/**
 * 搜索闸门时长。注意 useDebouncedClick 是 **leading-edge 节流**：
 * 首次调用同步立即执行，其后 800ms 内的调用被丢弃（不是延到最后再跑）。
 * 换成普通 debounce 会给首次搜索凭空加 800ms 延迟。
 */
const SEARCH_LOCK_MS = 800

/** 打字音效节流间隔（原 L642） */
const TYPING_THROTTLE = 80

/** popstate 回填后抑制 URL 回写的窗口（原 L476） */
const URL_SYNC_SUPPRESS_MS = 200

/** 自动滚动到结果区时给顶部留出的偏移（原 L581 / L610） */
const SCROLL_HEADER_OFFSET = 80

/** 收到这么多个平台结果后才自动滚动，避免刚出一条就把页面拽走（原 L573） */
const SCROLL_AFTER_PLATFORMS = 3

/** DOM 契约：滚动目标是 SearchResults.vue 上的 id="results" */
const RESULTS_ELEMENT_ID = 'results'

/**
 * @param options.searchInputRef 搜索输入框的模板 ref。由组件持有并传入 ——
 *   DOM 引用属于渲染层，放在 composable 里会让组件为了绑定 ref="" 而destructure
 *   一个自己从不读取的变量（noUnusedLocals 会因此报错）。
 */
export function useSearchOrchestration(
  options: { searchInputRef?: Ref<HTMLInputElement | null> } = {},
) {
  const searchStore = useSearchStore()
  const statsStore = useStatsStore()
  const cacheStore = useCacheStore()
  const historyStore = useHistoryStore()

  // 与 store 平行存在的本地状态。保留这份「第二份真相」是有意的：
  // L1 的 watch 靠它在每次键入时**同步**写回 store，VNDB 的竞态防护依赖这个即时性。
  const searchQuery = ref('')
  const customApi = ref('')
  const searchMode = ref<SearchMode>('game')
  const searchInputRef = options.searchInputRef ?? ref<HTMLInputElement | null>(null)

  let cleanupURLListener: (() => void) | null = null
  let searchStartTime = 0
  let currentSearchCtrl: AbortController | null = null

  // isSearchLocked 同时驱动搜索闸门和 SearchErrorCard 重试按钮的 disabled 态（原 L437）
  const { isLocked: isSearchLocked, click: debouncedSearchTrigger } = useDebouncedClick(SEARCH_LOCK_MS)

  let isUpdatingFromURL = false

  // ============================================
  // URL / store 恢复与同步（原 L442-L513）
  // ============================================

  onMounted(() => {
    // 优先从 URL 读取参数
    const urlParams = getSearchParamsFromURL()

    // URL 参数可以独立生效（mode 和 api 不依赖 s）
    const hasURLParams = urlParams.s || urlParams.mode || urlParams.api

    if (hasURLParams) {
      // 从 URL 恢复
      if (urlParams.s) { searchQuery.value = urlParams.s }
      if (urlParams.mode) { searchMode.value = urlParams.mode }
      if (urlParams.api) { customApi.value = urlParams.api }
    } else if (searchStore.searchQuery || searchStore.searchMode !== 'game') {
      // 否则从 store 恢复
      searchQuery.value = searchStore.searchQuery
      searchMode.value = searchStore.searchMode
      customApi.value = searchStore.customApi

      // 同步到 URL
      updateURLParams({
        s: searchQuery.value,
        mode: searchMode.value,
        api: customApi.value,
      })
    }

    // 监听浏览器前进/后退
    cleanupURLListener = onURLParamsChange((params) => {
      isUpdatingFromURL = true

      searchQuery.value = params.s || ''
      searchMode.value = params.mode || 'game'
      customApi.value = params.api || ''

      setTimeout(() => {
        isUpdatingFromURL = false
      }, URL_SYNC_SUPPRESS_MS)
    })
  })

  onUnmounted(() => {
    if (cleanupURLListener) {
      cleanupURLListener()
    }
    // 取消在飞的搜索（原 L487）。
    // 注意 abort 会让在飞的流走 onError，把 [ERR_ABORTED] 写进全局 store —— store 的
    // 生命周期长于组件，所以这是有副作用的。实际 SearchHeader 常驻不卸载，故看不见。
    currentSearchCtrl?.abort()
    currentSearchCtrl = null
  })

  // 本地三值 → store + URL（原 L492）。
  // 必须保持**同步无防抖**：handleSearch 里的 VNDB 竞态防护
  // （`searchStore.searchQuery === queryForVndb`）依赖它在键入的同一拍就写进 store。
  watch([searchQuery, searchMode, customApi], () => {
    searchStore.setSearchQuery(searchQuery.value)
    searchStore.setSearchMode(searchMode.value)
    searchStore.setCustomApi(customApi.value)

    // 更新 URL（防止循环更新）
    if (!isUpdatingFromURL) {
      updateURLParams({
        s: searchQuery.value,
        mode: searchMode.value,
        api: customApi.value,
      })
    }
  })

  // store 的 customApi → 本地（原 L508）。
  // 这是一条跨组件契约：App.vue 的 ensureSelectedApiReachable 探活失败回落默认节点、
  // 以及 SettingsModal 保存设置，都是直接写 store.customApi；靠这条回流到本地 ref，
  // 再经上面那条 watch 清掉地址栏里陈旧的 ?api=。值比较是为了不和上面形成写回环路。
  watch(() => searchStore.customApi, (newApi) => {
    // 只在不是由本地更新触发时才同步
    if (customApi.value !== newApi) {
      customApi.value = newApi
    }
  })

  // ============================================
  // 搜索主流程（原 L515-L638）
  // ============================================

  let hasScrolledToResults = false

  /**
   * 滚动到结果区。原代码在 onPlatformResult 和 onComplete 里各写了一份逐字相同的
   * 14 行，这里合并成一处 —— 只是去重，rAF + setTimeout + 偏移量算法均未改动。
   */
  function scrollToResultsSection() {
    // 使用 requestAnimationFrame + setTimeout 确保 DOM 已更新
    window.requestAnimationFrame(() => {
      setTimeout(() => {
        const resultsEl = document.getElementById(RESULTS_ELEMENT_ID)
        if (resultsEl) {
          // 计算目标位置：结果区域顶部向上偏移一些，留出空间
          const elementPosition = resultsEl.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - SCROLL_HEADER_OFFSET

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth',
          })
        }
      }, 50)
    })
  }

  async function handleSearch() {
    // input 上虽然有 required，但 keydown 那条路径绕过了原生校验，所以这个守卫是必要的
    if (!searchQuery.value.trim()) { return }

    // 竞态防护 #1：用户重新搜索时，取消上一次仍在进行的请求
    currentSearchCtrl?.abort()
    currentSearchCtrl = new AbortController()

    playSwipe() // 搜索开始音效
    // 注意 clearResults() 不重置 searchProgress，所以新搜索到首个 onTotal 之间
    // 会闪一下上次的 n/N（已知缺口 D）。修它属于行为变更，不在本次重构范围内。
    searchStore.clearResults()
    searchStore.isSearching = true
    searchStore.errorMessage = ''
    hasScrolledToResults = false // 重置滚动标志
    searchStartTime = window.performance.now() // 记录搜索开始时间

    // 唯一的参数快照。后面所有回调读的都是实时 ref 而不是这份快照，
    // 这个不对称是原样保留的（见「已知缺口 C」）。
    const searchParams = new URLSearchParams()
    searchParams.set('game', searchQuery.value.trim())
    searchParams.set('mode', searchMode.value)
    if (customApi.value.trim()) {
      searchParams.set('api', customApi.value.trim())
    }

    // 在 game 模式下，搜索开始时就并行发起 VNDB 请求
    const queryForVndb = searchQuery.value.trim()
    if (searchMode.value === 'game') {
      // 先检查缓存
      const cachedVndb = cacheStore.getVndbInfo(queryForVndb)
      if (cachedVndb) {
        searchStore.vndbInfo = cachedVndb
        statsStore.recordCacheHit('vndb')
      } else {
        // 刻意不 await、也不挂 AbortController：VNDB 慢不该拖住主搜索，
        // 失败也不该影响主搜索。
        fetchVndbData(queryForVndb).then((vndbData) => {
          // 竞态防护 #2：检查搜索词是否仍匹配（防止快速切换搜索时数据错乱）
          if (vndbData && searchStore.searchQuery === queryForVndb) {
            searchStore.vndbInfo = vndbData
            // 缓存 VNDB 数据
            cacheStore.cacheVndbInfo(queryForVndb, vndbData)
          }
        }).catch(() => {
          // VNDB 请求失败不影响主搜索
        })
      }
    }

    try {
      await searchGameStream(searchParams, {
        signal: currentSearchCtrl.signal,
        onTotal: (total) => {
          searchStore.searchProgress = { current: 0, total }
        },
        onProgress: (current, total) => {
          // current 是「后端已完成的站点数」，会明显大于 platformResults.size ——
          // 空结果的站点同样推进进度。
          searchStore.searchProgress = { current, total }
        },
        onPlatformResult: (data) => {
          searchStore.setPlatformResult(data.name, data)

          // 等待至少 3 个平台结果后滚动到结果区域（只滚动一次）
          if (!hasScrolledToResults && searchStore.platformResults.size >= SCROLL_AFTER_PLATFORMS) {
            hasScrolledToResults = true
            scrollToResultsSection()
          }
        },
        onComplete: () => {
          searchStore.isSearching = false
          playCelebration() // 搜索完成音效

          // 计算搜索耗时并记录统计
          const searchDuration = Math.round(window.performance.now() - searchStartTime)
          const resultCount = searchStore.totalResults
          statsStore.recordSearch(searchMode.value, resultCount, searchDuration)

          // 如果结果不足 3 个但有结果，且还没滚动过，则现在滚动
          if (!hasScrolledToResults && searchStore.platformResults.size > 0) {
            hasScrolledToResults = true
            scrollToResultsSection()
          }

          // 保存搜索历史（通过 historyStore 统一管理）
          historyStore.addHistory({
            query: searchQuery.value.trim(),
            mode: searchMode.value,
            resultCount,
          })
        },
        onError: (error) => {
          searchStore.errorMessage = error
          searchStore.isSearching = false
          playCaution() // 错误音效
        },
      })
    } catch (error) {
      // searchGameStream 内部把一切异常都转成了 onError，正常路径下到不了这里。
      // 保留作为兜底 —— 万一将来它改成会抛，状态也不会卡在「搜索中」。
      searchStore.errorMessage =
        error instanceof Error ? error.message : '搜索失败'
      searchStore.isSearching = false
      playCaution() // 错误音效
    }
  }

  // ============================================
  // 交互入口（原 L640-L723）
  // ============================================

  // 打字音效（节流，避免过于频繁）
  let lastTypingSound = 0

  function handleTyping() {
    const now = Date.now()
    if (now - lastTypingSound >= TYPING_THROTTLE) {
      playType()
      lastTypingSound = now
    }
  }

  /**
   * 搜索模式切换（带音效）。
   * 没有 isSearching 守卫是原有行为：切模式不影响正在跑的那次请求（端点已在
   * searchParams 里快照过），只会影响 onComplete 里按实时 ref 记录的统计与历史。
   */
  function setSearchMode(mode: SearchMode) {
    if (searchMode.value !== mode) {
      playSelect()
      searchMode.value = mode
    }
  }

  /** 清除搜索输入。会经由 watch 连带清掉 store 和 URL 上的 s 参数 */
  function clearSearch() {
    searchQuery.value = ''
  }

  /** 竞态防护 #5 + #4：并发搜索的唯一入口级防护 */
  function triggerSearch() {
    if (isSearchLocked.value || searchStore.isSearching) {
      return
    }
    debouncedSearchTrigger(handleSearch)
  }

  /**
   * 供父组件（App.vue 的历史记录选择）调用。
   * 注意它**不发起搜索** —— 只回填输入框并聚焦，用户还得自己按回车。
   * URL 是手动同步的：上面那条 watch 是异步的，这里不想等它。
   */
  function searchWithParams(query: string, mode: SearchMode) {
    searchQuery.value = query
    searchMode.value = mode

    // 手动更新 URL（确保双向绑定）
    updateURLParams({
      s: query,
      mode: mode,
      api: customApi.value,
    })

    // 自动对焦到输入框
    setTimeout(() => {
      searchInputRef.value?.focus()
    }, 50)
  }

  return {
    // 状态
    searchQuery,
    customApi,
    searchMode,
    isSearchLocked,
    // 行为
    handleTyping,
    setSearchMode,
    clearSearch,
    triggerSearch,
    searchWithParams,
  }
}

/*
 * ============================================
 * 已知缺口（搬运时原样保留，不要「顺手修」）
 * ============================================
 * A. 五个 SSE 回调没有代次(generation)校验，无条件写全局 store。abort 只保证
 *    fetch 被取消，不保证已入队的回调不再执行。
 * B. abort 旧流 → 旧流走 onError('[ERR_ABORTED] 请求已取消') → 旧闭包把新搜索
 *    刚设好的状态改回去（errorMessage 被写成取消文案、isSearching 变回 false）。
 *    可达路径：onComplete 已置 isSearching=false 但响应体仍在 drain 时用户立刻再搜。
 * C. onComplete 读实时 ref 而非上面那份快照，期间若 popstate / searchWithParams
 *    改过 query 或 mode，写进历史和统计的就是错的词。
 * D. clearResults() 不重置 searchProgress，新搜索首个 onTotal 到达前会闪上次的 n/N。
 * E. 服务端发完 {"done":true} 后流不一定立刻关闭，后续 result 行仍会写进 store；
 *    此时 isSearching 已 false，store.setPlatformResult 里那段写历史的分支会被逐条触发。
 */
