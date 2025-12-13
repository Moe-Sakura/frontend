/**
 * v-ripple 指令
 * 为元素添加 Material Design 风格的涟漪点击效果
 *
 * 使用方式：
 * <button v-ripple>点击我</button>
 * <button v-ripple="'#ff1493'">自定义颜色</button>
 */

import type { Directive, DirectiveBinding } from 'vue'

interface RippleOptions {
  color?: string
  duration?: number
  disabled?: boolean
}

function createRipple(event: MouseEvent, el: HTMLElement, options: RippleOptions) {
  if (options.disabled) {return}

  const rect = el.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 计算涟漪大小（取较大的边）
  const size = Math.max(rect.width, rect.height) * 2

  // 创建涟漪元素
  const ripple = document.createElement('span')
  ripple.className = 'ripple-effect'
  ripple.style.cssText = `
    position: absolute;
    left: ${x - size / 2}px;
    top: ${y - size / 2}px;
    width: ${size}px;
    height: ${size}px;
    background: ${options.color || 'rgba(255, 255, 255, 0.4)'};
    border-radius: 50%;
    transform: scale(0);
    opacity: 1;
    pointer-events: none;
    z-index: 9999;
    animation: ripple-animation ${options.duration || 500}ms ease-out forwards;
  `

  // 确保父元素有相对定位和 overflow hidden
  const computedStyle = window.getComputedStyle(el)
  if (computedStyle.position === 'static') {
    el.style.position = 'relative'
  }
  
  // 保存原始 overflow
  const originalOverflow = el.style.overflow
  el.style.overflow = 'hidden'

  el.appendChild(ripple)
  
  // 动画结束后移除并恢复 overflow
  ripple.addEventListener('animationend', () => {
    ripple.remove()
    if (originalOverflow) {
      el.style.overflow = originalOverflow
    }
  })
}

// 添加全局样式
function ensureRippleStyles() {
  if (document.getElementById('ripple-styles')) {return}

  const style = document.createElement('style')
  style.id = 'ripple-styles'
  style.textContent = `
    @keyframes ripple-animation {
      0% {
        transform: scale(0);
        opacity: 0.5;
      }
      50% {
        opacity: 0.3;
      }
      100% {
        transform: scale(1);
        opacity: 0;
      }
    }

    .ripple-effect {
      z-index: 9999 !important;
    }
  `
  document.head.appendChild(style)
}

export const vRipple: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    ensureRippleStyles()

    const options: RippleOptions = {}

    // 支持传入颜色字符串或选项对象
    if (typeof binding.value === 'string') {
      options.color = binding.value
    } else if (typeof binding.value === 'object') {
      Object.assign(options, binding.value)
    }

    // 检查是否禁用
    if (binding.modifiers.disabled) {
      options.disabled = true
    }

    el.addEventListener('mousedown', (event: MouseEvent) => {
      createRipple(event, el, options)
    })

    // 触摸设备支持
    el.addEventListener('touchstart', (event: TouchEvent) => {
      if (event.touches.length === 1) {
        const touch = event.touches[0]
        const mouseEvent = new MouseEvent('mousedown', {
          clientX: touch.clientX,
          clientY: touch.clientY,
        })
        createRipple(mouseEvent, el, options)
      }
    }, { passive: true })
  },
}

export default vRipple

