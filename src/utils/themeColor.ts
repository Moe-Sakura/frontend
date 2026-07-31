/**
 * 主题色应用
 *
 * 把选中的预设写成 CSS 变量挂到 <html> 的行内样式上，覆盖 styles/theme.css
 * 中的默认值。
 *
 * 只写与亮/暗无关的主色系变量：--bg-* / --text-* / --shadow-glow 之类会被
 * `.dark` 规则覆写，而行内样式的优先级高于任何选择器，写进去会把暗色模式顶掉。
 */

import { getThemePreset, type ThemePreset } from '@/config/themePresets'

interface Rgb { r: number; g: number; b: number }
interface Hsl { h: number; s: number; l: number }

/** 各色调相对主色的明度偏移（百分点）；pale 直接取固定高明度 */
const SHADE_STEPS = {
  light: 12,
  lighter: 24,
  dark: -12,
  darker: -24,
} as const

const PALE_LIGHTNESS = 94

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

/** `#ff1493` / `#f19` → { r, g, b }；解析失败返回 null */
export function hexToRgb(hex: string): Rgb | null {
  const normalized = hex.trim().replace(/^#/, '')
  const full = normalized.length === 3
    ? normalized.split('').map(c => c + c).join('')
    : normalized

  if (!/^[0-9a-f]{6}$/i.test(full)) {return null}

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  }
}

function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const delta = max - min
  const l = (max + min) / 2

  if (delta === 0) {return { h: 0, s: 0, l: l * 100 }}

  const s = delta / (1 - Math.abs(2 * l - 1))
  let h: number
  if (max === rn) {
    h = ((gn - bn) / delta) % 6
  } else if (max === gn) {
    h = (bn - rn) / delta + 2
  } else {
    h = (rn - gn) / delta + 4
  }
  h *= 60
  if (h < 0) {h += 360}

  return { h, s: s * 100, l: l * 100 }
}

function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100
  const ln = l / 100
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = ln - c / 2

  let rgb: [number, number, number]
  if (h < 60) {rgb = [c, x, 0]}
  else if (h < 120) {rgb = [x, c, 0]}
  else if (h < 180) {rgb = [0, c, x]}
  else if (h < 240) {rgb = [0, x, c]}
  else if (h < 300) {rgb = [x, 0, c]}
  else {rgb = [c, 0, x]}

  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  }
}

/** { r, g, b } → `"255, 20, 147"`（CSS 变量里存三元组，便于 rgba() 叠加透明度） */
function toTriplet({ r, g, b }: Rgb): string {
  return `${r}, ${g}, ${b}`
}

/** 在 HSL 空间平移明度，得到同色相的深浅变体 */
function shiftLightness(base: Hsl, delta: number): Rgb {
  return hslToRgb({ ...base, l: clamp(base.l + delta, 0, 100) })
}

/**
 * 由主色/辅助色推导出全部主色系 CSS 变量
 * 导出以便单测或调试时直接查看推导结果
 */
export function buildThemeVars(preset: ThemePreset): Record<string, string> {
  const primaryRgb = hexToRgb(preset.primary)
  const accentRgb = hexToRgb(preset.accent)

  // 预设写错颜色时不要把页面搞崩，直接放弃本次推导
  if (!primaryRgb || !accentRgb) {
    console.warn(`[themeColor] 预设 "${preset.key}" 颜色值非法，已忽略`)
    return {}
  }

  const primaryHsl = rgbToHsl(primaryRgb)
  const accentHsl = rgbToHsl(accentRgb)

  return {
    '--brand-primary': toTriplet(primaryRgb),
    '--brand-primary-light': toTriplet(shiftLightness(primaryHsl, SHADE_STEPS.light)),
    '--brand-primary-lighter': toTriplet(shiftLightness(primaryHsl, SHADE_STEPS.lighter)),
    '--brand-primary-pale': toTriplet(hslToRgb({ ...primaryHsl, l: PALE_LIGHTNESS })),
    '--brand-primary-dark': toTriplet(shiftLightness(primaryHsl, SHADE_STEPS.dark)),
    '--brand-primary-darker': toTriplet(shiftLightness(primaryHsl, SHADE_STEPS.darker)),
    '--brand-accent': toTriplet(accentRgb),
    '--brand-accent-light': toTriplet(shiftLightness(accentHsl, SHADE_STEPS.light)),
    '--brand-accent-dark': toTriplet(shiftLightness(accentHsl, SHADE_STEPS.dark)),
  }
}

/**
 * 应用主题色到页面
 * @param key 预设 key，非法值会回退到默认预设
 */
export function applyThemeColor(key: string): void {
  const preset = getThemePreset(key)
  const vars = buildThemeVars(preset)
  const root = document.documentElement

  for (const [name, value] of Object.entries(vars)) {
    root.style.setProperty(name, value)
  }

  // 供 CSS/调试按主题色做条件样式，例如 html[data-theme-color="blue"]
  root.dataset.themeColor = preset.key
}
