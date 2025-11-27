import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { VndbInfo } from './search'

interface CachedVndbInfo {
  query: string
  data: VndbInfo
  timestamp: number
  expiresAt: number
}

interface CachedSearchResults {
  query: string
  mode: 'game' | 'patch'
  data: any
  timestamp: number
  expiresAt: number
}

export const useCacheStore = defineStore('cache', () => {
  // 状态
  const vndbCache = ref<Map<string, CachedVndbInfo>>(new Map())
  const searchResultsCache = ref<Map<string, CachedSearchResults>>(new Map())
  const imageCache = ref<Map<string, string>>(new Map()) // URL -> base64
  
  // 配置
  const vndbCacheDuration = ref(30 * 60 * 1000) // 30 分钟
  const searchCacheDuration = ref(10 * 60 * 1000) // 10 分钟
  const imageCacheDuration = ref(60 * 60 * 1000) // 60 分钟
  const maxCacheSize = ref(100) // 最多缓存 100 项
  
  // 计算属性
  const vndbCacheSize = computed(() => vndbCache.value.size)
  const searchCacheSize = computed(() => searchResultsCache.value.size)
  const imageCacheSize = computed(() => imageCache.value.size)
  const totalCacheSize = computed(() => 
    vndbCacheSize.value + searchCacheSize.value + imageCacheSize.value
  )
  
  // VNDB 缓存方法
  function cacheVndbInfo(query: string, data: VndbInfo) {
    const now = Date.now()
    vndbCache.value.set(query.toLowerCase(), {
      query,
      data,
      timestamp: now,
      expiresAt: now + vndbCacheDuration.value,
    })
    
    // 限制缓存大小
    if (vndbCache.value.size > maxCacheSize.value) {
      const oldest = Array.from(vndbCache.value.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
      if (oldest) {
        vndbCache.value.delete(oldest[0])
      }
    }
  }
  
  function getVndbInfo(query: string): VndbInfo | null {
    const cached = vndbCache.value.get(query.toLowerCase())
    if (!cached) return null
    
    // 检查是否过期
    if (Date.now() > cached.expiresAt) {
      vndbCache.value.delete(query.toLowerCase())
      return null
    }
    
    return cached.data
  }
  
  function hasVndbCache(query: string): boolean {
    const cached = vndbCache.value.get(query.toLowerCase())
    if (!cached) return false
    
    if (Date.now() > cached.expiresAt) {
      vndbCache.value.delete(query.toLowerCase())
      return false
    }
    
    return true
  }
  
  function clearVndbCache() {
    vndbCache.value.clear()
  }
  
  // 搜索结果缓存方法
  function cacheSearchResults(query: string, mode: 'game' | 'patch', data: any) {
    const now = Date.now()
    const key = `${mode}:${query.toLowerCase()}`
    
    searchResultsCache.value.set(key, {
      query,
      mode,
      data,
      timestamp: now,
      expiresAt: now + searchCacheDuration.value,
    })
    
    // 限制缓存大小
    if (searchResultsCache.value.size > maxCacheSize.value) {
      const oldest = Array.from(searchResultsCache.value.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0]
      if (oldest) {
        searchResultsCache.value.delete(oldest[0])
      }
    }
  }
  
  function getSearchResults(query: string, mode: 'game' | 'patch'): any | null {
    const key = `${mode}:${query.toLowerCase()}`
    const cached = searchResultsCache.value.get(key)
    if (!cached) return null
    
    // 检查是否过期
    if (Date.now() > cached.expiresAt) {
      searchResultsCache.value.delete(key)
      return null
    }
    
    return cached.data
  }
  
  function hasSearchCache(query: string, mode: 'game' | 'patch'): boolean {
    const key = `${mode}:${query.toLowerCase()}`
    const cached = searchResultsCache.value.get(key)
    if (!cached) return false
    
    if (Date.now() > cached.expiresAt) {
      searchResultsCache.value.delete(key)
      return false
    }
    
    return true
  }
  
  function clearSearchCache() {
    searchResultsCache.value.clear()
  }
  
  // 图片缓存方法
  function cacheImage(url: string, base64: string) {
    imageCache.value.set(url, base64)
    
    // 限制缓存大小
    if (imageCache.value.size > maxCacheSize.value) {
      const firstKey = imageCache.value.keys().next().value
      if (firstKey) {
        imageCache.value.delete(firstKey)
      }
    }
  }
  
  function getImageCache(url: string): string | null {
    return imageCache.value.get(url) || null
  }
  
  function clearImageCache() {
    imageCache.value.clear()
  }
  
  // 清理过期缓存
  function cleanExpiredCache() {
    const now = Date.now()
    
    // 清理 VNDB 缓存
    for (const [key, value] of vndbCache.value.entries()) {
      if (now > value.expiresAt) {
        vndbCache.value.delete(key)
      }
    }
    
    // 清理搜索结果缓存
    for (const [key, value] of searchResultsCache.value.entries()) {
      if (now > value.expiresAt) {
        searchResultsCache.value.delete(key)
      }
    }
  }
  
  // 清除所有缓存
  function clearAllCache() {
    vndbCache.value.clear()
    searchResultsCache.value.clear()
    imageCache.value.clear()
  }
  
  // 获取缓存统计信息
  function getCacheStats() {
    return {
      vndb: {
        size: vndbCacheSize.value,
        maxSize: maxCacheSize.value,
        duration: vndbCacheDuration.value,
      },
      search: {
        size: searchCacheSize.value,
        maxSize: maxCacheSize.value,
        duration: searchCacheDuration.value,
      },
      image: {
        size: imageCacheSize.value,
        maxSize: maxCacheSize.value,
      },
      total: totalCacheSize.value,
    }
  }
  
  return {
    // 状态
    vndbCache,
    searchResultsCache,
    imageCache,
    vndbCacheDuration,
    searchCacheDuration,
    imageCacheDuration,
    maxCacheSize,
    
    // 计算属性
    vndbCacheSize,
    searchCacheSize,
    imageCacheSize,
    totalCacheSize,
    
    // 方法
    cacheVndbInfo,
    getVndbInfo,
    hasVndbCache,
    clearVndbCache,
    cacheSearchResults,
    getSearchResults,
    hasSearchCache,
    clearSearchCache,
    cacheImage,
    getImageCache,
    clearImageCache,
    cleanExpiredCache,
    clearAllCache,
    getCacheStats,
  }
})

