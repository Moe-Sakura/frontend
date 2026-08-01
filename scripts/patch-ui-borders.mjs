/**
 * 给 shadcn-vue 生成组件里的裸 border 补上显式 border-border
 *
 * 背景：shadcn 的组件大量使用裸 `border` 工具类，颜色依赖它默认注入的全局
 * 重置 `@layer base { * { @apply border-border } }`。本项目刻意没有引入那条
 * 重置 —— 它会给页面上每个元素刷上 border-color，把项目现有的裸 border /
 * border-t 从 currentColor 变成语义描边色（详见 styles/tailwind.css 末尾）。
 *
 * 这里改为逐个组件补上显式颜色：效果等价，作用域只在 components/ui/ 内部。
 *
 * 每次 `pnpm dlx shadcn-vue@latest add <组件>` 之后跑一次：
 *   node scripts/patch-ui-borders.mjs
 *
 * 幂等：已经带了描边色的类串会被跳过。
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const UI_DIR = 'src/components/ui'

/** border-<x> 里属于「宽度/边/线型」而非颜色的那些，出现了也不算已指定颜色 */
const NON_COLOR = /^border-(\d+|[xytblr]|solid|dashed|dotted|double|hidden|none|separate|collapse|spacing)$/

/** 类串里是否已有「无变体前缀」的描边颜色（有则说明作者已明确指定，不要动） */
function hasUnprefixedBorderColor(classStr) {
  return classStr.split(/\s+/).some((token) => {
    if (token.includes(':')) return false           // hover: / dark: / focus-visible: 等变体不算默认色
    if (!token.startsWith('border-')) return false
    return !NON_COLOR.test(token)
  })
}

/** 把类串里独立的 `border` 换成 `border border-border` */
function patchClassString(classStr) {
  if (!/(^|\s)border(\s|$)/.test(classStr)) return null
  if (hasUnprefixedBorderColor(classStr)) return null
  return classStr.replace(/(^|\s)border(\s|$)/, '$1border border-border$2')
}

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) out.push(...walk(p))
    else if (/\.(vue|ts)$/.test(name)) out.push(p)
  }
  return out
}

let changedFiles = 0
let changedStrings = 0

for (const file of walk(UI_DIR)) {
  const src = readFileSync(file, 'utf8')
  // 匹配单引号/双引号/反引号包裹的字符串字面量
  const next = src.replace(/(['"`])((?:[^\\\n]|\\.)*?)\1/g, (whole, quote, body) => {
    const patched = patchClassString(body)
    if (patched === null) return whole
    changedStrings++
    return `${quote}${patched}${quote}`
  })
  if (next !== src) {
    writeFileSync(file, next)
    changedFiles++
    console.log(`  ${file}`)
  }
}

console.log(
  changedStrings
    ? `\n补上 border-border：${changedStrings} 处，${changedFiles} 个文件`
    : '无需改动（所有裸 border 均已指定描边色）',
)
