/**
 * PrismJS 类型声明
 */

declare module 'prismjs/components/prism-core' {
  interface Token {
    type: string
    content: string | Token[]
    alias?: string
  }

  type Grammar = Record<string, RegExp | GrammarEntry | (RegExp | GrammarEntry)[]>;

  interface GrammarEntry {
    pattern: RegExp
    lookbehind?: boolean
    greedy?: boolean
    alias?: string
    inside?: Grammar
  }

  // 命名导出
  export const languages: Record<string, Grammar>
  export function highlight(text: string, grammar: Grammar, language: string): string
  export function tokenize(text: string, grammar: Grammar): (string | Token)[]
  export function highlightAll(async?: boolean, callback?: () => void): void
  export function highlightElement(element: Element, async?: boolean, callback?: () => void): void
  export function highlightAllUnder(container: Element, async?: boolean, callback?: () => void): void
}

declare module 'prismjs/components/prism-css' {
  // CSS 语言扩展
}

declare module 'prismjs/components/prism-clike' {
  // C-like 语言扩展
}

declare module 'prismjs/components/prism-javascript' {
  // JavaScript 语言扩展
}

declare module 'prismjs/components/prism-markup' {
  // Markup (HTML) 语言扩展
}

declare module 'prismjs/themes/prism-tomorrow.css' {
  // Prism Tomorrow 主题
}

