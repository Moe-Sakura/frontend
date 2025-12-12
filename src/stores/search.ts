import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { saveSearchState, loadSearchState } from '@/utils/persistence'
import { useHistoryStore } from './history'
import { useCacheStore } from './cache'

export interface VndbVoiceActor {
  id: string
  name: string
  character?: string
}

export interface VndbTag {
  id: string
  name: string
  rating?: number
}

export interface VndbInfo {
  names: string[]
  mainName: string
  originalTitle: string
  mainImageUrl: string | null
  screenshotUrl: string | null
  description: string | null
  va: VndbVoiceActor[]
  vntags: VndbTag[]
  play_hours: number
  length_minute: number
  length_votes: number
  length_color: string
  book_length: string
}

export interface SearchResult {
  platform: string
  title: string
  url: string
  tags?: string[]
}

export interface PlatformData {
  name: string
  color: 'lime' | 'white' | 'gold' | 'red'
  url?: string
  items: SearchResult[]
  error: string
  displayedCount: number // 当前显示的结果数量，默认 10
}

export const useSearchStore = defineStore('search', () => {
  // 状态
  const searchQuery = ref('')
  const searchMode = ref<'game' | 'patch'>('game')
  const customApi = ref('')
  const platformResults = ref<Map<string, PlatformData>>(new Map())
  const vndbInfo = ref<VndbInfo | null>(null)
  const isSearching = ref(false)
  const searchProgress = ref({ current: 0, total: 0 })
  const errorMessage = ref('')
  const isFirstSearch = ref(true)
  const lastSearchTime = ref(0)
  const isStateRestored = ref(false)
  
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

  // 方法
  function clearResults() {
    platformResults.value.clear()
    vndbInfo.value = null
    errorMessage.value = ''
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
  
  function endSearch(success: boolean = true) {
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

  function setPlatformResult(name: string, data: PlatformData) {
    // 确保有显示数量信息，默认显示 10 个
    if (!data.displayedCount) {
      data.displayedCount = 10
    }
    platformResults.value.set(name, data)
    
    // 保存搜索历史到 historyStore
    if (searchQuery.value && !isSearching.value) {
      const resultCount = Array.from(platformResults.value.values())
        .reduce((sum, platform) => sum + platform.items.length, 0)
      
      historyStore.addHistory({
        query: searchQuery.value,
        mode: searchMode.value,
        resultCount,
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
    // 计算属性
    hasResults,
    isVndbMode,
    searchDisabled,
    // 方法
    clearResults,
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
