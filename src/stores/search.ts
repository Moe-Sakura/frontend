import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface VndbInfo {
  names: string[]
  mainName: string
  originalTitle: string
  mainImageUrl: string | null
  screenshotUrl: string | null
  description: string | null
  va: any[]
  vntags: any[]
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
  items: SearchResult[]
  error: string
  currentPage: number
  itemsPerPage: number
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
  const isCommentsModalOpen = ref(false)

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

  function setPlatformResult(name: string, data: PlatformData) {
    // 确保有分页信息
    if (!data.currentPage) data.currentPage = 1
    if (!data.itemsPerPage) data.itemsPerPage = 10
    platformResults.value.set(name, data)
  }

  function setPlatformPage(platformName: string, page: number) {
    const platform = platformResults.value.get(platformName)
    if (platform) {
      platform.currentPage = page
      platformResults.value.set(platformName, { ...platform })
    }
  }

  function toggleCommentsModal() {
    isCommentsModalOpen.value = !isCommentsModalOpen.value
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
    isCommentsModalOpen,
    // 计算属性
    hasResults,
    isVndbMode,
    searchDisabled,
    // 方法
    clearResults,
    setSearchQuery,
    setSearchMode,
    setCustomApi,
    setPlatformResult,
    setPlatformPage,
    toggleCommentsModal
  }
})
