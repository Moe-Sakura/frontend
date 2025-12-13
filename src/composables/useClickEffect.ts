/**
 * 全局点击特效 composable
 * 在屏幕任意位置点击都会显示涟漪特效
 */

import { onMounted, onUnmounted } from 'vue'

// 点击特效配置
interface ClickEffectOptions {
  color?: string
  size?: number
  duration?: number
  enabled?: boolean
}

const defaultOptions: ClickEffectOptions = {
  color: 'rgba(255, 20, 147, 0.4)', // 粉色
  size: 100,
  duration: 600,
  enabled: true,
}

let isInitialized = false
let currentOptions = { ...defaultOptions }

// 创建点击特效
function createClickEffect(x: number, y: number) {
  if (!currentOptions.enabled) {return}

  const effect = document.createElement('div')
  effect.className = 'global-click-effect'
  
  const size = currentOptions.size || 100
  
  effect.style.cssText = `
    position: fixed;
    left: ${x - size / 2}px;
    top: ${y - size / 2}px;
    width: ${size}px;
    height: ${size}px;
    pointer-events: none;
    z-index: 99999;
    border-radius: 50%;
    background: radial-gradient(circle, ${currentOptions.color} 0%, transparent 70%);
    transform: scale(0);
    animation: global-click-ripple ${currentOptions.duration}ms ease-out forwards;
  `

  document.body.appendChild(effect)

  // 动画结束后移除
  effect.addEventListener('animationend', () => {
    effect.remove()
  })

  // 备用移除（防止动画事件未触发）
  setTimeout(() => {
    if (effect.parentNode) {
      effect.remove()
    }
  }, (currentOptions.duration || 600) + 100)
}

// 处理点击事件
function handleClick(event: MouseEvent) {
  // 创建涟漪效果
  createClickEffect(event.clientX, event.clientY)
}

// 处理触摸事件
function handleTouch(event: TouchEvent) {
  if (event.touches.length === 1) {
    const touch = event.touches[0]
    createClickEffect(touch.clientX, touch.clientY)
  }
}

// 注入全局样式
function injectStyles() {
  if (document.getElementById('global-click-effect-styles')) {return}

  const style = document.createElement('style')
  style.id = 'global-click-effect-styles'
  style.textContent = `
    @keyframes global-click-ripple {
      0% {
        transform: scale(0);
        opacity: 1;
      }
      50% {
        opacity: 0.6;
      }
      100% {
        transform: scale(2);
        opacity: 0;
      }
    }

    .global-click-effect {
      mix-blend-mode: screen;
    }

    .dark .global-click-effect {
      mix-blend-mode: lighten;
    }

    /* 额外的粒子效果 */
    @keyframes particle-fly {
      0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(var(--tx), var(--ty)) scale(0);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
}

// 初始化全局点击效果
function initClickEffect(options?: ClickEffectOptions) {
  if (isInitialized) {return}

  currentOptions = { ...defaultOptions, ...options }
  injectStyles()

  // 使用 mousedown 而不是 click 以获得更即时的反馈
  document.addEventListener('mousedown', handleClick, { passive: true })
  document.addEventListener('touchstart', handleTouch, { passive: true })

  isInitialized = true
}

// 销毁全局点击效果
function destroyClickEffect() {
  if (!isInitialized) {return}

  document.removeEventListener('mousedown', handleClick)
  document.removeEventListener('touchstart', handleTouch)

  const styles = document.getElementById('global-click-effect-styles')
  if (styles) {
    styles.remove()
  }

  isInitialized = false
}

// 更新选项
function updateOptions(options: Partial<ClickEffectOptions>) {
  currentOptions = { ...currentOptions, ...options }
}

// 启用/禁用
function setEnabled(enabled: boolean) {
  currentOptions.enabled = enabled
}

// Vue Composable
export function useClickEffect(options?: ClickEffectOptions) {
  onMounted(() => {
    initClickEffect(options)
  })

  onUnmounted(() => {
    // 不在这里销毁，因为可能有多个组件使用
  })

  return {
    updateOptions,
    setEnabled,
    destroy: destroyClickEffect,
  }
}

// 直接导出函数供非组件使用
export { initClickEffect, destroyClickEffect, updateOptions, setEnabled }

