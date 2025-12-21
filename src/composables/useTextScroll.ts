import { ref, onMounted, onUnmounted, watchEffect, type Ref } from 'vue'

// 扩展 HTMLElement 类型，添加自定义属性
interface TextScrollElement extends HTMLElement {
  _textScrollObserver?: ResizeObserver
}

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
export const vTextScroll = {
  mounted(el: HTMLElement) {
    // 添加滚动容器类
    el.classList.add('text-scroll')
    
    // 包装内容
    const content = el.innerHTML
    el.innerHTML = `<span class="text-scroll-inner">${content}</span>`
    
    // 检查溢出
    const checkOverflow = () => {
      const inner = el.querySelector('.text-scroll-inner') as HTMLElement
      if (!inner) {return}
      
      const isOver = inner.scrollWidth > el.clientWidth
      if (isOver) {
        el.classList.add('is-overflowing')
        // 复制内容用于无缝滚动
        if (!el.querySelector('.text-scroll-clone')) {
          const clone = inner.cloneNode(true) as HTMLElement
          clone.classList.add('text-scroll-clone')
          inner.appendChild(clone)
        }
        // 计算滚动时长
        const duration = Math.max(5, inner.scrollWidth / 80)
        el.style.setProperty('--scroll-duration', `${duration}s`)
      } else {
        el.classList.remove('is-overflowing')
        // 移除克隆
        const clone = el.querySelector('.text-scroll-clone')
        if (clone) {clone.remove()}
      }
    }
    
    // 初始检查
    requestAnimationFrame(checkOverflow)
    
    // 监听大小变化
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(checkOverflow)
      observer.observe(el)
      ;(el as TextScrollElement)._textScrollObserver = observer
    }
  },
  
  updated(el: HTMLElement) {
    // 内容更新时重新检查
    requestAnimationFrame(() => {
      const inner = el.querySelector('.text-scroll-inner') as HTMLElement
      if (!inner) {return}
      
      const isOver = inner.scrollWidth > el.clientWidth
      if (isOver) {
        el.classList.add('is-overflowing')
      } else {
        el.classList.remove('is-overflowing')
      }
    })
  },
  
  unmounted(el: HTMLElement) {
    const observer = (el as TextScrollElement)._textScrollObserver
    if (observer) {
      observer.disconnect()
    }
  },
}
