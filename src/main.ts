import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { piniaLogger, piniaPerformance, piniaErrorHandler } from './stores/plugins'

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

// 预加载随机图片 API
const preloadImage = new Image()
preloadImage.src = `https://api.illlights.com/v1/img?t=${Date.now()}`

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
if (import.meta.env.DEV) {
  pinia.use(piniaLogger) // 开发环境日志
}
pinia.use(piniaPerformance) // 性能监控
pinia.use(piniaErrorHandler) // 错误处理

app.use(pinia)

// 配置 fetch 进度条（拦截所有 fetch 请求）
createProgressFetch()

app.mount('#app')

// ============================================
// Service Worker 注册与更新
// ============================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      console.log('[SW] Registered')

      // 新版本检测
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        if (!worker) {
          return
        }

        worker.addEventListener('statechange', () => {
          // 新 SW 安装完成且有旧 SW 控制页面 = 有更新
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] Update available, activating...')
            worker.postMessage({ type: 'SKIP_WAITING' })
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
        console.log('[SW] New version activated, reloading...')
        window.location.reload()
      })

      // 定期检查更新（5 分钟）
      setInterval(() => reg.update().catch(() => {}), 5 * 60 * 1000)

      // 页面可见时检查更新
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          reg.update().catch(() => {})
        }
      })
    } catch {
      // 静默处理
    }
  })
}
