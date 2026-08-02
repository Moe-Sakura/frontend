/**
 * 圆角刻度的运行时应用
 *
 * 与 utils/themeColor.ts 同一套路：把推导出的 CSS 变量写成 <html> 的内联样式，
 * 从而盖过 styles/tailwind.css 里 @theme 发射的那份默认值。
 *
 * 之所以能用一个数值驱动整套：xs ~ 3xl 相对 lg 是固定比例，见下面的
 * RADIUS_RATIO。这些比例取自迁移前 glassmorphism.css 里那套手写刻度
 * （6/8/12/16/20/24/32px），只是把它参数化成了一个可拖的百分比。
 */

/** 各档位相对基准值（= --radius-lg）的倍率 */
const RADIUS_RATIO = {
  xs: 0.375,
  sm: 0.5,
  md: 0.75,
  lg: 1,
  xl: 1.25,
  '2xl': 1.5,
  '3xl': 2,
} as const

/** 百分比 100% 对应的基准圆角（rem）。1.5rem = 24px 卡片，再大就过头了 */
const RADIUS_MAX_REM = 1.5

export const RADIUS_MIN_PERCENT = 0
export const RADIUS_MAX_PERCENT = 100

/**
 * 默认 50% = 0.75rem = 12px 卡片圆角。
 * 迁移前是写死的 1rem（16px），偏大且与 shadcn 组件的观感不搭。
 */
export const DEFAULT_RADIUS_PERCENT = 50

export function clampRadiusPercent(percent: number): number {
  if (!Number.isFinite(percent)) { return DEFAULT_RADIUS_PERCENT }
  return Math.min(RADIUS_MAX_PERCENT, Math.max(RADIUS_MIN_PERCENT, Math.round(percent)))
}

/** 百分比 → 基准圆角（rem） */
export function percentToRem(percent: number): number {
  return +(clampRadiusPercent(percent) / 100 * RADIUS_MAX_REM).toFixed(4)
}

/**
 * 按基准值推导整套圆角变量。
 *
 * 百分比为 0 时整套归零，不做任何"留一丝收口"的特殊处理 —— 拖到底就是直角，
 * 想要微圆角往回拖一点即可。混着来（比如小档位归零、大档位留 2px）只会得到
 * 按钮方得硌手、面板反而有圆角的错位观感。
 *
 * 注意 rounded-full（9999px）不在这套刻度里，头像与胶囊按钮任何取值下都保持全圆。
 */
export function buildRadiusVars(percent: number): Record<string, string> {
  const base = percentToRem(percent)
  const vars: Record<string, string> = {}

  for (const [name, ratio] of Object.entries(RADIUS_RATIO)) {
    vars[`--radius-${name}`] = `${+(base * ratio).toFixed(4)}rem`
  }

  // shadcn 组件读的是不带后缀的 --radius，等同于卡片圆角
  vars['--radius'] = vars['--radius-lg'] ?? `${base}rem`

  return vars
}

/**
 * 应用圆角到页面
 * @param percent 0–100，越界会被夹回区间
 */
export function applyRadius(percent: number): void {
  const value = clampRadiusPercent(percent)
  const root = document.documentElement

  for (const [name, css] of Object.entries(buildRadiusVars(value))) {
    root.style.setProperty(name, css)
  }

  // 供 CSS/调试按圆角做条件样式，例如 html[data-radius="0"] 判断直角
  root.dataset.radius = String(value)
}
