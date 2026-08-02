/**
 * 预设主题色
 *
 * 只需给出主色与渐变末端的辅助色，其余深浅色调（light / lighter / pale /
 * dark / darker）由 `src/utils/themeColor.ts` 按 HSL 明度推导，无需手工调色。
 *
 * 新增预设：往 THEME_PRESETS 里追加一项即可，调色盘会自动多出一个色块。
 */

export interface ThemePreset {
  /** 持久化用的唯一标识，请勿随意修改（改了会让老用户的选择失效） */
  key: string
  /** 调色盘上的中文名 */
  label: string
  /** 主色（十六进制） */
  primary: string
  /** 渐变末端辅助色（十六进制） */
  accent: string
}

/** 默认预设：艳粉，与 styles/theme.css 中 :root 的默认值保持一致 */
const SAKURA: ThemePreset = { key: 'sakura', label: '艳粉', primary: '#ff1493', accent: '#d946ef' }

export const THEME_PRESETS: readonly ThemePreset[] = [
  SAKURA,
  { key: 'berry', label: '莓红', primary: '#e7497a', accent: '#f472b6' },
  { key: 'coffee', label: '咖褐', primary: '#614b3e', accent: '#a1785c' },
  { key: 'amber', label: '琥珀', primary: '#f8b125', accent: '#fb923c' },
  { key: 'green', label: '青绿', primary: '#88bf1b', accent: '#4ade80' },
  { key: 'blue', label: '晴蓝', primary: '#019ae8', accent: '#38bdf8' },
  { key: 'indigo', label: '靛蓝', primary: '#4f54da', accent: '#818cf8' },
] as const

export const DEFAULT_THEME_PRESET = SAKURA.key

/** 六位十六进制颜色，取色器存的就是这个形式 */
const HEX_RE = /^#[0-9a-f]{6}$/i

/** 存的是自定义颜色（取色器）还是预设 key */
export function isCustomColor(value: string | undefined | null): boolean {
  return typeof value === 'string' && HEX_RE.test(value.trim())
}

/**
 * 自定义颜色只给了主色，辅助色按预设里的规律推导。
 *
 * 七个预设的色相差是手挑的（-36° 到 +62°，青绿是刻意的例外），没有规律；
 * 但明度差很稳定 —— accent 一律比 primary 亮 5~19 个百分点，均值约 14。
 * 所以这里保持色相、抬明度、略降饱和，得到的辅助色与手挑预设观感一致。
 */
export function deriveAccent(primaryHex: string): string {
  const hex = primaryHex.trim().replace(/^#/, '')
  const r = parseInt(hex.slice(0, 2), 16) / 255
  const g = parseInt(hex.slice(2, 4), 16) / 255
  const b = parseInt(hex.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  let h = 0
  if (delta !== 0) {
    if (max === r) { h = ((g - b) / delta) % 6 }
    else if (max === g) { h = (b - r) / delta + 2 }
    else { h = (r - g) / delta + 4 }
    h = (h * 60 + 360) % 360
  }

  const accentL = Math.min(0.88, l + 0.14)
  const accentS = Math.max(0, s * 0.92)

  // HSL → RGB
  const c = (1 - Math.abs(2 * accentL - 1)) * accentS
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = accentL - c / 2
  const seg = Math.floor(h / 60) % 6
  const [r1, g1, b1] = (
    [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]] as const
  )[seg] ?? [c, x, 0]

  const to255 = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${to255(r1)}${to255(g1)}${to255(b1)}`
}

/**
 * 取预设。传入的可以是预设 key，也可以是取色器给的 #rrggbb ——
 * 后者会即时合成一个预设（辅助色按 deriveAccent 推导）。
 * 都不是时回退到默认预设，保证永远有值。
 */
export function getThemePreset(key: string | undefined | null): ThemePreset {
  const found = THEME_PRESETS.find(p => p.key === key)
  if (found) { return found }

  if (typeof key === 'string' && isCustomColor(key)) {
    const primary = key.trim().toLowerCase()
    return { key: primary, label: '自定义', primary, accent: deriveAccent(primary) }
  }

  return SAKURA
}
