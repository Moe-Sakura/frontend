// 主题配色方案类型定义
export interface ThemeColors {
  primary: string
  primaryDark: string
  accent: string
  accentDark: string
}

// 预设主题配色
export const THEME_PRESETS = {
  rose: {
    name: '玫瑰粉',
    colors: {
      primary: '#ec4899', // pink-500
      primaryDark: '#db2777', // pink-600
      accent: '#8b5cf6', // purple-500
      accentDark: '#7c3aed', // purple-600
    },
  },
  sky: {
    name: '天空蓝',
    colors: {
      primary: '#0ea5e9', // sky-500
      primaryDark: '#0284c7', // sky-600
      accent: '#06b6d4', // cyan-500
      accentDark: '#0891b2', // cyan-600
    },
  },
  emerald: {
    name: '翡翠绿',
    colors: {
      primary: '#10b981', // emerald-500
      primaryDark: '#059669', // emerald-600
      accent: '#14b8a6', // teal-500
      accentDark: '#0d9488', // teal-600
    },
  },
  amber: {
    name: '琥珀橙',
    colors: {
      primary: '#f59e0b', // amber-500
      primaryDark: '#d97706', // amber-600
      accent: '#f97316', // orange-500
      accentDark: '#ea580c', // orange-600
    },
  },
  violet: {
    name: '紫罗兰',
    colors: {
      primary: '#8b5cf6', // violet-500
      primaryDark: '#7c3aed', // violet-600
      accent: '#a855f7', // purple-500
      accentDark: '#9333ea', // purple-600
    },
  },
  red: {
    name: '热情红',
    colors: {
      primary: '#ef4444', // red-500
      primaryDark: '#dc2626', // red-600
      accent: '#f43f5e', // rose-500
      accentDark: '#e11d48', // rose-600
    },
  },
  indigo: {
    name: '靛青蓝',
    colors: {
      primary: '#6366f1', // indigo-500
      primaryDark: '#4f46e5', // indigo-600
      accent: '#8b5cf6', // violet-500
      accentDark: '#7c3aed', // violet-600
    },
  },
  fuchsia: {
    name: '洋红紫',
    colors: {
      primary: '#d946ef', // fuchsia-500
      primaryDark: '#c026d3', // fuchsia-600
      accent: '#ec4899', // pink-500
      accentDark: '#db2777', // pink-600
    },
  },
} as const

export type ThemePresetKey = keyof typeof THEME_PRESETS

// 默认主题
export const DEFAULT_THEME: ThemePresetKey = 'rose'

