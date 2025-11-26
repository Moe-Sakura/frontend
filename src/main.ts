import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// 全局基础样式（Tailwind CSS @layer base）
import './styles/base.css'

// Font Awesome - 高优先级
import '@fortawesome/fontawesome-free/css/all.min.css'

// 预加载随机图片 API
const preloadImage = new Image()
preloadImage.fetchPriority = 'high'
preloadImage.src = `https://api.illlights.com/v1/img?t=${Date.now()}`

// Pace.js 页面加载进度条 - 自动监听所有加载活动
import Pace from 'pace-js'
import 'pace-js/themes/blue/pace-theme-flash.css'

// 配置 Pace.js：启用全面监听
Pace.options = {
  ajax: true,         // 监听 AJAX 请求
  document: true,     // 监听文档加载
  eventLag: true,     // 监听事件延迟
  elements: {
    selectors: ['img', 'link', 'script', 'iframe'],  // 监听资源加载
  },
  restartOnPushState: true,   // 路由切换时重启
  restartOnRequestAfter: 500,  // 请求后重启
}

// Artalk 评论系统
import 'artalk/dist/Artalk.css'

// Fancybox - 图片灯箱和内容预览
import { Fancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
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

// 注册 Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        // Service Worker 注册成功
      })
      .catch(() => {
        // 静默处理注册失败
      })
  })
}
