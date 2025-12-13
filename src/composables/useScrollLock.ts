/**
 * 滚动锁定工具
 * 解决模态框打开时禁用滚动导致的页面抖动问题
 */

// 获取滚动条宽度
function getScrollbarWidth(): number {
  // 如果没有滚动条，直接返回 0
  if (document.body.scrollHeight <= window.innerHeight) {
    return 0
  }
  
  // 创建临时元素测量滚动条宽度
  const outer = document.createElement('div')
  outer.style.visibility = 'hidden'
  outer.style.overflow = 'scroll'
  document.body.appendChild(outer)
  
  const inner = document.createElement('div')
  outer.appendChild(inner)
  
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth
  outer.remove()
  
  return scrollbarWidth
}

// 记录锁定次数（支持多个模态框同时打开）
let lockCount = 0
let originalPaddingRight = ''
let originalOverflow = ''

/**
 * 锁定页面滚动
 * 会自动补偿滚动条宽度以避免页面抖动
 */
export function lockScroll(): void {
  if (lockCount === 0) {
    const scrollbarWidth = getScrollbarWidth()
    
    // 保存原始样式
    originalPaddingRight = document.body.style.paddingRight
    originalOverflow = document.body.style.overflow
    
    // 应用锁定样式
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'
  }
  
  lockCount++
}

/**
 * 解锁页面滚动
 */
export function unlockScroll(): void {
  lockCount--
  
  if (lockCount <= 0) {
    lockCount = 0
    // 恢复原始样式
    document.body.style.paddingRight = originalPaddingRight
    document.body.style.overflow = originalOverflow
  }
}

/**
 * 强制解锁（用于组件卸载时确保恢复）
 */
export function forceUnlockScroll(): void {
  lockCount = 0
  document.body.style.paddingRight = originalPaddingRight
  document.body.style.overflow = originalOverflow
}

/**
 * Vue Composable 用法
 */
export function useScrollLock() {
  return {
    lock: lockScroll,
    unlock: unlockScroll,
    forceUnlock: forceUnlockScroll,
  }
}

