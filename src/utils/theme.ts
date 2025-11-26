/**
 * 主题管理工具
 * 自动跟随系统主题
 */

const CUSTOM_CSS_STORAGE_KEY = 'searchgal_custom_css'

/**
 * 获取系统主题偏好
 */
export function getSystemTheme(): 'light' | 'dark' {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/**
 * 应用主题到 DOM
 */
export function applyTheme(theme: 'light' | 'dark'): void {
  const root = document.documentElement
  
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }
}

/**
 * 监听系统主题变化
 */
export function watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? 'dark' : 'light')
  }
  
  // 使用新的 API（如果可用）
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  } else {
    // 降级到旧的 API
    mediaQuery.addListener(handler)
    return () => mediaQuery.removeListener(handler)
  }
}

/**
 * 保存自定义CSS
 */
export function saveCustomCSS(css: string): void {
  try {
    localStorage.setItem(CUSTOM_CSS_STORAGE_KEY, css)
  } catch (error) {
    // 静默处理
  }
}

/**
 * 加载自定义CSS
 */
export function loadCustomCSS(): string {
  try {
    return localStorage.getItem(CUSTOM_CSS_STORAGE_KEY) || ''
  } catch (error) {
    return ''
  }
}

/**
 * 应用自定义CSS到页面
 */
export function applyCustomCSS(css: string): void {
  // 移除旧的自定义样式
  const oldStyle = document.getElementById('custom-user-styles')
  if (oldStyle) {
    oldStyle.remove()
  }
  
  // 如果有新的CSS，添加到页面
  if (css.trim()) {
    const style = document.createElement('style')
    style.id = 'custom-user-styles'
    style.textContent = css
    document.head.appendChild(style)
  }
}

