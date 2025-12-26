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

// 显示更新提示 - 使用 UIStore 管理
function showUpdateToast(onUpdate: () => void) {
  // 通过 UIStore 显示更新通知
  uiStore.setShowUpdateToast(true)
  
  // 也创建 DOM toast 作为备份（如果 Vue 组件未加载）
  const toast = document.createElement('div')
  toast.id = 'sw-update-toast'
  toast.innerHTML = `
    <div style="
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #ff1493, #d946ef);
      color: white;
      padding: 16px 24px;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(255, 20, 147, 0.3);
      z-index: 99999;
      display: flex;
      align-items: center;
      gap: 12px;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 14px;
      animation: slideUp 0.3s ease-out;
    ">
      <span>🎉 发现新版本，<span id="sw-countdown">5</span> 秒后自动更新</span>
      <button id="sw-update-now" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
      ">立即更新</button>
    </div>
    <style>
      @keyframes slideUp {
        from { opacity: 0; transform: translateX(-50%) translateY(20px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    </style>
  `
  document.body.appendChild(toast)

  // 倒计时
  let countdown = 5
  const countdownEl = document.getElementById('sw-countdown')
  const interval = setInterval(() => {
    countdown--
    if (countdownEl) {
      countdownEl.textContent = String(countdown)
    }
    if (countdown <= 0) {
      clearInterval(interval)
      uiStore.setShowUpdateToast(false)
      onUpdate()
    }
  }, 1000)

  // 立即更新按钮
  document.getElementById('sw-update-now')?.addEventListener('click', () => {
    clearInterval(interval)
    uiStore.setShowUpdateToast(false)
    onUpdate()
  })
}

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
            console.log('[SW] Update available')
            // 显示更新提示，5 秒后自动更新
            showUpdateToast(() => {
              console.log('[SW] Activating update...')
              worker.postMessage({ type: 'SKIP_WAITING' })
            })
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
