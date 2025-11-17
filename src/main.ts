import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// GSAP 插件
import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

// 注册 GSAP 插件
gsap.registerPlugin(ScrollToPlugin)

// Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css'

// Material 3 Web Components
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/button/text-button.js'
import '@material/web/textfield/filled-text-field.js'
import '@material/web/textfield/outlined-text-field.js'
import '@material/web/fab/fab.js'
import '@material/web/dialog/dialog.js'
import '@material/web/list/list.js'
import '@material/web/list/list-item.js'
import '@material/web/chips/chip-set.js'
import '@material/web/chips/assist-chip.js'
import '@material/web/chips/filter-chip.js'
import '@material/web/progress/linear-progress.js'
import '@material/web/progress/circular-progress.js'
import '@material/web/icon/icon.js'
import '@material/web/iconbutton/icon-button.js'
// Card 组件在 labs 目录（实验性功能）
import '@material/web/labs/card/elevated-card.js'
import '@material/web/labs/card/filled-card.js'
import '@material/web/labs/card/outlined-card.js'
import '@material/web/divider/divider.js'
import '@material/web/ripple/ripple.js'

// Pace.js 页面加载进度条
import Pace from 'pace-js'
import 'pace-js/themes/blue/pace-theme-flash.css'

// 配置 Pace.js：禁用自动启动
Pace.options = {
  ajax: false,        // 不监听 AJAX 请求
  document: false,    // 不监听文档加载
  eventLag: false,    // 不监听事件延迟
  elements: false,    // 不监听元素
  restartOnPushState: false,
  restartOnRequestAfter: false
}

// Artalk 评论系统
import 'artalk/dist/Artalk.css'

// LightGallery
import 'lightgallery/css/lightgallery.css'

// Fancybox
import "@fancyapps/ui/dist/fancybox/fancybox.css"

// Instant.page 预加载
import 'instant.page'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount('#app')

// 注册 Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registration => {
        console.log('[SW] Service Worker registered:', registration.scope)
        
        // 检查更新
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          console.log('[SW] New Service Worker found, installing...')
          
          newWorker?.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New content available, please refresh')
              // 可以在这里显示更新提示
            }
          })
        })
      })
      .catch(error => {
        console.error('[SW] Service Worker registration failed:', error)
      })
  })
}
