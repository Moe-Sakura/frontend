/**
 * Fancybox 图片灯箱 - 懒加载优化
 * 只在用户首次点击图片时加载 Fancybox
 */

let fancyboxLoaded = false
let fancyboxPromise: Promise<void> | null = null

// Fancybox 配置
const fancyboxOptions = {
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
    type: 'classic' as const,
    autoStart: false,
  },
  // 幻灯片
  Carousel: {
    infinite: true,
    transition: 'slide' as const,
    friction: 0.8,
  },
  // 图片设置
  Images: {
    zoom: true,
    protected: true,
  },
  // 关闭设置
  closeButton: 'top' as const,
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
}

/**
 * 懒加载 Fancybox
 */
async function loadFancybox(): Promise<typeof import('@fancyapps/ui').Fancybox> {
  if (fancyboxLoaded) {
    const { Fancybox } = await import('@fancyapps/ui')
    return Fancybox
  }

  if (!fancyboxPromise) {
    fancyboxPromise = (async () => {
      // 动态加载 CSS
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = '/node_modules/@fancyapps/ui/dist/fancybox/fancybox.css'
      
      // 使用 import 加载 CSS（Vite 会处理）
      await import('@fancyapps/ui/dist/fancybox/fancybox.css')
      
      // 动态加载 JS
      const { Fancybox } = await import('@fancyapps/ui')
      
      // 绑定到所有 data-fancybox 元素
      Fancybox.bind('[data-fancybox]', fancyboxOptions)
      
      fancyboxLoaded = true
    })()
  }

  await fancyboxPromise
  const { Fancybox } = await import('@fancyapps/ui')
  return Fancybox
}

/**
 * 初始化 Fancybox 懒加载
 * 监听 data-fancybox 元素的点击事件
 */
export function initFancyboxLazy() {
  // 使用事件委托，在点击时懒加载
  document.addEventListener('click', async (e) => {
    const target = (e.target as HTMLElement).closest('[data-fancybox]')
    if (!target) {return}
    
    // 阻止默认行为
    e.preventDefault()
    e.stopPropagation()
    
    // 加载 Fancybox
    const Fancybox = await loadFancybox()
    
    // 如果是首次加载，需要手动触发打开
    if (!fancyboxLoaded) {
      // Fancybox 已经绑定，重新触发点击
      ;(target as HTMLElement).click()
    } else {
      // 获取图片源
      const src = target.getAttribute('href') || target.getAttribute('data-src') || (target as HTMLImageElement).src
      const caption = target.getAttribute('data-caption') || target.getAttribute('title') || ''
      
      // 获取同组图片
      const group = target.getAttribute('data-fancybox')
      if (group && group !== 'true') {
        // 有分组，让 Fancybox 处理
        const items = document.querySelectorAll(`[data-fancybox="${group}"]`)
        const gallery = Array.from(items).map(item => ({
          src: item.getAttribute('href') || item.getAttribute('data-src') || (item as HTMLImageElement).src,
          caption: item.getAttribute('data-caption') || item.getAttribute('title') || '',
        }))
        const startIndex = Array.from(items).indexOf(target)
        Fancybox.show(gallery, { ...fancyboxOptions, startIndex })
      } else {
        // 单张图片
        Fancybox.show([{ src, caption }], fancyboxOptions)
      }
    }
  }, { capture: true })
}

/**
 * 预加载 Fancybox（可选，用于提升用户体验）
 * 可以在用户悬停图片时调用
 */
export function preloadFancybox() {
  if (!fancyboxLoaded && !fancyboxPromise) {
    // 使用 requestIdleCallback 在空闲时预加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => loadFancybox(), { timeout: 5000 })
    } else {
      setTimeout(() => loadFancybox(), 2000)
    }
  }
}

/**
 * 手动打开 Fancybox
 */
export async function openFancybox(
  items: Array<{ src: string; caption?: string }>,
  options?: Partial<typeof fancyboxOptions>,
) {
  const Fancybox = await loadFancybox()
  Fancybox.show(items, { ...fancyboxOptions, ...options })
}

/**
 * 关闭 Fancybox
 */
export async function closeFancybox() {
  if (fancyboxLoaded) {
    const { Fancybox } = await import('@fancyapps/ui')
    Fancybox.close()
  }
}
