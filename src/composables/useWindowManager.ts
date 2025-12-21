import { ref, computed, onUnmounted } from 'vue'

export interface WindowManagerOptions {
  /** 最小宽度 */
  minWidth?: number
  /** 最小高度 */
  minHeight?: number
  /** 初始宽度 */
  initialWidth?: number
  /** 初始高度 */
  initialHeight?: number
}

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | null

export function useWindowManager(options: WindowManagerOptions = {}) {
  const {
    minWidth = 400,
    minHeight = 300,
    initialWidth = 0,
    initialHeight = 0,
  } = options

  // 状态
  const isFullscreen = ref(false)
  const isDragging = ref(false)
  const isResizing = ref(false)
  const resizeDirection = ref<ResizeDirection>(null)
  
  // 位置和大小
  const position = ref({ x: 0, y: 0 })
  const size = ref({ width: initialWidth, height: initialHeight })
  
  // 拖动相关变量
  let startX = 0
  let startY = 0
  let initialPosX = 0
  let initialPosY = 0
  let initialWidth_ = 0
  let initialHeight_ = 0
  let _elementRef: HTMLElement | null = null

  // 计算样式
  const windowStyle = computed(() => {
    if (isFullscreen.value) {
      return undefined
    }
    
    const style: Record<string, string> = {}
    
    // 位置偏移
    if (position.value.x !== 0 || position.value.y !== 0) {
      style.left = `calc(1.5rem + ${position.value.x}px)`
      style.right = `calc(1.5rem - ${position.value.x}px)`
      style.top = `calc(1.5rem + ${position.value.y}px)`
      style.bottom = `calc(1.5rem - ${position.value.y}px)`
    }
    
    // 自定义大小 - 使用 !important 覆盖 Tailwind 类
    if (size.value.width > 0) {
      style.width = `${size.value.width}px`
      style.minWidth = `${minWidth}px`
      style.maxWidth = 'none'
    }
    if (size.value.height > 0) {
      style.height = `${size.value.height}px`
      style.minHeight = `${minHeight}px`
      style.maxHeight = 'none'
    }
    
    return Object.keys(style).length > 0 ? style : undefined
  })

  // 开始拖动
  function startDrag(e: MouseEvent | TouchEvent, element: HTMLElement) {
    if (isFullscreen.value || isResizing.value) {return}
    
    isDragging.value = true
    _elementRef = element
    
    const point = e instanceof MouseEvent ? e : e.touches[0]
    startX = point.clientX
    startY = point.clientY
    initialPosX = position.value.x
    initialPosY = position.value.y
    
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
    document.addEventListener('touchmove', onDrag, { passive: false })
    document.addEventListener('touchend', stopDrag)
    
    e.preventDefault()
  }

  function onDrag(e: MouseEvent | TouchEvent) {
    if (!isDragging.value) {return}
    
    const point = e instanceof MouseEvent ? e : e.touches[0]
    const deltaX = point.clientX - startX
    const deltaY = point.clientY - startY
    
    position.value = {
      x: initialPosX + deltaX,
      y: initialPosY + deltaY,
    }
    
    if (e instanceof TouchEvent) {e.preventDefault()}
  }

  function stopDrag() {
    isDragging.value = false
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('touchmove', onDrag)
    document.removeEventListener('touchend', stopDrag)
  }

  // 开始调整大小
  function startResize(e: MouseEvent | TouchEvent, direction: ResizeDirection, element: HTMLElement) {
    if (isFullscreen.value || isDragging.value) {return}
    
    isResizing.value = true
    resizeDirection.value = direction
    _elementRef = element
    
    const rect = element.getBoundingClientRect()
    const point = e instanceof MouseEvent ? e : e.touches[0]
    
    startX = point.clientX
    startY = point.clientY
    initialPosX = position.value.x
    initialPosY = position.value.y
    initialWidth_ = size.value.width || rect.width
    initialHeight_ = size.value.height || rect.height
    
    document.addEventListener('mousemove', onResize)
    document.addEventListener('mouseup', stopResize)
    document.addEventListener('touchmove', onResize, { passive: false })
    document.addEventListener('touchend', stopResize)
  }

  function onResize(e: MouseEvent | TouchEvent) {
    if (!isResizing.value || !resizeDirection.value) {return}
    
    const point = e instanceof MouseEvent ? e : e.touches[0]
    const deltaX = point.clientX - startX
    const deltaY = point.clientY - startY
    const dir = resizeDirection.value
    
    let newWidth = initialWidth_
    let newHeight = initialHeight_
    
    // 东西方向调整宽度 - 直接使用 delta（不乘2，因为窗口居中）
    if (dir.includes('e')) {
      newWidth = Math.max(minWidth, initialWidth_ + deltaX * 2)
    }
    if (dir.includes('w')) {
      newWidth = Math.max(minWidth, initialWidth_ - deltaX * 2)
    }
    
    // 南北方向调整高度
    if (dir.includes('s')) {
      newHeight = Math.max(minHeight, initialHeight_ + deltaY * 2)
    }
    if (dir.includes('n')) {
      newHeight = Math.max(minHeight, initialHeight_ - deltaY * 2)
    }
    
    size.value = { width: newWidth, height: newHeight }
    
    if (e instanceof TouchEvent) {e.preventDefault()}
  }

  function stopResize() {
    isResizing.value = false
    resizeDirection.value = null
    document.removeEventListener('mousemove', onResize)
    document.removeEventListener('mouseup', stopResize)
    document.removeEventListener('touchmove', onResize)
    document.removeEventListener('touchend', stopResize)
  }

  // 切换全屏
  function toggleFullscreen() {
    isFullscreen.value = !isFullscreen.value
  }

  // 重置
  function reset() {
    position.value = { x: 0, y: 0 }
    size.value = { width: initialWidth, height: initialHeight }
    isFullscreen.value = false
  }

  onUnmounted(() => {
    stopDrag()
    stopResize()
  })

  return {
    // 状态
    isFullscreen,
    isDragging,
    isResizing,
    position,
    size,
    // 计算属性
    windowStyle,
    // 方法
    startDrag,
    startResize,
    toggleFullscreen,
    reset,
  }
}
