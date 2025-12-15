/**
 * 全局点击特效 composable
 * 在屏幕任意位置点击都会显示涟漪特效
 * 
 * 性能优化：
 * 1. 使用对象池复用 DOM 元素，避免频繁创建/销毁
 * 2. 使用 CSS 变量而非 inline style，减少样式计算
 * 3. 使用 requestAnimationFrame 批量处理
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

// 对象池 - 复用 DOM 元素
const effectPool: HTMLDivElement[] = []
const POOL_SIZE = 10 // 最大池大小
const activeEffects = new Set<HTMLDivElement>()

// 从池中获取或创建元素
function getEffectElement(): HTMLDivElement {
  let effect = effectPool.pop()
  
  if (!effect) {
    effect = document.createElement('div')
    effect.className = 'global-click-effect'
  }
  
  activeEffects.add(effect)
  return effect
}

// 回收元素到池中
function recycleEffect(effect: HTMLDivElement) {
  activeEffects.delete(effect)
  
  // 重置样式
  effect.classList.remove('effect-active')
  
  // 从 DOM 移除
  if (effect.parentNode) {
    effect.parentNode.removeChild(effect)
  }
  
  // 如果池未满，回收元素
  if (effectPool.length < POOL_SIZE) {
    effectPool.push(effect)
  }
}

// 创建点击特效 - 优化版本
function createClickEffect(x: number, y: number) {
  if (!currentOptions.enabled) {return}

  const effect = getEffectElement()
  const size = currentOptions.size || 100
  const halfSize = size / 2
  
  // 使用 CSS 变量设置位置和大小
  effect.style.setProperty('--effect-x', `${x - halfSize}px`)
  effect.style.setProperty('--effect-y', `${y - halfSize}px`)
  effect.style.setProperty('--effect-size', `${size}px`)
  
  // 添加到 DOM 并触发动画
  document.body.appendChild(effect)
  
  // 使用 requestAnimationFrame 确保样式已应用
  requestAnimationFrame(() => {
    effect.classList.add('effect-active')
  })

  // 动画结束后回收
  const duration = currentOptions.duration || 600
  setTimeout(() => {
    recycleEffect(effect)
  }, duration + 50)
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

// 注入全局样式 - 优化版本，使用 CSS 变量
function injectStyles() {
  if (document.getElementById('global-click-effect-styles')) {return}

  const style = document.createElement('style')
  style.id = 'global-click-effect-styles'
  style.textContent = `
    .global-click-effect {
      position: fixed;
      left: var(--effect-x, 0);
      top: var(--effect-y, 0);
      width: var(--effect-size, 100px);
      height: var(--effect-size, 100px);
      pointer-events: none;
      z-index: 99999;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(255, 20, 147, 0.4) 0%, transparent 70%);
      transform: scale(0);
      opacity: 0;
      mix-blend-mode: screen;
      will-change: transform, opacity;
      contain: strict;
    }

    .global-click-effect.effect-active {
      animation: global-click-ripple 600ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }

    .dark .global-click-effect {
      mix-blend-mode: lighten;
    }

    @keyframes global-click-ripple {
      0% {
        transform: scale(0);
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
      100% {
        transform: scale(2);
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

  // 清理所有活动特效
  activeEffects.forEach(effect => {
    if (effect.parentNode) {
      effect.parentNode.removeChild(effect)
    }
  })
  activeEffects.clear()
  
  // 清空对象池
  effectPool.length = 0

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

