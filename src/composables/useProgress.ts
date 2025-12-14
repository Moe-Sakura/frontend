import NProgress from 'nprogress'

// NProgress 配置
NProgress.configure({
  minimum: 0.1,           // 最小进度
  easing: 'ease',         // 动画缓动函数
  speed: 400,             // 动画速度（毫秒）
  showSpinner: true,      // 显示右上角旋转图标
  trickle: true,          // 自动递增
  trickleSpeed: 200,      // 自动递增速度
  parent: 'body',         // 父元素
})

// 请求计数器（支持并发请求）
let activeRequests = 0

/**
 * 开始进度条
 */
export function startProgress() {
  activeRequests++
  if (activeRequests === 1) {
    NProgress.start()
  }
}

/**
 * 结束进度条
 */
export function doneProgress() {
  activeRequests = Math.max(0, activeRequests - 1)
  if (activeRequests === 0) {
    NProgress.done()
  }
}

/**
 * 强制完成进度条
 */
export function forceComplete() {
  activeRequests = 0
  NProgress.done(true)
}

/**
 * 设置进度值
 */
export function setProgress(n: number) {
  NProgress.set(n)
}

/**
 * 递增进度
 */
export function incProgress(amount?: number) {
  NProgress.inc(amount)
}

/**
 * 创建带进度条的 fetch 包装器
 */
export function createProgressFetch() {
  const originalFetch = window.fetch

  window.fetch = async function (...args) {
    startProgress()
    try {
      const response = await originalFetch.apply(this, args)
      return response
    } finally {
      doneProgress()
    }
  }

  return () => {
    window.fetch = originalFetch
  }
}

/**
 * 使用进度条的 composable
 */
export function useProgress() {
  return {
    start: startProgress,
    done: doneProgress,
    forceComplete,
    set: setProgress,
    inc: incProgress,
  }
}

export default NProgress

