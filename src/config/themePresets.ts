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

/** 按 key 取预设，找不到时回退到默认预设（保证永远有值） */
export function getThemePreset(key: string | undefined | null): ThemePreset {
  return THEME_PRESETS.find(p => p.key === key) ?? SAKURA
}
