import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface LoadingImage {
  src: string
  startTime: number
  status: 'loading' | 'loaded' | 'error'
  loadTime?: number
}

export const useLazyLoadStore = defineStore('lazyLoad', () => {
  // 状态
  const images = ref<Map<string, LoadingImage>>(new Map())
  const sessionStats = ref({
    totalLoaded: 0,
    totalErrors: 0,
    totalLoadTime: 0,
    averageLoadTime: 0,
  })

  // 计算属性
  const loadingCount = computed(() => {
    let count = 0
    images.value.forEach((img) => {
      if (img.status === 'loading') {count++}
    })
    return count
  })

  const loadedCount = computed(() => {
    let count = 0
    images.value.forEach((img) => {
      if (img.status === 'loaded') {count++}
    })
    return count
  })

  const errorCount = computed(() => {
    let count = 0
    images.value.forEach((img) => {
      if (img.status === 'error') {count++}
    })
    return count
  })

  const totalCount = computed(() => images.value.size)

  const loadingProgress = computed(() => {
    if (totalCount.value === 0) {return 100}
    return Math.round((loadedCount.value / totalCount.value) * 100)
  })

  const isAllLoaded = computed(() => loadingCount.value === 0 && totalCount.value > 0)

  const loadingImages = computed(() => {
    const result: string[] = []
    images.value.forEach((img, src) => {
      if (img.status === 'loading') {result.push(src)}
    })
    return result
  })

  // 方法
  function startLoading(src: string) {
    if (images.value.has(src)) {return}

    images.value.set(src, {
      src,
      startTime: Date.now(),
      status: 'loading',
    })
  }

  function finishLoading(src: string, hasError = false) {
    const img = images.value.get(src)
    if (!img) {return}

    const loadTime = Date.now() - img.startTime

    images.value.set(src, {
      ...img,
      status: hasError ? 'error' : 'loaded',
      loadTime,
    })

    // 更新统计
    if (hasError) {
      sessionStats.value.totalErrors++
    } else {
      sessionStats.value.totalLoaded++
      sessionStats.value.totalLoadTime += loadTime
      sessionStats.value.averageLoadTime = Math.round(
        sessionStats.value.totalLoadTime / sessionStats.value.totalLoaded,
      )
    }
  }

  function isImageLoaded(src: string): boolean {
    const img = images.value.get(src)
    return img?.status === 'loaded'
  }

  function isImageLoading(src: string): boolean {
    const img = images.value.get(src)
    return img?.status === 'loading'
  }

  function getImageStatus(src: string): 'loading' | 'loaded' | 'error' | 'unknown' {
    const img = images.value.get(src)
    return img?.status || 'unknown'
  }

  function getLoadTime(src: string): number | null {
    const img = images.value.get(src)
    return img?.loadTime ?? null
  }

  function clearStats() {
    images.value.clear()
    sessionStats.value = {
      totalLoaded: 0,
      totalErrors: 0,
      totalLoadTime: 0,
      averageLoadTime: 0,
    }
  }

  function getStats() {
    return {
      ...sessionStats.value,
      currentLoading: loadingCount.value,
      currentLoaded: loadedCount.value,
      currentErrors: errorCount.value,
      progress: loadingProgress.value,
    }
  }

  // 预加载图片
  async function preloadImage(src: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (isImageLoaded(src)) {
        resolve(true)
        return
      }

      startLoading(src)

      const img = new Image()
      img.onload = () => {
        finishLoading(src)
        resolve(true)
      }
      img.onerror = () => {
        finishLoading(src, true)
        resolve(false)
      }
      img.src = src
    })
  }

  // 批量预加载
  async function preloadImages(srcs: string[]): Promise<number> {
    const results = await Promise.all(srcs.map(preloadImage))
    return results.filter(Boolean).length
  }

  return {
    // 状态
    images,
    sessionStats,

    // 计算属性
    loadingCount,
    loadedCount,
    errorCount,
    totalCount,
    loadingProgress,
    isAllLoaded,
    loadingImages,

    // 方法
    startLoading,
    finishLoading,
    isImageLoaded,
    isImageLoading,
    getImageStatus,
    getLoadTime,
    clearStats,
    getStats,
    preloadImage,
    preloadImages,
  }
})

