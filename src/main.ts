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

// 获取 UI Store 用于 SW 更新通知
const uiStore = useUIStore()
const statsStore = useStatsStore()

// 初始化 UI Store
uiStore.init()

// 记录页面浏览
statsStore.incrementPageView()

// ============================================
// Service Worker 注册与更新
// ============================================

// 显示更新提示 - 使用 UIStore 管理（由 UpdateToast 组件渲染）
function showUpdateToast() {
  uiStore.setShowUpdateToast(true)
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void (async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        console.info('[SW] Registered')

        // 新版本检测
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing
          if (!worker) {
            return
          }

          worker.addEventListener('statechange', () => {
            // 新 SW 安装完成且有旧 SW 控制页面 = 有更新
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[SW] Update available')
              // 显示更新提示（UpdateToast 组件处理倒计时和更新）
              showUpdateToast()
            }
          })
        })

        // 新 SW 激活后刷新页面
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) {
            return
          }
          refreshing = true
          console.info('[SW] New version activated, reloading...')
          window.location.reload()
        })

        // 定期检查更新（5 分钟）
        setInterval(() => { void reg.update().catch(() => { /* 静默处理 */ }) }, 5 * 60 * 1000)

        // 页面可见时检查更新
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            void reg.update().catch(() => { /* 静默处理 */ })
          }
        })
      } catch {
        // 静默处理
      }
    })()
  })
}
