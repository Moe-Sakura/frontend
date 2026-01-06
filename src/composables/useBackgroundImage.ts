/**
 * 背景图片管理 composable
 * 负责从 API 获取图片、IndexedDB 缓存管理、洗牌队列、Ken Burns 动画等
 */

import { ref, computed, shallowRef } from 'vue'
import { imageDB } from '@/utils/imageDB'
import { useSettingsStore, DEFAULT_API_CONFIG } from '@/stores/settings'

// Ken Burns 动画变体类型
export type KenBurnsType = 
  | 'kb-zoom-in' 
  | 'kb-zoom-out' 
  | 'kb-pan-left' 
  | 'kb-pan-right' 
  | 'kb-pan-up' 
  | 'kb-pan-down'

// 配置常量
const CONFIG = {
  MAX_CACHE_SIZE: 10000,      // 最大缓存 10000 张图片
  CLEANUP_BATCH_SIZE: 2000,   // 每次清理 2000 张
  FETCH_INTERVAL: 5000,       // 5秒获取一次
  DISPLAY_INTERVAL: 10000,    // 10秒切换一次
  MAX_BLOB_URLS: 20,          // 最大同时保持的 Blob URL 数量
  PRELOAD_COUNT: 10,          // 预加载图片数量
} as const

// Ken Burns 效果列表
const KEN_BURNS_EFFECTS: KenBurnsType[] = [
  'kb-zoom-in',
  'kb-zoom-out',
  'kb-pan-left',
  'kb-pan-right',
  'kb-pan-up',
  'kb-pan-down',
]

export function useBackgroundImage() {
  const settingsStore = useSettingsStore()
  
  // 状态
  const currentImageUrl = ref('')
  const imageCache = shallowRef<string[]>([])
  const imageCacheSet = shallowRef<Set<string>>(new Set())
  const imageBlobUrls = shallowRef<Map<string, string>>(new Map())
  const shuffledQueue = shallowRef<string[]>([])
  const currentBgKey = ref(0)
  const currentKenBurns = ref<KenBurnsType>('kb-zoom-in')
  
  // 定时器
  let fetchInterval: number | null = null
  let displayInterval: number | null = null

  // 计算属性
  const hasBackgroundImage = computed(() => !!currentImageUrl.value)
  
  const backgroundImageUrl = computed(() => {
    if (currentImageUrl.value) {
      return imageBlobUrls.value.get(currentImageUrl.value) || currentImageUrl.value
    }
    return ''
  })
  
  const kenBurnsClass = computed(() => currentKenBurns.value)

  // 随机选择 Ken Burns 效果
  function selectRandomKenBurns() {
    currentKenBurns.value = KEN_BURNS_EFFECTS[Math.floor(Math.random() * KEN_BURNS_EFFECTS.length)]
  }

  // Fisher-Yates 洗牌算法
  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // 重新洗牌队列
  function reshuffleQueue() {
    if (imageCache.value.length > 0) {
      shuffledQueue.value = shuffleArray([...imageCache.value])
    }
  }

  // 从 IndexedDB 加载缓存
  async function loadCacheFromDB(): Promise<boolean> {
    try {
      await imageDB.init()
      const urls = await imageDB.getAllUrls()
      
      if (urls.length > 0) {
        const uniqueUrls = [...new Set(urls)]
        imageCache.value = uniqueUrls
        imageCacheSet.value = new Set(uniqueUrls)
        
        // 预加载部分图片的 Blob URL
        const preloadCount = Math.min(CONFIG.PRELOAD_COUNT, uniqueUrls.length)
        const newBlobUrls = new Map(imageBlobUrls.value)
        
        for (let i = 0; i < preloadCount; i++) {
          const url = uniqueUrls[i]
          const blob = await imageDB.getImageByUrl(url)
          if (blob) {
            const blobUrl = URL.createObjectURL(blob)
            newBlobUrls.set(url, blobUrl)
          }
        }
        imageBlobUrls.value = newBlobUrls
        
        return true
      }
    } catch {
      // 静默处理错误
    }
    return false
  }

  // 从 API 获取图片并添加到缓存
  async function fetchAndCacheImage() {
    try {
      const timestamp = Date.now()
      const baseUrl = settingsStore.settings.backgroundImageApiUrl || DEFAULT_API_CONFIG.backgroundImageApiUrl
      const apiUrl = `${baseUrl}?t=${timestamp}`
      
      const response = await fetch(apiUrl)
      if (!response.ok) {return}
      
      const finalUrl = response.url
      
      // 检查是否已存在
      if (imageCacheSet.value.has(finalUrl)) {return}
      
      const existsInDB = await imageDB.hasUrl(finalUrl)
      if (existsInDB) {return}
      
      const blob = await response.blob()
      
      // 验证是否为有效图片
      const img = new Image()
      const blobUrl = URL.createObjectURL(blob)
      
      img.onload = async () => {
        if (!imageCacheSet.value.has(finalUrl)) {
          try {
            await imageDB.addImage(finalUrl, blob)
            
            // 更新缓存
            const newCache = [...imageCache.value, finalUrl]
            const newCacheSet = new Set(imageCacheSet.value)
            newCacheSet.add(finalUrl)
            const newBlobUrls = new Map(imageBlobUrls.value)
            newBlobUrls.set(finalUrl, blobUrl)
            
            imageCache.value = newCache
            imageCacheSet.value = newCacheSet
            imageBlobUrls.value = newBlobUrls
            
            // 限制缓存大小
            await cleanupCacheIfNeeded()
            
            // 如果队列为空，重新洗牌
            if (shuffledQueue.value.length === 0) {
              reshuffleQueue()
            }
          } catch {
            URL.revokeObjectURL(blobUrl)
          }
        } else {
          URL.revokeObjectURL(blobUrl)
        }
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(blobUrl)
      }
      
      img.src = blobUrl
    } catch {
      // 静默处理错误
    }
  }

  // 清理缓存（如果超过最大大小）
  async function cleanupCacheIfNeeded() {
    const count = await imageDB.getCount()
    if (count <= CONFIG.MAX_CACHE_SIZE) {return}
    
    const deletedCount = await imageDB.deleteOldestBatch(CONFIG.CLEANUP_BATCH_SIZE)
    
    // 同步更新内存缓存
    const cleanedCache = imageCache.value.slice(deletedCount)
    const cleanedSet = new Set(cleanedCache)
    const cleanedBlobUrls = new Map<string, string>()
    
    // 清理被删除图片的 Blob URL
    for (let i = 0; i < deletedCount; i++) {
      const removed = imageCache.value[i]
      if (removed) {
        const oldBlobUrl = imageBlobUrls.value.get(removed)
        if (oldBlobUrl) {
          URL.revokeObjectURL(oldBlobUrl)
        }
      }
    }
    
    // 保留剩余的 Blob URL
    imageBlobUrls.value.forEach((url, key) => {
      if (cleanedSet.has(key)) {
        cleanedBlobUrls.set(key, url)
      }
    })
    
    imageCache.value = cleanedCache
    imageCacheSet.value = cleanedSet
    imageBlobUrls.value = cleanedBlobUrls
  }

  // 清理过多的 Blob URL 以释放内存
  function cleanupBlobUrls(currentUrl: string) {
    const blobUrls = imageBlobUrls.value
    if (blobUrls.size <= CONFIG.MAX_BLOB_URLS) {return}
    
    const newBlobUrls = new Map<string, string>()
    const currentBlobUrl = blobUrls.get(currentUrl)
    if (currentBlobUrl) {
      newBlobUrls.set(currentUrl, currentBlobUrl)
    }
    
    const entries = Array.from(blobUrls.entries())
    const toKeep = entries.slice(-CONFIG.MAX_BLOB_URLS + 1)
    
    for (const [url, blobUrl] of entries) {
      if (url !== currentUrl && !toKeep.some(([u]) => u === url)) {
        URL.revokeObjectURL(blobUrl)
      } else if (url !== currentUrl) {
        newBlobUrls.set(url, blobUrl)
      }
    }
    
    imageBlobUrls.value = newBlobUrls
  }

  // 显示下一张图片
  async function displayNextImage() {
    // 如果队列为空，重新洗牌
    if (shuffledQueue.value.length === 0) {
      if (imageCache.value.length === 0) {return}
      reshuffleQueue()
    }
    
    const queue = [...shuffledQueue.value]
    const nextImageUrl = queue.shift()
    shuffledQueue.value = queue
    
    if (!nextImageUrl) {return}
    
    try {
      // 检查是否已有 Blob URL
      let blobUrl = imageBlobUrls.value.get(nextImageUrl)
      
      // 如果没有，从 IndexedDB 加载
      if (!blobUrl) {
        const blob = await imageDB.getImageByUrl(nextImageUrl)
        if (blob) {
          blobUrl = URL.createObjectURL(blob)
          const newBlobUrls = new Map(imageBlobUrls.value)
          newBlobUrls.set(nextImageUrl, blobUrl)
          imageBlobUrls.value = newBlobUrls
        }
      }
      
      // 预加载图片
      const preloadImg = new Image()
      preloadImg.onload = () => {
        selectRandomKenBurns()
        currentImageUrl.value = nextImageUrl
        currentBgKey.value++
        cleanupBlobUrls(nextImageUrl)
      }
      preloadImg.onerror = () => {
        void displayNextImage()
      }
      preloadImg.src = blobUrl || nextImageUrl
    } catch {
      void displayNextImage()
    }
  }

  // 启动图片获取定时器
  function startFetchInterval() {
    if (fetchInterval) {
      clearInterval(fetchInterval)
    }
    
    void fetchAndCacheImage()
    
    fetchInterval = window.setInterval(() => {
      void fetchAndCacheImage()
    }, CONFIG.FETCH_INTERVAL)
  }

  // 启动图片显示定时器
  function startDisplayInterval() {
    if (displayInterval) {
      clearInterval(displayInterval)
    }
    
    void displayNextImage()
    
    displayInterval = window.setInterval(() => {
      void displayNextImage()
    }, CONFIG.DISPLAY_INTERVAL)
  }

  // 停止所有定时器
  function stopAllIntervals() {
    if (fetchInterval) {
      clearInterval(fetchInterval)
      fetchInterval = null
    }
    if (displayInterval) {
      clearInterval(displayInterval)
      displayInterval = null
    }
  }

  // 清理所有 Blob URL
  function cleanupAllBlobUrls() {
    imageBlobUrls.value.forEach(blobUrl => {
      URL.revokeObjectURL(blobUrl)
    })
    imageBlobUrls.value = new Map()
  }

  // 初始化
  async function init() {
    await imageDB.init()
    
    const hasCachedImages = await loadCacheFromDB()
    
    if (hasCachedImages) {
      reshuffleQueue()
    }
    
    startFetchInterval()
    startDisplayInterval()
  }

  // 销毁
  function destroy() {
    stopAllIntervals()
    cleanupAllBlobUrls()
    imageDB.close()
  }

  return {
    // 状态
    currentImageUrl,
    currentBgKey,
    
    // 计算属性
    hasBackgroundImage,
    backgroundImageUrl,
    kenBurnsClass,
    
    // 方法
    init,
    destroy,
  }
}

