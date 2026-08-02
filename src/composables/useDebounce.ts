/**
 * 防抖和节流 composable
 */

import { ref } from 'vue'

/**
 * 防抖函数
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends(...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn 需要节流的函数
 * @param delay 间隔时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends(...args: Parameters<T>) => ReturnType<T>>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return (...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = delay - (now - lastCall)

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCall = now
      fn(...args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now()
        timeoutId = null
        fn(...args)
      }, remaining)
    }
  }
}

/**
 * 防抖 composable
 * @param delay 延迟时间（毫秒）
 */
export function useDebounce(delay = 300) {
  const isDebouncing = ref(false)
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  function run<T extends(...args: Parameters<T>) => ReturnType<T>>(
    fn: T,
    ...args: Parameters<T>
  ) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    isDebouncing.value = true
    timeoutId = setTimeout(() => {
      fn(...args)
      isDebouncing.value = false
      timeoutId = null
    }, delay)
  }

  function cancel() {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    isDebouncing.value = false
  }

  return {
    isDebouncing,
    run,
    cancel,
    debounce: <T extends (...args: Parameters<T>) => ReturnType<T>>(fn: T) =>
      debounce(fn, delay),
  }
}

/**
 * 防抖点击 - 防止按钮被快速连续点击
 * @param delay 延迟时间（毫秒）
 */
export function useDebouncedClick(delay = 500) {
  const isLocked = ref(false)

  function click<T extends(...args: Parameters<T>) => ReturnType<T>>(
    fn: T,
    ...args: Parameters<T>
  ) {
    if (isLocked.value) {return}
    isLocked.value = true
    fn(...args)
    setTimeout(() => {
      isLocked.value = false
    }, delay)
  }

  return {
    isLocked,
    click,
  }
}

