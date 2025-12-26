import { ref, onMounted, onUnmounted, watchEffect, type Ref } from 'vue'


/**
 * 检测元素文本是否溢出，并设置滚动动画
 */
export function useTextScroll(elementRef: Ref<HTMLElement | null>) {
  const isOverflowing = ref(false)
  let resizeObserver: ResizeObserver | null = null

  function checkOverflow() {
    const el = elementRef.value
    if (!el) {return}

    // 检查是否溢出
    const isOver = el.scrollWidth > el.clientWidth
    isOverflowing.value = isOver

    // 添加/移除溢出类
    if (isOver) {
      el.classList.add('is-overflowing')
      // 计算滚动时长（基于文本长度）
      const duration = Math.max(5, el.scrollWidth / 50)
      el.style.setProperty('--scroll-duration', `${duration}s`)
    } else {
      el.classList.remove('is-overflowing')
    }
  }

  onMounted(() => {
    // 初始检查
    checkOverflow()

    // 监听元素大小变化
    if (elementRef.value && 'ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(checkOverflow)
      resizeObserver.observe(elementRef.value)
    }
  })

  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  })

  // 当 ref 变化时重新检查
  watchEffect(() => {
    if (elementRef.value) {
      checkOverflow()
    }
  })

  return {
    isOverflowing,
    checkOverflow,
  }
}

/**
 * 指令：自动检测溢出并添加滚动效果
 * 使用方式：v-text-scroll
 */
// 扩展类型以存储原始内容和检查函数
interface TextScrollElementExtended extends HTMLElement {
  _textScrollObserver?: ResizeObserver
  _textScrollContent?: string
  _checkOverflow?: () => void
}

export const vTextScroll = {
  mounted(el: HTMLElement) {
    const extEl = el as TextScrollElementExtended
    
    // 添加滚动容器类
    el.classList.add('text-scroll')
    
    // 保存并包装内容
    const content = el.textContent || ''
    extEl._textScrollContent = content
    el.innerHTML = `<span class="text-scroll-inner">${content}</span>`
    
    // 检查溢出
    const checkOverflow = () => {
      const inner = el.querySelector('.text-scroll-inner') as HTMLElement
      if (!inner) { return }
      
      const isOver = inner.scrollWidth > el.clientWidth
      if (isOver) {
        el.classList.add('is-overflowing')
        // 复制内容用于无缝滚动
        if (!inner.querySelector('.text-scroll-clone')) {
          const clone = document.createElement('span')
          clone.className = 'text-scroll-clone'
          clone.textContent = extEl._textScrollContent || ''
          clone.style.paddingLeft = '2rem'
          inner.appendChild(clone)
        }
        // 计算滚动时长
        const duration = Math.max(5, inner.scrollWidth / 80)
        el.style.setProperty('--scroll-duration', `${duration}s`)
      } else {
        el.classList.remove('is-overflowing')
        // 移除克隆
        const clone = inner.querySelector('.text-scroll-clone')
        if (clone) { clone.remove() }
      }
    }
    
    extEl._checkOverflow = checkOverflow
    
    // 初始检查
    requestAnimationFrame(checkOverflow)
    
    // 监听大小变化
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(checkOverflow)
      observer.observe(el)
      extEl._textScrollObserver = observer
    }
  },
  
  updated(el: HTMLElement) {
    const extEl = el as TextScrollElementExtended
    
    // 检查内容是否变化
    requestAnimationFrame(() => {
      // 获取当前实际文本内容（排除克隆的内容）
      const inner = el.querySelector('.text-scroll-inner') as HTMLElement
      let currentContent = ''
      
      if (inner) {
        // 获取不包含克隆的文本
        const clone = inner.querySelector('.text-scroll-clone')
        if (clone) {
          currentContent = inner.textContent?.replace(clone.textContent || '', '') || ''
        } else {
          currentContent = inner.textContent || ''
        }
      } else {
        // 内容被 Vue 重新渲染，需要重新包装
        currentContent = el.textContent || ''
      }
      
      // 如果内容变化或结构被破坏，重新初始化
      if (!inner || currentContent !== extEl._textScrollContent) {
        const newContent = el.textContent || ''
        extEl._textScrollContent = newContent
        el.innerHTML = `<span class="text-scroll-inner">${newContent}</span>`
      }
      
      // 重新检查溢出
      if (extEl._checkOverflow) {
        extEl._checkOverflow()
      }
    })
  },
  
  unmounted(el: HTMLElement) {
    const extEl = el as TextScrollElementExtended
    if (extEl._textScrollObserver) {
      extEl._textScrollObserver.disconnect()
    }
  },
}
