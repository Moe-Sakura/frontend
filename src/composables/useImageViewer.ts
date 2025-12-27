/**
 * 图片预览 Composable
 * 管理简单全屏图片预览状态
 */

import { ref, computed } from 'vue'

export interface ImageItem {
  src: string
  caption?: string
}

// 全局状态
const isOpen = ref(false)
const images = ref<ImageItem[]>([])
const currentIndex = ref(0)

// 当前图片
const currentImage = computed(() => images.value[currentIndex.value])

// 是否有多张图片
const hasMultiple = computed(() => images.value.length > 1)

// 打开预览
function open(items: ImageItem | ImageItem[], startIndex = 0) {
  const itemsArray = Array.isArray(items) ? items : [items]
  images.value = itemsArray
  currentIndex.value = Math.min(startIndex, itemsArray.length - 1)
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
  if (images.value.length <= 1) {return}
  currentIndex.value = currentIndex.value === 0 
    ? images.value.length - 1 
    : currentIndex.value - 1
}

// 下一张
function next() {
  if (images.value.length <= 1) {return}
  currentIndex.value = currentIndex.value === images.value.length - 1 
    ? 0 
    : currentIndex.value + 1
}

export function useImageViewer() {
  return {
    // 状态
    isOpen,
    images,
    currentIndex,
    currentImage,
    hasMultiple,
    // 方法
    open,
    close,
    prev,
    next,
  }
}
