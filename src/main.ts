import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { piniaLogger, piniaPerformance, piniaErrorHandler } from './stores/plugins'

// 全局基础样式（Tailwind CSS @layer base）
import './styles/base.css'

// 艳粉主题配色系统
import './styles/theme.css'

// 苹果同款液态玻璃效果
import './styles/glassmorphism.css'

// 预加载随机图片 API
const preloadImage = new Image()
preloadImage.fetchPriority = 'high'
preloadImage.src = `https://api.illlights.com/v1/img?t=${Date.now()}`

// NProgress - 轻量级进度条
import './styles/nprogress.css'
import { createProgressFetch } from './composables/useProgress'

// Artalk 评论系统
import 'artalk/dist/Artalk.css'

// Fancybox - 图片灯箱和内容预览
import { Fancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

// 点击涟漪指令
import { vRipple } from './directives/vRipple'

const app = createApp(App)

// 注册全局指令
app.directive('ripple', vRipple)
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

// 初始化 Fancybox 图片灯箱
Fancybox.bind('[data-fancybox]', {
  // 动画效果
  showClass: 'f-fadeIn',
  hideClass: 'f-fadeOut',
  // 工具栏
  Toolbar: {
    display: {
      left: ['infobar'],
      middle: ['zoomIn', 'zoomOut', 'toggle1to1', 'rotateCCW', 'rotateCW', 'flipX', 'flipY'],
      right: ['slideshow', 'thumbs', 'close'],
    },
  },
  // 缩略图
  Thumbs: {
    type: 'classic',
    autoStart: false,
  },
  // 幻灯片
  Carousel: {
    infinite: true,
    transition: 'slide',
    friction: 0.8,
  },
  // 图片设置
  Images: {
    zoom: true,
    protected: true,
  },
  // 关闭设置
  closeButton: 'top',
  dragToClose: true,
  // 键盘导航
  keyboard: {
    Escape: 'close',
    Delete: 'close',
    Backspace: 'close',
    PageUp: 'next',
    PageDown: 'prev',
    ArrowUp: 'prev',
    ArrowDown: 'next',
    ArrowRight: 'next',
    ArrowLeft: 'prev',
  },
  // 预加载
  preload: 2,
  // 移动端优化
  touch: {
    vertical: true,
    momentum: true,
  },
  // 点击背景关闭
  closeExisting: false,
  trapFocus: true,
  autoFocus: true,
  placeFocusBack: true,
  // 自定义样式
  mainClass: 'fancybox-custom',
})

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

// Quicklink - 智能预加载可见链接
import { listen } from 'quicklink'

// Lozad 懒加载 - 与 Pinia store 集成
import { initGlobalLazyLoad } from './composables/useLazyLoad'

// 在页面加载完成后启用 Quicklink 和 Lozad
window.addEventListener('load', () => {
  // Quicklink 智能预加载
  listen({
    // 延迟启动（毫秒）
    delay: 500,
    // 预加载限制
    limit: 10,
    // 忽略的 URL 模式
    ignores: [
      // 忽略外部 API 链接
      /\/api\//,
      // 忽略评论系统
      /artalk/,
      // 忽略图片 API
      /illlights\.com/,
    ],
  })

  // 初始化 Lozad 懒加载（集成 Pinia store）
  initGlobalLazyLoad()
})
