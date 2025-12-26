/**
 * 图片预览 Composable
 * 管理图片预览状态和交互
 */

import { ref, computed, reactive } from 'vue'

export interface ImageItem {
  src: string
  caption?: string
  thumbnail?: string
}

// 全局状态
const isOpen = ref(false)
const images = ref<ImageItem[]>([])
const currentIndex = ref(0)

// 变换状态
const transform = reactive({
  scale: 1,
  rotate: 0,
  flipX: false,
  flipY: false,
  translateX: 0,
  translateY: 0,
})

// 当前图片
const currentImage = computed(() => images.value[currentIndex.value])

// 是否有多张图片
const hasMultiple = computed(() => images.value.length > 1)

// 重置变换
function resetTransform() {
  transform.scale = 1
  transform.rotate = 0
  transform.flipX = false
  transform.flipY = false
  transform.translateX = 0
  transform.translateY = 0
}

// 打开预览
function open(items: ImageItem | ImageItem[], startIndex = 0) {
  const itemsArray = Array.isArray(items) ? items : [items]
  images.value = itemsArray
  currentIndex.value = Math.min(startIndex, itemsArray.length - 1)
  resetTransform()
  isOpen.value = true
  // 禁止背景滚动
  document.body.style.overflow = 'hidden'
}

// 关闭预览
function close() {
  isOpen.value = false
  document.body.style.overflow = ''
}

// 上一张
function prev() {
  if (images.value.length <= 1) {
    return
  }
  currentIndex.value = currentIndex.value === 0 
    ? images.value.length - 1 
    : currentIndex.value - 1
  resetTransform()
}

// 下一张
function next() {
  if (images.value.length <= 1) {
    return
  }
  currentIndex.value = currentIndex.value === images.value.length - 1 
    ? 0 
    : currentIndex.value + 1
  resetTransform()
}

// 跳转到指定图片
function goTo(index: number) {
  if (index >= 0 && index < images.value.length) {
    currentIndex.value = index
    resetTransform()
  }
}

// 缩放
function zoomIn() {
  transform.scale = Math.min(transform.scale * 1.5, 10)
}

function zoomOut() {
  transform.scale = Math.max(transform.scale / 1.5, 0.1)
}

function toggleZoom() {
  if (transform.scale === 1) {
    transform.scale = 2
  } else {
    transform.scale = 1
    transform.translateX = 0
    transform.translateY = 0
  }
}

// 旋转
function rotateCW() {
  transform.rotate += 90
}

function rotateCCW() {
  transform.rotate -= 90
}

// 翻转
function flipHorizontal() {
  transform.flipX = !transform.flipX
}

function flipVertical() {
  transform.flipY = !transform.flipY
}

// 平移
function pan(deltaX: number, deltaY: number) {
  transform.translateX += deltaX
  transform.translateY += deltaY
}

export function useImageViewer() {
  return {
    // 状态
    isOpen,
    images,
    currentIndex,
    currentImage,
    hasMultiple,
    transform,
    // 方法
    open,
    close,
    prev,
    next,
    goTo,
    zoomIn,
    zoomOut,
    toggleZoom,
    rotateCW,
    rotateCCW,
    flipHorizontal,
    flipVertical,
    pan,
    resetTransform,
  }
}

