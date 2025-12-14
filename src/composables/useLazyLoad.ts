import { ref, onMounted, watch } from 'vue'
import lozad from 'lozad'
import { useLazyLoadStore } from '@/stores/lazyLoad'

// 全局 observer 实例
let globalObserver: ReturnType<typeof lozad> | null = null

/**
 * 初始化全局懒加载 observer
 */
export function initGlobalLazyLoad() {
  if (globalObserver) {return globalObserver}

  const store = useLazyLoadStore()

  globalObserver = lozad('.lozad', {
    rootMargin: '200px 0px', // 提前 200px 开始加载
    threshold: 0.1,
    enableAutoReload: true,
    load: (el) => {
      // 开始加载
      const src = el.getAttribute('data-src')
      if (src) {
        store.startLoading(src)
      }
    },
    loaded: (el) => {
      // 加载完成
      el.classList.add('lozad-loaded')
      const src = el.getAttribute('data-src') || el.getAttribute('src')
      if (src) {
        store.finishLoading(src)
      }
    },
  })

  globalObserver.observe()

  // 导出到 window 供动态内容使用
  ;(window as Window & { lozadObserver?: typeof globalObserver }).lozadObserver = globalObserver

  return globalObserver
}

/**
 * 获取全局 observer
 */
export function getGlobalObserver() {
  return globalObserver
}

/**
 * 触发懒加载（用于动态添加的元素）
 */
export function triggerLazyLoad(element?: Element | null) {
  if (!globalObserver) {
    initGlobalLazyLoad()
  }

  if (element) {
    globalObserver?.triggerLoad(element)
  } else {
    // 重新观察所有 .lozad 元素
    globalObserver?.observe()
  }
}

/**
 * 懒加载 composable - 用于组件内部
 */
export function useLazyLoad() {
  const store = useLazyLoadStore()
  const containerRef = ref<HTMLElement | null>(null)

  // 观察容器内的元素
  function observeContainer() {
    if (!containerRef.value) {return}

    const elements = containerRef.value.querySelectorAll('.lozad:not([data-loaded])')
    elements.forEach((el) => {
      triggerLazyLoad(el)
    })
  }

  onMounted(() => {
    // 确保全局 observer 已初始化
    if (!globalObserver) {
      initGlobalLazyLoad()
    }

    // 延迟观察容器
    setTimeout(observeContainer, 100)
  })

  return {
    containerRef,
    observeContainer,
    triggerLazyLoad,
    // Store 状态
    loadingCount: store.loadingCount,
    loadedCount: store.loadedCount,
    totalCount: store.totalCount,
    loadingProgress: store.loadingProgress,
    isAllLoaded: store.isAllLoaded,
  }
}

/**
 * 懒加载图片 composable - 单个图片使用
 */
export function useLazyImage(src: string) {
  const store = useLazyLoadStore()
  const imgRef = ref<HTMLImageElement | null>(null)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const hasError = ref(false)

  function load() {
    if (!imgRef.value || isLoaded.value || isLoading.value) {return}

    isLoading.value = true
    store.startLoading(src)

    const img = new Image()
    img.onload = () => {
      isLoading.value = false
      isLoaded.value = true
      store.finishLoading(src)
      if (imgRef.value) {
        imgRef.value.src = src
        imgRef.value.classList.add('lozad-loaded')
      }
    }
    img.onerror = () => {
      isLoading.value = false
      hasError.value = true
      store.finishLoading(src, true)
    }
    img.src = src
  }

  // 监听 ref 变化，自动加载
  watch(imgRef, (el) => {
    if (el && !isLoaded.value) {
      // 使用 IntersectionObserver
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            load()
            observer.disconnect()
          }
        },
        { rootMargin: '200px 0px', threshold: 0.1 },
      )
      observer.observe(el)
    }
  })

  return {
    imgRef,
    isLoaded,
    isLoading,
    hasError,
    load,
  }
}

export default useLazyLoad

