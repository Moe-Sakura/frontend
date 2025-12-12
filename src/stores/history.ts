import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SearchHistory } from '@/utils/persistence'
import { 
  loadSearchHistory, 
  saveSearchHistory as persistSearchHistory,
  clearSearchHistory as clearPersistedSearchHistory, 
} from '@/utils/persistence'

export const useHistoryStore = defineStore('history', () => {
  // 状态
  const searchHistory = ref<SearchHistory[]>([])
  const maxHistoryItems = ref(50) // 最多保存 50 条历史
  
  // 计算属性
  const recentHistory = computed(() => 
    searchHistory.value.slice(0, 10),
  )
  
  const historyByMode = computed(() => ({
    game: searchHistory.value.filter(h => h.mode === 'game'),
    patch: searchHistory.value.filter(h => h.mode === 'patch'),
  }))
  
  const historyCount = computed(() => searchHistory.value.length)
  
  const popularQueries = computed(() => {
    const queryCount = new Map<string, number>()
    
    searchHistory.value.forEach(item => {
      const count = queryCount.get(item.query) || 0
      queryCount.set(item.query, count + 1)
    })
    
    return Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([query, count]) => ({ query, count }))
  })
  
  // 方法
  function loadHistory() {
    searchHistory.value = loadSearchHistory()
  }
  
  function addHistory(item: Omit<SearchHistory, 'timestamp'>) {
    const newItem: SearchHistory = {
      ...item,
      timestamp: Date.now(),
    }
    
    // 移除重复项（相同查询和模式）
    searchHistory.value = searchHistory.value.filter(
      h => !(h.query === newItem.query && h.mode === newItem.mode),
    )
    
    // 添加到开头
    searchHistory.value.unshift(newItem)
    
    // 限制数量
    if (searchHistory.value.length > maxHistoryItems.value) {
      searchHistory.value = searchHistory.value.slice(0, maxHistoryItems.value)
    }
    
    // 持久化
    persistSearchHistory(newItem)
  }
  
  function removeHistory(index: number) {
    searchHistory.value.splice(index, 1)
    saveHistory()
  }
  
  function removeHistoryByQuery(query: string) {
    searchHistory.value = searchHistory.value.filter(h => h.query !== query)
    saveHistory()
  }
  
  function clearHistory() {
    searchHistory.value = []
    clearPersistedSearchHistory()
  }
  
  function clearHistoryByMode(mode: 'game' | 'patch') {
    searchHistory.value = searchHistory.value.filter(h => h.mode !== mode)
    saveHistory()
  }
  
  function saveHistory() {
    // 由于持久化工具只能添加单条，这里重新保存所有历史
    searchHistory.value.forEach(item => {
      persistSearchHistory(item)
    })
  }
  
  function getHistoryStats() {
    const totalSearches = searchHistory.value.length
    const gameSearches = historyByMode.value.game.length
    const patchSearches = historyByMode.value.patch.length
    
    const avgResultCount = searchHistory.value.length > 0
      ? Math.round(
          searchHistory.value.reduce((sum, h) => sum + h.resultCount, 0) / 
          searchHistory.value.length,
        )
      : 0
    
    const lastSearchTime = searchHistory.value[0]?.timestamp || 0
    
    return {
      totalSearches,
      gameSearches,
      patchSearches,
      avgResultCount,
      lastSearchTime,
      popularQueries: popularQueries.value,
    }
  }
  
  // 搜索历史
  function searchInHistory(keyword: string) {
    const lowerKeyword = keyword.toLowerCase()
    return searchHistory.value.filter(h => 
      h.query.toLowerCase().includes(lowerKeyword),
    )
  }
  
  return {
    // 状态
    searchHistory,
    maxHistoryItems,
    
    // 计算属性
    recentHistory,
    historyByMode,
    historyCount,
    popularQueries,
    
    // 方法
    loadHistory,
    addHistory,
    removeHistory,
    removeHistoryByQuery,
    clearHistory,
    clearHistoryByMode,
    getHistoryStats,
    searchInHistory,
  }
})

