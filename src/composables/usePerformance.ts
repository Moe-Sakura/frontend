/**
 * 性能优化工具
 *
 * 原先这里有 11 个导出（cancelIdleTask / nextFrame / waitFrames /
 * prefersReducedMotion / isLowEndDevice / createScrollHandler /
 * createResizeObserver / preloadImage / preloadImages / defer），
 * 实际被引用的只有 scheduleIdleTask 一个，其余已删除。
 *
 * 其中 preloadImage / preloadImages 尤其容易误判成「在用」——
 * main.ts 里有个同名的局部变量（`const preloadImage = new Image()`），
 * stores/lazyLoad.ts 则自己又实现了一遍同名函数，两处都没有 import 这里的版本。
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
