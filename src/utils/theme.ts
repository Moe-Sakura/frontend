/**
 * 主题管理工具
 * 支持白天/黑夜模式和跟随系统
 */

export type ThemeMode = 'light' | 'dark' | 'auto'

const THEME_STORAGE_KEY = 'searchgal_theme'

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
 * 获取当前应该应用的主题（考虑 auto 模式）
 */
export function getEffectiveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'auto') {
    return getSystemTheme()
  }
  return mode
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
 * 保存主题偏好
 */
export function saveThemePreference(mode: ThemeMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch (error) {
    // 静默处理
  }
}

/**
 * 加载主题偏好
 */
export function loadThemePreference(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      return saved
    }
  } catch (error) {
    // 静默处理
  }
  return 'auto' // 默认跟随系统
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

