import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { 
  piniaLogger, 
  piniaPerformance, 
  piniaErrorHandler, 
  piniaPersistedState,
  piniaSnapshot,
  piniaSyncTabs,
} from './stores/plugins'
import { useUIStore } from './stores/ui'
import { useStatsStore } from './stores/stats'
import { useSettingsStore, DEFAULT_API_CONFIG } from './stores/settings'

// Noto Sans SC 字体（本地安装，仅加载实际使用的字重）
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-sans-sc/600.css'
import '@fontsource/noto-sans-sc/700.css'

// 全局基础样式（Tailwind CSS @layer base）
import './styles/base.css'

// 艳粉主题配色系统
import './styles/theme.css'

// 苹果同款液态玻璃效果
import './styles/glassmorphism.css'

// 自定义进度条（使用 anime.js）
import { createProgressFetch } from './composables/useProgress'

// 点击涟漪指令
import { vRipple } from './directives/vRipple'

// 文本滚动指令
import { vTextScroll } from './composables/useTextScroll'

// ============================================
// 陈旧 chunk 自愈
// ============================================
// 用户停留期间若发生了新的发版，页面里旧的 chunk 文件名已从服务器移除，
// 此时懒加载（评论区、设置面板等）请求会被 SPA 回退成 text/html，
// 浏览器拒绝将其作为 ES module 执行。Vite 会为这类失败派发 vite:preloadError，
// 这里捕获后重载一次以取回最新 HTML。用 sessionStorage 打标防止重载死循环。
// 用「上次重载时间」而非布尔标记做防护：重载后页面会重新执行本文件，
// 布尔标记若在 load 时清掉就挡不住循环——若 chunk 依然缺失会无限重载。
// 时间窗内不再重载，超过窗口（下一次发版）则重新具备自愈能力。
const RELOAD_AT_KEY = 'sg:chunk-reload-at'
const RELOAD_COOLDOWN = 10_000

window.addEventListener('vite:preloadError', (event) => {
  const last = Number(sessionStorage.getItem(RELOAD_AT_KEY) ?? 0)
  if (Date.now() - last < RELOAD_COOLDOWN) {
    // 刚重载过仍失败，说明不是版本错配，放行让错误正常抛出便于排查
    console.error('[chunk] 重载后仍无法加载资源，放弃自愈：', event)
    return
  }
  sessionStorage.setItem(RELOAD_AT_KEY, String(Date.now()))
  event.preventDefault()
  window.location.reload()
})

const app = createApp(App)

// 注册全局指令
app.directive('ripple', vRipple)
app.directive('text-scroll', vTextScroll)
const pinia = createPinia()

// 配置 Pinia 插件
pinia.use(piniaPersistedState) // 自动持久化
pinia.use(piniaPerformance)    // 性能监控
pinia.use(piniaErrorHandler)   // 错误处理
pinia.use(piniaSnapshot)       // 状态快照
pinia.use(piniaSyncTabs)       // 跨标签页同步

if (import.meta.env.DEV) {
  pinia.use(piniaLogger)       // 开发环境日志
}

app.use(pinia)

// 配置 fetch 进度条（拦截所有 fetch 请求）
createProgressFetch()

// 预加载随机图片 API（需在 Pinia 初始化后调用）
const settingsStore = useSettingsStore()
const preloadImage = new Image()
const backgroundImageApiUrl = settingsStore.settings.backgroundImageApiUrl || DEFAULT_API_CONFIG.backgroundImageApiUrl
preloadImage.src = `${backgroundImageApiUrl}?t=${Date.now()}`

app.mount('#app')

// ============================================
// Pinia Stores 初始化
// ============================================

// 获取 UI Store
const uiStore = useUIStore()
const statsStore = useStatsStore()

// 初始化 UI Store
uiStore.init()

// 记录页面浏览
statsStore.incrementPageView()

// ============================================
// Service Worker (vite-plugin-pwa)
// ============================================
// SW 注册由 vite-plugin-pwa 自动处理
// 更新提示由 UpdateToast 组件处理
