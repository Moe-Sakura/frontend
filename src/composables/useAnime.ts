/**
 * Anime.js v4 动画系统 - 替代 Framer Motion
 * 提供声明式动画 API，支持进入/离开动画
 */

import { animate as animeAnimate, utils, createTimeline } from 'animejs'
import { ref, onMounted, onUnmounted, watch, nextTick, type Ref, type DirectiveBinding } from 'vue'

// 动画预设 - 使用 anime.js v4 语法
export const presets = {
  // 淡入淡出
  fadeIn: { opacity: [0, 1], duration: 300, ease: 'outQuad' },
  fadeOut: { opacity: [1, 0], duration: 200, ease: 'inQuad' },
  
  // 滑入滑出
  slideUp: { opacity: [0, 1], translateY: [40, 0], duration: 400, ease: 'outCubic' },
  slideDown: { opacity: [1, 0], translateY: [0, 40], duration: 300, ease: 'inCubic' },
  slideLeft: { opacity: [0, 1], translateX: [40, 0], duration: 400, ease: 'outCubic' },
  slideRight: { opacity: [0, 1], translateX: [-40, 0], duration: 400, ease: 'outCubic' },
  
  // 缩放
  scaleIn: { opacity: [0, 1], scale: [0.95, 1], duration: 350, ease: 'outBack' },
  scaleOut: { opacity: [1, 0], scale: [1, 0.95], duration: 250, ease: 'inQuad' },
  
  // 弹性
  springIn: { opacity: [0, 1], scale: [0.9, 1], translateY: [20, 0], duration: 500, ease: 'outElastic(1, 0.5)' },
  springOut: { opacity: [1, 0], scale: [1, 0.95], translateY: [0, 20], duration: 300, ease: 'inQuad' },
  
  // 窗口动画
  windowIn: { 
    opacity: [0, 1], 
    scale: [0.98, 1], 
    translateY: [40, 0], 
    duration: 400, 
    ease: 'outCubic' 
  },
  windowOut: { 
    opacity: [1, 0], 
    scale: [1, 0.98], 
    translateY: [0, 40], 
    duration: 300, 
    ease: 'inCubic' 
  },
  
  // 卡片动画
  cardIn: { opacity: [0, 1], translateY: [30, 0], duration: 400, ease: 'outQuart' },
  
  // 按钮交互
  buttonPress: { scale: [1, 0.95], duration: 100, ease: 'outQuad' },
  buttonRelease: { scale: [0.95, 1], duration: 200, ease: 'outBack' },
  buttonHover: { scale: [1, 1.05], duration: 200, ease: 'outQuad' },
  
  // 微交互
  pulse: { scale: [1, 1.05, 1], duration: 300, ease: 'inOutQuad' },
  shake: { translateX: [0, -10, 10, -10, 10, 0], duration: 400, ease: 'inOutQuad' },
  bounce: { translateY: [0, -10, 0], duration: 400, ease: 'outBounce' },
  wiggle: { rotate: [0, -3, 3, -3, 3, 0], duration: 400, ease: 'inOutQuad' },
}

export type PresetName = keyof typeof presets

interface AnimationParams {
  opacity?: number[]
  scale?: number[] | number
  translateX?: number[] | number
  translateY?: number[] | number
  rotate?: number[]
  duration?: number
  ease?: string
  delay?: number
  complete?: () => void
}

/**
 * 执行动画 - 使用 anime.js v4 API
 */
export function animate(
  target: HTMLElement | string | NodeList | HTMLElement[],
  animation: AnimationParams | PresetName,
  options?: Partial<AnimationParams>
) {
  const params = typeof animation === 'string' 
    ? { ...presets[animation], ...options } 
    : { ...animation, ...options }
  
  const { complete, ...animParams } = params
  
  const anim = animeAnimate(target, animParams)
  
  if (complete) {
    anim.then(complete)
  }
  
  return anim
}

/**
 * 交错动画 - 用于列表项
 */
export function stagger(
  targets: HTMLElement[] | NodeList | string,
  animation: AnimationParams | PresetName,
  staggerDelay = 50,
  options?: Partial<AnimationParams>
) {
  const params = typeof animation === 'string' ? { ...presets[animation] } : { ...animation }
  const { complete, ...animParams } = { ...params, ...options }
  
  const anim = animeAnimate(targets, {
    ...animParams,
    delay: utils.stagger(staggerDelay),
  })
  
  if (complete) {
    anim.then(complete)
  }
  
  return anim
}

/**
 * 组合使用 - 进入/离开动画
 */
export function useAnimePresence(
  isVisible: Ref<boolean>,
  enterAnimation: PresetName | AnimationParams = 'fadeIn',
  exitAnimation: PresetName | AnimationParams = 'fadeOut'
) {
  const elementRef = ref<HTMLElement | null>(null)
  const isAnimating = ref(false)
  const shouldRender = ref(isVisible.value)

  watch(isVisible, async (visible) => {
    if (visible) {
      shouldRender.value = true
      await nextTick()
      if (elementRef.value) {
        isAnimating.value = true
        const params = typeof enterAnimation === 'string' ? presets[enterAnimation] : enterAnimation
        animate(elementRef.value, params, {
          complete: () => {
            isAnimating.value = false
          },
        })
      }
    } else {
      if (elementRef.value) {
        isAnimating.value = true
        const params = typeof exitAnimation === 'string' ? presets[exitAnimation] : exitAnimation
        animate(elementRef.value, params, {
          complete: () => {
            isAnimating.value = false
            shouldRender.value = false
          },
        })
      } else {
        shouldRender.value = false
      }
    }
  }, { immediate: true })

  return {
    elementRef,
    isAnimating,
    shouldRender,
  }
}

/**
 * 元素挂载动画
 */
export function useAnimeOnMount(
  animation: PresetName | AnimationParams = 'fadeIn',
  delay = 0
) {
  const elementRef = ref<HTMLElement | null>(null)

  onMounted(() => {
    if (elementRef.value) {
      const params = typeof animation === 'string' ? presets[animation] : animation
      animate(elementRef.value, params, { delay })
    }
  })

  return elementRef
}

/**
 * 交互动画 Hook
 */
export function useInteraction(elementRef: Ref<HTMLElement | null>) {
  const isHovered = ref(false)
  const isPressed = ref(false)

  function onMouseEnter() {
    isHovered.value = true
    if (elementRef.value) {
      animate(elementRef.value, 'buttonHover')
    }
  }

  function onMouseLeave() {
    isHovered.value = false
    if (elementRef.value && !isPressed.value) {
      animate(elementRef.value, { scale: 1, duration: 200 })
    }
  }

  function onMouseDown() {
    isPressed.value = true
    if (elementRef.value) {
      animate(elementRef.value, 'buttonPress')
    }
  }

  function onMouseUp() {
    isPressed.value = false
    if (elementRef.value) {
      animate(elementRef.value, 'buttonRelease')
    }
  }

  return {
    isHovered,
    isPressed,
    handlers: {
      onMouseEnter,
      onMouseLeave,
      onMouseDown,
      onMouseUp,
    },
  }
}

/**
 * v-anime 指令 - 入场动画
 * 用法: v-anime="'slideUp'" 或 v-anime="{ opacity: [0, 1], translateY: [20, 0] }"
 */
export const vAnime = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PresetName | AnimationParams>) {
    const animation = binding.value || 'fadeIn'
    const delay = binding.arg ? parseInt(binding.arg) : 0
    const params = typeof animation === 'string' ? presets[animation] : animation
    
    // 设置初始状态
    el.style.opacity = '0'
    
    animate(el, params, { delay })
  },
}

/**
 * v-anime-stagger 指令 - 子元素交错动画
 * 用法: v-anime-stagger="'slideUp'" 或 v-anime-stagger:100="'cardIn'"
 */
export const vAnimeStagger = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PresetName | AnimationParams>) {
    const animation = binding.value || 'fadeIn'
    const staggerDelay = binding.arg ? parseInt(binding.arg) : 50
    const params = typeof animation === 'string' ? presets[animation] : animation
    
    const children = el.children
    
    // 设置初始状态
    Array.from(children).forEach((child) => {
      ;(child as HTMLElement).style.opacity = '0'
    })
    
    stagger(children as unknown as HTMLElement[], params, staggerDelay)
  },
}

/**
 * v-hover 指令 - 悬停动画
 * 用法: v-hover 或 v-hover="{ scale: 1.05 }"
 */
export const vHover = {
  mounted(el: HTMLElement, binding: DirectiveBinding<AnimationParams>) {
    const hoverAnimation = binding.value || { scale: 1.05 }
    
    el.addEventListener('mouseenter', () => {
      animate(el, {
        ...hoverAnimation,
        duration: 200,
        ease: 'outQuad',
      })
    })
    
    el.addEventListener('mouseleave', () => {
      animate(el, {
        scale: 1,
        duration: 200,
        ease: 'outQuad',
      })
    })
  },
}

/**
 * v-tap 指令 - 点击动画
 * 用法: v-tap
 */
export const vTap = {
  mounted(el: HTMLElement) {
    el.addEventListener('mousedown', () => {
      animate(el, {
        scale: 0.95,
        duration: 100,
        ease: 'outQuad',
      })
    })
    
    el.addEventListener('mouseup', () => {
      animate(el, {
        scale: 1,
        duration: 200,
        ease: 'outBack',
      })
    })
    
    el.addEventListener('mouseleave', () => {
      animate(el, {
        scale: 1,
        duration: 200,
        ease: 'outQuad',
      })
    })
  },
}

// 导出工具
export { utils, createTimeline }
