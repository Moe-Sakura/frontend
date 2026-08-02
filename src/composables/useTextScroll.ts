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
 * 用滚动容器包裹文本内容
 *
 * 必须用 textContent 赋值，不能拼进 innerHTML —— Vue 渲染时已经把内容转义成
 * 文本，用 textContent 读回来拿到的是解码后的原始字符，再塞进 innerHTML 会让
 * 其中的标记被重新解析成真实 HTML。本指令作用在用户可控的搜索历史条目上
 * （SearchHistoryModal），形如 <img src=x onerror=...> 的搜索词会因此变成活的 DOM。
 */
function wrapContent(el: HTMLElement, content: string) {
  const inner = document.createElement('span')
  inner.className = 'text-scroll-inner'
  inner.textContent = content
  el.replaceChildren(inner)
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
    wrapContent(el, content)
    
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
        wrapContent(el, newContent)
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
