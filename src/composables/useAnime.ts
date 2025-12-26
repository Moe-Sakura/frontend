/**
 * 动画系统 - 使用原生 Web Animations API
 * 轻量级替代 anime.js
 */

// 缓动函数映射
const easingMap: Record<string, string> = {
  'outQuad': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  'inQuad': 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  'outCubic': 'cubic-bezier(0.33, 1, 0.68, 1)',
  'inCubic': 'cubic-bezier(0.32, 0, 0.67, 0)',
  'outQuart': 'cubic-bezier(0.25, 1, 0.5, 1)',
  'inQuart': 'cubic-bezier(0.5, 0, 0.75, 0)',
  'outBack': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  'inBack': 'cubic-bezier(0.36, 0, 0.66, -0.56)',
  'inOutQuad': 'cubic-bezier(0.45, 0, 0.55, 1)',
  'linear': 'linear',
  'ease': 'ease',
  'easeIn': 'ease-in',
  'easeOut': 'ease-out',
  'easeInOut': 'ease-in-out',
}

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
 * 将动画参数转换为 Web Animations API 格式
 */
function paramsToKeyframes(params: AnimationParams): Keyframe[] {
  const fromFrame: Keyframe = {}
  const toFrame: Keyframe = {}
  
  // 构建 transform 字符串
  let fromTransform = ''
  let toTransform = ''
  
  if (params.opacity) {
    fromFrame.opacity = params.opacity[0]
    toFrame.opacity = params.opacity[1]
  }
  
  if (params.scale) {
    if (Array.isArray(params.scale)) {
      fromTransform += `scale(${params.scale[0]}) `
      toTransform += `scale(${params.scale[1]}) `
    }
  }
  
  if (params.translateX) {
    if (Array.isArray(params.translateX)) {
      fromTransform += `translateX(${params.translateX[0]}px) `
      toTransform += `translateX(${params.translateX[1]}px) `
    }
  }
  
  if (params.translateY) {
    if (Array.isArray(params.translateY)) {
      fromTransform += `translateY(${params.translateY[0]}px) `
      toTransform += `translateY(${params.translateY[1]}px) `
    }
  }
  
  if (params.rotate) {
    if (Array.isArray(params.rotate) && params.rotate.length >= 2) {
      fromTransform += `rotate(${params.rotate[0]}deg) `
      toTransform += `rotate(${params.rotate[params.rotate.length - 1]}deg) `
    }
  }
  
  if (fromTransform) {
    fromFrame.transform = fromTransform.trim()
    toFrame.transform = toTransform.trim()
  }
  
  return [fromFrame, toFrame]
}

/**
 * 执行动画 - 使用 Web Animations API
 */
export function animate(
  target: HTMLElement | string | NodeList | HTMLElement[],
  animation: AnimationParams,
  options?: Partial<AnimationParams>,
): Promise<void> {
  const params = { ...animation, ...options }
  
  // 获取目标元素
  let elements: HTMLElement[] = []
  if (typeof target === 'string') {
    elements = Array.from(document.querySelectorAll(target)) as HTMLElement[]
  } else if (target instanceof NodeList) {
    elements = Array.from(target) as HTMLElement[]
  } else if (Array.isArray(target)) {
    elements = target
  } else if (target instanceof HTMLElement) {
    elements = [target]
  }
  
  if (elements.length === 0) {
    return Promise.resolve()
  }
  
  const keyframes = paramsToKeyframes(params)
  const duration = params.duration || 300
  const easing = easingMap[params.ease || 'outQuad'] || params.ease || 'ease-out'
  const delay = params.delay || 0
  
  const animations = elements.map(el => {
    const anim = el.animate(keyframes, {
      duration,
      easing,
      delay,
      fill: 'forwards',
    })
    return anim.finished
  })
  
  return Promise.all(animations).then(() => {
    // 将最终状态应用到元素
    elements.forEach(el => {
      const lastFrame = keyframes[keyframes.length - 1]
      if (lastFrame.opacity !== undefined) {
        el.style.opacity = String(lastFrame.opacity)
      }
      if (lastFrame.transform) {
        el.style.transform = lastFrame.transform
      }
    })
    
    if (params.complete) {
      params.complete()
    }
  })
}
