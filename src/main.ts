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

// Service Worker 更新检测
// 当前激活的 SW 版本（运行时获取）
let activatedSwVersion: string | null = null

// 获取 SW 版本
async function getSwVersion(sw: ServiceWorker): Promise<string | null> {
  return new Promise((resolve) => {
    const messageChannel = new MessageChannel()
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data?.version || null)
    }
    sw.postMessage({ type: 'GET_VERSION' }, [messageChannel.port2])

    // 超时处理
    setTimeout(() => resolve(null), 2000)
  })
}

// 检查是否有新版本
async function checkForNewVersion(registration: ServiceWorkerRegistration): Promise<boolean> {
  const sw = registration.active
  if (!sw) {return false}

  const currentVersion = await getSwVersion(sw)
  
  // 首次获取版本时记录
  if (!activatedSwVersion && currentVersion) {
    activatedSwVersion = currentVersion
    console.log(`[SW] Current version: ${activatedSwVersion}`)
    return false
  }
  
  // 版本不同则有更新
  if (currentVersion && activatedSwVersion && currentVersion !== activatedSwVersion) {
    console.log(`[SW] New version available: ${currentVersion} (was: ${activatedSwVersion})`)
    return true
  }
  
  return false
}

// 触发 SW 更新
function triggerSwUpdate(registration: ServiceWorkerRegistration) {
  const waitingSw = registration.waiting
  if (waitingSw) {
    waitingSw.postMessage({ type: 'SKIP_WAITING' })
  }
  // 刷新页面
  window.location.reload()
}

// 派发更新事件
function dispatchUpdateEvent(registration: ServiceWorkerRegistration) {
  window.dispatchEvent(new CustomEvent('sw-update-available', {
    detail: { registration },
  }))
}

// 注册 Service Worker (PWA 支持)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js')

      // 检查更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 有新版本可用
              dispatchUpdateEvent(registration)
            }
          })
        }
      })

      // 首次获取当前版本
      if (registration.active) {
        activatedSwVersion = await getSwVersion(registration.active)
        console.log(`[SW] Registered, version: ${activatedSwVersion || 'unknown'}`)
      }

      // 定期检查版本（每 5 分钟）
      setInterval(async () => {
        try {
          await registration.update()
          const hasNewVersion = await checkForNewVersion(registration)
          if (hasNewVersion) {
            dispatchUpdateEvent(registration)
          }
        } catch {
          // 静默处理检查失败
        }
      }, 5 * 60 * 1000)

      // 页面可见时检查更新
      document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'visible') {
          try {
            await registration.update()
          } catch {
            // 静默处理
          }
        }
      })

    } catch {
        // 静默处理注册失败
    }
  })
}

// 导出更新函数供组件使用
;(window as Window & { triggerSwUpdate?: typeof triggerSwUpdate }).triggerSwUpdate = triggerSwUpdate
