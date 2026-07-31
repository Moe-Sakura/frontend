import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { saveSearchState, loadSearchState } from '@/utils/persistence'
import { useHistoryStore } from './history'
import { useCacheStore } from './cache'
import type { VndbInfo, PlatformData, PlatformResult } from '@/types/vndb'

// 重新导出类型，保持向后兼容
export type { 
  VndbInfo, 
  VndbVoiceActor, 
  VndbTag, 
  VndbRelation, 
  VndbExtLink, 
  VndbDeveloper, 
  VndbCharacter, 
  VndbQuote,
  SearchResult,
  PlatformData,
} from '@/types/vndb'

export const useSearchStore = defineStore('search', () => {
  // 状态
  const searchQuery = ref('')
  const searchMode = ref<'game' | 'patch'>('game')
  const customApi = ref('')
  const platformResults = ref(new Map<string, PlatformData>())
  const vndbInfo = ref<VndbInfo | null>(null)
  const isSearching = ref(false)
  const searchProgress = ref({ current: 0, total: 0 })
  const errorMessage = ref('')
  const isFirstSearch = ref(true)
  const lastSearchTime = ref(0)
  const isStateRestored = ref(false)

  // 结果筛选：空字符串表示「全部」
  const channelFilter = ref('')
  const methodFilter = ref('')

  // 获取其他 stores
  const historyStore = useHistoryStore()
  const cacheStore = useCacheStore()

  // 尝试恢复保存的状态
  function restoreState() {
    if (isStateRestored.value) {return}
    
    const savedState = loadSearchState()
    if (savedState) {
      searchQuery.value = savedState.searchQuery
      searchMode.value = savedState.searchMode
      customApi.value = savedState.customApi
      vndbInfo.value = savedState.vndbInfo
      
      // 恢复平台结果
      platformResults.value = new Map(savedState.platformResults)
      
      isFirstSearch.value = false
    }
    
    isStateRestored.value = true
  }

  // 自动保存状态（防抖）
  let saveTimeout: number | null = null
  function autoSaveState() {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    
    saveTimeout = window.setTimeout(() => {
      // 只在有搜索结果时保存
      if (platformResults.value.size > 0) {
        saveSearchState({
          searchQuery: searchQuery.value,
          searchMode: searchMode.value,
          customApi: customApi.value,
          platformResults: Array.from(platformResults.value.entries()),
          vndbInfo: vndbInfo.value,
        })
      }
    }, 1000) // 1秒防抖
  }

  // 监听状态变化，自动保存
  watch([searchQuery, searchMode, customApi, platformResults, vndbInfo], () => {
    if (isStateRestored.value) {
      autoSaveState()
    }
  }, { deep: true })

  // 计算属性
  const hasResults = computed(() => platformResults.value.size > 0)
  const isVndbMode = computed(() => !!vndbInfo.value?.screenshotUrl)
  const searchDisabled = computed(() => {
    const now = Date.now()
    const COOLDOWN_MS = 30 * 1000
    return isSearching.value || (now - lastSearchTime.value < COOLDOWN_MS)
  })
  const totalResults = computed(() =>
    Array.from(platformResults.value.values())
      .reduce((sum, platform) => sum + platform.items.length, 0),
  )

  /**
   * 站点所含的全部标签
   * 后端把标签挂在每个条目上，但同站点的条目标签一致，所以取并集即站点标签。
   */
  function getPlatformTags(platform: PlatformData): string[] {
    const tags = new Set<string>()
    for (const item of platform.items) {
      item.tags?.forEach(tag => tags.add(tag))
    }
    return Array.from(tags)
  }

  /** 当前结果中真实出现过的标签，用于只渲染有意义的筛选项 */
  const availableTags = computed(() => {
    const tags = new Set<string>()
    for (const platform of platformResults.value.values()) {
      getPlatformTags(platform).forEach(tag => tags.add(tag))
    }
    return tags
  })

  /** 应用筛选后的站点结果；未选任何筛选时原样返回，避免无谓的 Map 拷贝 */
  const filteredPlatformResults = computed(() => {
    if (!channelFilter.value && !methodFilter.value) {
      return platformResults.value
    }

    const filtered = new Map<string, PlatformData>()
    for (const [name, platform] of platformResults.value.entries()) {
      const tags = getPlatformTags(platform)
      if (channelFilter.value && !tags.includes(channelFilter.value)) {continue}
      if (methodFilter.value && !tags.includes(methodFilter.value)) {continue}
      filtered.set(name, platform)
    }
    return filtered
  })

  const isFiltering = computed(() => !!channelFilter.value || !!methodFilter.value)

  const filteredPlatformCount = computed(() => filteredPlatformResults.value.size)

  // 方法
  function clearResults() {
    platformResults.value.clear()
    vndbInfo.value = null
    errorMessage.value = ''
    resetFilters()
  }

  /** 设置筛选；传入当前已选值则取消该项（再次点击同一 chip = 取消） */
  function setChannelFilter(tag: string) {
    channelFilter.value = channelFilter.value === tag ? '' : tag
  }

  function setMethodFilter(tag: string) {
    methodFilter.value = methodFilter.value === tag ? '' : tag
  }

  function resetFilters() {
    channelFilter.value = ''
    methodFilter.value = ''
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  function setSearchMode(mode: 'game' | 'patch') {
    searchMode.value = mode
  }

  function setCustomApi(api: string) {
    customApi.value = api
  }
  
  function setVndbInfo(info: VndbInfo | null) {
    vndbInfo.value = info
    
    // 缓存 VNDB 信息
    if (info && searchQuery.value) {
      cacheStore.cacheVndbInfo(searchQuery.value, info)
    }
  }
  
  function startSearch() {
    isSearching.value = true
    errorMessage.value = ''
    clearResults()
  }
  
  function endSearch(success = true) {
    isSearching.value = false
    lastSearchTime.value = Date.now()
    
    if (success && isFirstSearch.value) {
      isFirstSearch.value = false
    }
  }
  
  function setSearchError(error: string) {
    errorMessage.value = error
    isSearching.value = false
  }
  
  function setSearchProgress(current: number, total: number) {
    searchProgress.value = { current, total }
  }

  function setPlatformResult(name: string, data: PlatformResult) {
    // 转换为 PlatformData，添加默认显示数量
    const platformData: PlatformData = {
      ...data,
      displayedCount: 10,
    }
    platformResults.value.set(name, platformData)
    
    // 保存搜索历史到 historyStore
    if (searchQuery.value && !isSearching.value) {
      historyStore.addHistory({
        query: searchQuery.value,
        mode: searchMode.value,
        resultCount: totalResults.value,
      })
    }
  }

  function loadMoreResults(platformName: string, count: number) {
    const platform = platformResults.value.get(platformName)
    if (platform) {
      platform.displayedCount = Math.min(
        platform.items.length,
        (platform.displayedCount || 10) + count,
      )
      platformResults.value.set(platformName, { ...platform })
    }
  }

  return {
    // 状态
    searchQuery,
    searchMode,
    customApi,
    platformResults,
    vndbInfo,
    isSearching,
    searchProgress,
    errorMessage,
    isFirstSearch,
    lastSearchTime,
    isStateRestored,
    channelFilter,
    methodFilter,
    // 计算属性
    hasResults,
    isVndbMode,
    searchDisabled,
    totalResults,
    availableTags,
    filteredPlatformResults,
    isFiltering,
    filteredPlatformCount,
    // 方法
    clearResults,
    setChannelFilter,
    setMethodFilter,
    resetFilters,
    setSearchQuery,
    setSearchMode,
    setCustomApi,
    setVndbInfo,
    startSearch,
    endSearch,
    setSearchError,
    setSearchProgress,
    setPlatformResult,
    loadMoreResults,
    restoreState,
  }
})
