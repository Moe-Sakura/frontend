import { THEME_PRESETS, DEFAULT_THEME, type ThemePresetKey } from '@/types/theme'

const THEME_STORAGE_KEY = 'searchgal-theme-preset'

/**
 * 应用主题颜色到 CSS 变量
 */
export function applyThemeColors(themeKey: ThemePresetKey) {
  const theme = THEME_PRESETS[themeKey]
  if (!theme) {
    return
  }

  const root = document.documentElement
  const { colors } = theme

  // 设置 CSS 变量
  root.style.setProperty('--theme-primary', colors.primary)
  root.style.setProperty('--theme-primary-dark', colors.primaryDark)
  root.style.setProperty('--theme-accent', colors.accent)
  root.style.setProperty('--theme-accent-dark', colors.accentDark)
}

/**
 * 获取当前主题
 */
export function getCurrentTheme(): ThemePresetKey {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved && saved in THEME_PRESETS) {
      return saved as ThemePresetKey
    }
  } catch {
    // 忽略错误
  }
  return DEFAULT_THEME
}

/**
 * 保存主题设置
 */
export function saveTheme(themeKey: ThemePresetKey) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeKey)
    applyThemeColors(themeKey)
  } catch {
    // 忽略错误
  }
}

/**
 * 初始化主题
 */
export function initTheme() {
  const currentTheme = getCurrentTheme()
  applyThemeColors(currentTheme)
}

/**
 * 获取主题颜色的 RGB 值（用于 Tailwind 的 opacity 修饰符）
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    return '0, 0, 0'
  }
  const r = parseInt(result[1], 16)
  const g = parseInt(result[2], 16)
  const b = parseInt(result[3], 16)
  return `${r}, ${g}, ${b}`
}

