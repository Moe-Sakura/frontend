import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useHistoryStore } from './history'
import { useCacheStore } from './cache'
import { useSearchStore } from './search'

export interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'checking' | 'unknown'
  lastChecked: number
  responseTime?: number
  url?: string
}

export interface VisitorStats {
  pv: number
  uv: number
  lastUpdated: number
}

export interface AppStats {
  // 搜索统计
  totalSearches: number
  gameSearches: number
  patchSearches: number
  avgResultCount: number
  
  // 缓存统计
  vndbCacheHits: number
  searchCacheHits: number
  imageCacheHits: number
  
  // 性能统计
  avgSearchTime: number
  lastSearchTime: number
  
  // 会话统计
  sessionStartTime: number
  pageViews: number
}

export const useStatsStore = defineStore('stats', () => {
  // ============================================
  // 状态
  // ============================================
  
  // 服务状态
  const serviceStatuses = ref<Map<string, ServiceStatus>>(new Map([
    ['api', { name: 'API 服务', status: 'unknown', lastChecked: 0, url: 'https://status.searchgal.top' }],
    ['vndb', { name: 'VNDB', status: 'unknown', lastChecked: 0, url: 'https://api.vndb.org' }],
  ]))
  
  // 访客统计（不蒜子）
  const visitorStats = ref<VisitorStats>({
    pv: 0,
    uv: 0,
    lastUpdated: 0,
  })
  
  // 应用统计
  const appStats = ref<AppStats>({
    totalSearches: 0,
    gameSearches: 0,
    patchSearches: 0,
    avgResultCount: 0,
    vndbCacheHits: 0,
    searchCacheHits: 0,
    imageCacheHits: 0,
    avgSearchTime: 0,
    lastSearchTime: 0,
    sessionStartTime: Date.now(),
    pageViews: 1,
  })
  
  // 搜索时间记录
  const searchTimes = ref<number[]>([])
  
  // 检测间隔
  let statusCheckInterval: number | null = null
  
  // ============================================
  // 计算属性
  // ============================================
  
  // 主 API 状态
  const apiStatus = computed(() => serviceStatuses.value.get('api')?.status ?? 'unknown')
  
  // 是否所有服务在线
  const allServicesOnline = computed(() => {
    for (const [, service] of serviceStatuses.value) {
      if (service.status !== 'online') {
        return false
      }
    }
    return true
  })
  
  // 离线服务数量
  const offlineServicesCount = computed(() => {
    let count = 0
    for (const [, service] of serviceStatuses.value) {
      if (service.status === 'offline') {
        count++
      }
    }
    return count
  })
  
  // 格式化的访客数
  const formattedPV = computed(() => formatNumber(visitorStats.value.pv))
  const formattedUV = computed(() => formatNumber(visitorStats.value.uv))
  
  // 会话时长（分钟）
  const sessionDuration = computed(() => {
    return Math.floor((Date.now() - appStats.value.sessionStartTime) / 60000)
  })
  
  // 搜索效率评分
  const searchEfficiencyScore = computed(() => {
    if (appStats.value.totalSearches === 0) {return 0}
    
    const cacheHitRate = (appStats.value.vndbCacheHits + appStats.value.searchCacheHits) / 
                         (appStats.value.totalSearches * 2)
    const speedScore = appStats.value.avgSearchTime > 0 
      ? Math.max(0, 100 - appStats.value.avgSearchTime / 100)
      : 50
    
    return Math.round((cacheHitRate * 50) + (speedScore * 0.5))
  })
  
  // ============================================
  // 方法
  // ============================================
  
  // 格式化数字（添加千分位）
  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return String(num)
  }
  
  // 检查单个服务状态
  async function checkServiceStatus(serviceKey: string) {
    const service = serviceStatuses.value.get(serviceKey)
    if (!service?.url) {return}
    
    // 设置为检测中
    serviceStatuses.value.set(serviceKey, {
      ...service,
      status: 'checking',
    })
    
    const startTime = performance.now()
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      await fetch(service.url, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      const responseTime = Math.round(performance.now() - startTime)
      
      serviceStatuses.value.set(serviceKey, {
        ...service,
        status: 'online',
        lastChecked: Date.now(),
        responseTime,
      })
    } catch {
      serviceStatuses.value.set(serviceKey, {
        ...service,
        status: 'offline',
        lastChecked: Date.now(),
      })
    }
  }
  
  // 检查所有服务状态
  async function checkAllServices() {
    const promises = Array.from(serviceStatuses.value.keys()).map(
      key => checkServiceStatus(key),
    )
    await Promise.allSettled(promises)
  }
  
  // 开始定期检测
  function startStatusCheck(intervalMs = 30000) {
    // 立即检测一次
    void checkAllServices()
    
    // 设置定期检测
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval)
    }
    statusCheckInterval = window.setInterval(() => {
      void checkAllServices()
    }, intervalMs)
  }
  
  // 停止定期检测
  function stopStatusCheck() {
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval)
      statusCheckInterval = null
    }
  }
  
  // 更新访客统计
  function updateVisitorStats(pv: number, uv: number) {
    visitorStats.value = {
      pv,
      uv,
      lastUpdated: Date.now(),
    }
  }
  
  // 记录搜索
  function recordSearch(mode: 'game' | 'patch', resultCount: number, duration: number) {
    appStats.value.totalSearches++
    if (mode === 'game') {
      appStats.value.gameSearches++
    } else {
      appStats.value.patchSearches++
    }
    
    // 更新平均结果数
    const total = appStats.value.totalSearches
    appStats.value.avgResultCount = Math.round(
      ((appStats.value.avgResultCount * (total - 1)) + resultCount) / total,
    )
    
    // 记录搜索时间
    searchTimes.value.push(duration)
    if (searchTimes.value.length > 50) {
      searchTimes.value.shift()
    }
    
    // 更新平均搜索时间
    appStats.value.avgSearchTime = Math.round(
      searchTimes.value.reduce((a, b) => a + b, 0) / searchTimes.value.length,
    )
    appStats.value.lastSearchTime = Date.now()
  }
  
  // 记录缓存命中
  function recordCacheHit(type: 'vndb' | 'search' | 'image') {
    if (type === 'vndb') {
      appStats.value.vndbCacheHits++
    } else if (type === 'search') {
      appStats.value.searchCacheHits++
    } else {
      appStats.value.imageCacheHits++
    }
  }
  
  // 增加页面浏览
  function incrementPageView() {
    appStats.value.pageViews++
  }
  
  // 获取综合统计
  function getComprehensiveStats() {
    const historyStore = useHistoryStore()
    const cacheStore = useCacheStore()
    const searchStore = useSearchStore()
    
    return {
      // 服务状态
      services: Object.fromEntries(serviceStatuses.value),
      allOnline: allServicesOnline.value,
      offlineCount: offlineServicesCount.value,
      
      // 访客统计
      visitors: {
        pv: visitorStats.value.pv,
        uv: visitorStats.value.uv,
        formattedPV: formattedPV.value,
        formattedUV: formattedUV.value,
      },
      
      // 搜索统计
      search: {
        total: appStats.value.totalSearches,
        game: appStats.value.gameSearches,
        patch: appStats.value.patchSearches,
        avgResults: appStats.value.avgResultCount,
        avgTime: appStats.value.avgSearchTime,
        currentResults: searchStore.totalResults,
      },
      
      // 历史统计
      history: historyStore.getHistoryStats(),
      
      // 缓存统计
      cache: {
        ...cacheStore.getCacheStats(),
        hits: {
          vndb: appStats.value.vndbCacheHits,
          search: appStats.value.searchCacheHits,
          image: appStats.value.imageCacheHits,
        },
      },
      
      // 会话统计
      session: {
        duration: sessionDuration.value,
        pageViews: appStats.value.pageViews,
        startTime: appStats.value.sessionStartTime,
      },
      
      // 效率评分
      efficiency: searchEfficiencyScore.value,
    }
  }
  
  // 重置统计
  function resetStats() {
    appStats.value = {
      totalSearches: 0,
      gameSearches: 0,
      patchSearches: 0,
      avgResultCount: 0,
      vndbCacheHits: 0,
      searchCacheHits: 0,
      imageCacheHits: 0,
      avgSearchTime: 0,
      lastSearchTime: 0,
      sessionStartTime: Date.now(),
      pageViews: 1,
    }
    searchTimes.value = []
  }
  
  // 添加自定义服务监控
  function addService(key: string, name: string, url: string) {
    serviceStatuses.value.set(key, {
      name,
      status: 'unknown',
      lastChecked: 0,
      url,
    })
  }
  
  // 移除服务监控
  function removeService(key: string) {
    serviceStatuses.value.delete(key)
  }
  
  return {
    // 状态
    serviceStatuses,
    visitorStats,
    appStats,
    searchTimes,
    
    // 计算属性
    apiStatus,
    allServicesOnline,
    offlineServicesCount,
    formattedPV,
    formattedUV,
    sessionDuration,
    searchEfficiencyScore,
    
    // 方法
    formatNumber,
    checkServiceStatus,
    checkAllServices,
    startStatusCheck,
    stopStatusCheck,
    updateVisitorStats,
    recordSearch,
    recordCacheHit,
    incrementPageView,
    getComprehensiveStats,
    resetStats,
    addService,
    removeService,
  }
})

