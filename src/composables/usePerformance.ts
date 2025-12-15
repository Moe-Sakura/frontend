/**
 * 性能优化 Composable
 * 提供统一的性能优化工具函数
 */

/**
 * 使用 requestIdleCallback 调度低优先级任务
 * 带有降级回退支持
 */
export function scheduleIdleTask(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions,
): number {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  }
  // 降级到 setTimeout，模拟空闲时执行
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 50,
    })
  }, 16) as unknown as number
}

/**
 * 取消空闲任务
 */
export function cancelIdleTask(handle: number): void {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle)
  } else {
    clearTimeout(handle)
  }
}

/**
 * 使用 requestAnimationFrame 调度动画帧任务
 * 返回 Promise 便于 async/await 使用
 */
export function nextFrame(): Promise<DOMHighResTimeStamp> {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve)
  })
}

/**
 * 等待多个动画帧（用于确保 DOM 更新完成）
 */
export async function waitFrames(count = 2): Promise<void> {
  for (let i = 0; i < count; i++) {
    await nextFrame()
  }
}

/**
 * 检测用户是否偏好减少动效
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * 检测设备是否为低性能设备
 * 基于 hardwareConcurrency 和 deviceMemory
 */
export function isLowEndDevice(): boolean {
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { effectiveType?: string; saveData?: boolean }
  }
  
  // 检测 CPU 核心数
  const cores = navigator.hardwareConcurrency || 4
  if (cores <= 2) {return true}
  
  // 检测设备内存（Chrome 特性）
  if (nav.deviceMemory && nav.deviceMemory <= 2) {return true}
  
  // 检测网络连接类型
  if (nav.connection) {
    if (nav.connection.saveData) {return true}
    if (nav.connection.effectiveType === 'slow-2g' || 
        nav.connection.effectiveType === '2g') {
      return true
    }
  }
  
  return false
}

/**
 * 创建节流的滚动处理函数
 * 使用 requestAnimationFrame 优化
 */
export function createScrollHandler(
  callback: (scrollY: number) => void,
): () => void {
  let ticking = false
  let lastScrollY = 0

  const handler = () => {
    lastScrollY = window.scrollY
    
    if (!ticking) {
      requestAnimationFrame(() => {
        callback(lastScrollY)
        ticking = false
      })
      ticking = true
    }
  }

  return handler
}

/**
 * 创建 resize 观察器
 * 使用 ResizeObserver 替代 resize 事件
 */
export function createResizeObserver(
  element: Element,
  callback: (entry: ResizeObserverEntry) => void,
): ResizeObserver {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      callback(entry)
    }
  })
  
  observer.observe(element)
  return observer
}

/**
 * 预加载图片
 */
export function preloadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * 预加载多张图片（并发限制）
 */
export async function preloadImages(
  srcs: string[],
  concurrency = 3,
): Promise<HTMLImageElement[]> {
  const results: HTMLImageElement[] = []
  const queue = [...srcs]
  
  const worker = async () => {
    while (queue.length > 0) {
      const src = queue.shift()
      if (src) {
        try {
          const img = await preloadImage(src)
          results.push(img)
        } catch {
          // 静默处理失败的图片
        }
      }
    }
  }
  
  // 创建并发 worker
  const workers = Array.from({ length: concurrency }, () => worker())
  await Promise.all(workers)
  
  return results
}

/**
 * 延迟执行（用于非关键任务）
 */
export function defer<T>(fn: () => T, delay = 0): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(fn())
    }, delay)
  })
}
