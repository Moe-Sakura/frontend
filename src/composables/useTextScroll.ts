/**
 * 文本溢出滚动指令
 *
 * 原文件还导出过一个 useTextScroll(elementRef) composable，做同一件事的
 * 组合式版本，但全项目零调用点（main.ts 只注册了 vTextScroll 指令），已删除。
 */

interface TextScrollElementExtended extends HTMLElement {
  _textScrollObserver?: ResizeObserver
  _textScrollContent?: string
  _checkOverflow?: () => void
}

/**
 * 检测元素文本是否溢出，并设置滚动动画
 */
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const inner = el.querySelector('.text-scroll-inner')!
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const inner = el.querySelector('.text-scroll-inner')!
      let currentContent: string
      
      if (inner) {
        const clone = inner.querySelector('.text-scroll-clone')
        if (clone) {
          currentContent = inner.textContent?.replace(clone.textContent || '', '') || ''
        } else {
          currentContent = inner.textContent || ''
        }
      } else {
        currentContent = el.textContent || ''
      }
      
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
