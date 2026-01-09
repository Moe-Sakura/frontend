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

// Noto Sans SC 字体（本地安装）
import '@fontsource/noto-sans-sc/300.css'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-sans-sc/700.css'

// 全局基础样式（Tailwind CSS @layer base）
import './styles/base.css'

// 艳粉主题配色系统
import './styles/theme.css'

// 苹果同款液态玻璃效果
import './styles/glassmorphism.css'

// 自定义进度条（使用 anime.js）
import { createProgressFetch } from './composables/useProgress'

// Artalk 评论系统
import 'artalk/dist/Artalk.css'

// 点击涟漪指令
import { vRipple } from './directives/vRipple'

// 文本滚动指令
import { vTextScroll } from './composables/useTextScroll'

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
