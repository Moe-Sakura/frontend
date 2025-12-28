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
    // 降级到旧的 API（兼容旧浏览器）
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    mediaQuery.addListener(handler)
    // eslint-disable-next-line @typescript-eslint/no-deprecated
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
    console.error('保存自定义 CSS 失败:', error)
  }
}

/**
 * 加载自定义CSS
 */
export function loadCustomCSS(): string {
  try {
    return localStorage.getItem(CUSTOM_CSS_STORAGE_KEY) || ''
  } catch (error) {
    console.error('加载自定义 CSS 失败:', error)
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

/**
 * 应用自定义JS到页面
 */
export function applyCustomJS(js: string): void {
  // 移除旧的自定义脚本
  const oldScript = document.getElementById('custom-user-scripts')
  if (oldScript) {
    oldScript.remove()
  }
  
  // 如果有新的JS，执行脚本
  if (js.trim()) {
    try {
      // 使用 Function 构造器创建并执行脚本（用户自定义脚本功能）
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const script = new Function(js)
      script()
    } catch (error) {
      console.error('自定义脚本执行失败:', error)
    }
  }
}

/**
 * 应用自定义HTML到页面
 * 
 * 注意：此功能有意允许用户注入任意 HTML（包括脚本），类似于浏览器开发者工具
 * 或用户脚本扩展 (Tampermonkey)。用户在设置面板中已被警告安全风险。
 * 这是高级用户功能，不需要 HTML 清理。
 */
export function applyCustomHTML(html: string): void {
  // 移除旧的自定义 HTML 容器
  const oldContainer = document.getElementById('custom-user-html')
  if (oldContainer) {
    oldContainer.remove()
  }
  
  // 如果有新的 HTML，添加到页面
  if (html.trim()) {
    const container = document.createElement('div')
    container.id = 'custom-user-html'
    // 有意使用 innerHTML 允许用户完全控制（类似开发者工具）
    container.innerHTML = html
    document.body.appendChild(container)
  }
}

