<script setup lang="ts">
/**
 * 图片预览组件
 * 替代 @fancyapps/ui，使用 Vue 原生实现
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { animate } from '@/composables/useAnime'
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Download,
} from 'lucide-vue-next'
import { useImageViewer } from '@/composables/useImageViewer'
import { playButton, playSwipe, playTransitionUp, playTransitionDown } from '@/composables/useSound'

const {
  isOpen,
  images,
  currentIndex,
  currentImage,
  hasMultiple,
  transform,
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
  resetTransform,
} = useImageViewer()

// 图片加载状态
const isLoading = ref(true)
const hasError = ref(false)

// 拖拽状态
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const lastTranslate = ref({ x: 0, y: 0 })

// 双指缩放状态
const initialPinchDistance = ref(0)
const initialScale = ref(1)

// 计算变换样式
const imageStyle = computed(() => {
  const scaleX = transform.flipX ? -transform.scale : transform.scale
  const scaleY = transform.flipY ? -transform.scale : transform.scale
  
  return {
    transform: `translate(${transform.translateX}px, ${transform.translateY}px) scale(${scaleX}, ${scaleY}) rotate(${transform.rotate}deg)`,
    transition: isDragging.value ? 'none' : 'transform 0.3s ease-out',
    cursor: transform.scale > 1 ? (isDragging.value ? 'grabbing' : 'grab') : 'default',
  }
})

// 动画函数
function onEnter(el: Element, done: () => void) {
  playTransitionUp()
  animate(el as HTMLElement, {
    opacity: [0, 1],
    scale: [0.95, 1],
    duration: 250,
    ease: 'outCubic',
    complete: done,
  })
}

function onLeave(el: Element, done: () => void) {
  animate(el as HTMLElement, {
    opacity: [1, 0],
    scale: [1, 0.95],
    duration: 200,
    ease: 'inCubic',
    complete: done,
  })
}

// 监听图片切换
watch(currentIndex, () => {
  isLoading.value = true
  hasError.value = false
})

// 图片加载完成
function handleImageLoad() {
  isLoading.value = false
}

// 图片加载失败
function handleImageError() {
  isLoading.value = false
  hasError.value = true
}

// 关闭预览
function handleClose() {
  playTransitionDown()
  close()
}

// 上一张
function handlePrev() {
  playSwipe()
  prev()
}

// 下一张
function handleNext() {
  playSwipe()
  next()
}

// 工具栏操作
function handleZoomIn() {
  playButton()
  zoomIn()
}

function handleZoomOut() {
  playButton()
  zoomOut()
}

function handleToggleZoom() {
  playButton()
  toggleZoom()
}

function handleRotateCW() {
  playButton()
  rotateCW()
}

function handleRotateCCW() {
  playButton()
  rotateCCW()
}

function handleFlipH() {
  playButton()
  flipHorizontal()
}

function handleFlipV() {
  playButton()
  flipVertical()
}

// 下载图片
function handleDownload() {
  if (!currentImage.value) {
    return
  }
  playButton()
  
  const link = document.createElement('a')
  link.href = currentImage.value.src
  link.download = currentImage.value.caption || 'image'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 鼠标拖拽
function handleMouseDown(e: MouseEvent) {
  if (transform.scale <= 1) {
    return
  }
  
  isDragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY }
  lastTranslate.value = { x: transform.translateX, y: transform.translateY }
  
  e.preventDefault()
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) {
    return
  }
  
  const deltaX = e.clientX - dragStart.value.x
  const deltaY = e.clientY - dragStart.value.y
  
  transform.translateX = lastTranslate.value.x + deltaX
  transform.translateY = lastTranslate.value.y + deltaY
}

function handleMouseUp() {
  isDragging.value = false
}

// 双击放大/还原
function handleDoubleClick(e: MouseEvent) {
  e.preventDefault()
  handleToggleZoom()
}

// 滚轮缩放
function handleWheel(e: globalThis.WheelEvent) {
  e.preventDefault()
  
  if (e.deltaY < 0) {
    transform.scale = Math.min(transform.scale * 1.1, 10)
  } else {
    transform.scale = Math.max(transform.scale / 1.1, 0.5)
  }
}

// 触摸事件
function handleTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    // 双指缩放开始
    initialPinchDistance.value = getDistance(e.touches[0], e.touches[1])
    initialScale.value = transform.scale
  } else if (e.touches.length === 1 && transform.scale > 1) {
    // 单指拖拽开始
    isDragging.value = true
    dragStart.value = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    lastTranslate.value = { x: transform.translateX, y: transform.translateY }
  }
}

function handleTouchMove(e: TouchEvent) {
  if (e.touches.length === 2 && initialPinchDistance.value > 0) {
    // 双指缩放
    const distance = getDistance(e.touches[0], e.touches[1])
    const scale = (distance / initialPinchDistance.value) * initialScale.value
    transform.scale = Math.min(Math.max(scale, 0.5), 10)
    e.preventDefault()
  } else if (e.touches.length === 1 && isDragging.value) {
    // 单指拖拽
    const deltaX = e.touches[0].clientX - dragStart.value.x
    const deltaY = e.touches[0].clientY - dragStart.value.y
    transform.translateX = lastTranslate.value.x + deltaX
    transform.translateY = lastTranslate.value.y + deltaY
    e.preventDefault()
  }
}

function handleTouchEnd() {
  isDragging.value = false
  initialPinchDistance.value = 0
}

// 计算两点距离
function getDistance(touch1: globalThis.Touch, touch2: globalThis.Touch): number {
  const dx = touch1.clientX - touch2.clientX
  const dy = touch1.clientY - touch2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

// 滑动切换
let touchStartX = 0
let touchStartY = 0

function handleSwipeStart(e: TouchEvent) {
  if (transform.scale > 1) {
    return
  }
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function handleSwipeEnd(e: TouchEvent) {
  if (transform.scale > 1) {
    return
  }
  
  const deltaX = e.changedTouches[0].clientX - touchStartX
  const deltaY = e.changedTouches[0].clientY - touchStartY
  
  // 水平滑动幅度大于垂直，且超过阈值
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
    if (deltaX > 0) {
      handlePrev()
    } else {
      handleNext()
    }
  }
}

// 键盘事件
function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value) {
    return
  }
  
  switch (e.key) {
    case 'Escape':
      handleClose()
      break
    case 'ArrowLeft':
      handlePrev()
      break
    case 'ArrowRight':
      handleNext()
      break
    case '+':
    case '=':
      handleZoomIn()
      break
    case '-':
      handleZoomOut()
      break
    case '0':
      resetTransform()
      break
    case 'r':
      handleRotateCW()
      break
    case 'R':
      handleRotateCCW()
      break
  }
}

// 点击背景关闭
function handleBackdropClick(e: MouseEvent) {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      :css="false"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="isOpen"
        class="image-viewer-overlay"
        @click="handleBackdropClick"
      >
        <!-- 背景 -->
        <div class="image-viewer-backdrop" />
        
        <!-- 主容器 -->
        <div class="image-viewer-container">
          <!-- 顶部工具栏 -->
          <div class="image-viewer-toolbar top">
            <!-- 左侧：图片信息 -->
            <div class="toolbar-left">
              <span v-if="hasMultiple" class="image-counter">
                {{ currentIndex + 1 }} / {{ images.length }}
              </span>
            </div>
            
            <!-- 右侧：操作按钮 -->
            <div class="toolbar-right">
              <!-- 缩放按钮 -->
              <button
                class="toolbar-btn"
                title="放大 (+)"
                @click="handleZoomIn"
              >
                <ZoomIn :size="20" />
              </button>
              <button
                class="toolbar-btn"
                title="缩小 (-)"
                @click="handleZoomOut"
              >
                <ZoomOut :size="20" />
              </button>
              <button
                class="toolbar-btn hidden-mobile"
                title="1:1"
                @click="handleToggleZoom"
              >
                <Maximize2 :size="20" />
              </button>
              
              <div class="toolbar-divider" />
              
              <!-- 旋转翻转按钮 - 仅桌面端显示 -->
              <button
                class="toolbar-btn hidden-mobile"
                title="逆时针旋转 (Shift+R)"
                @click="handleRotateCCW"
              >
                <RotateCcw :size="20" />
              </button>
              <button
                class="toolbar-btn hidden-mobile"
                title="顺时针旋转 (R)"
                @click="handleRotateCW"
              >
                <RotateCw :size="20" />
              </button>
              <button
                class="toolbar-btn hidden-mobile"
                title="水平翻转"
                @click="handleFlipH"
              >
                <FlipHorizontal :size="20" />
              </button>
              <button
                class="toolbar-btn hidden-mobile"
                title="垂直翻转"
                @click="handleFlipV"
              >
                <FlipVertical :size="20" />
              </button>
              
              <div class="toolbar-divider" />
              
              <!-- 下载和关闭 -->
              <button
                class="toolbar-btn hidden-mobile"
                title="下载"
                @click="handleDownload"
              >
                <Download :size="20" />
              </button>
              
              <button
                class="toolbar-btn close-btn"
                title="关闭 (Esc)"
                @click="handleClose"
              >
                <X :size="22" />
              </button>
            </div>
          </div>
          
          <!-- 图片容器 -->
          <div
            class="image-viewer-content"
            @mousedown="handleMouseDown"
            @wheel="handleWheel"
            @dblclick="handleDoubleClick"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          >
            <!-- 加载指示器 -->
            <div v-if="isLoading" class="image-loading">
              <div class="loading-spinner" />
            </div>
            
            <!-- 错误提示 -->
            <div v-else-if="hasError" class="image-error">
              <span>图片加载失败</span>
            </div>
            
            <!-- 图片 -->
            <img
              v-show="!isLoading && !hasError && currentImage"
              :src="currentImage?.src"
              :alt="currentImage?.caption || ''"
              :style="imageStyle"
              class="viewer-image"
              draggable="false"
              @load="handleImageLoad"
              @error="handleImageError"
              @touchstart="handleSwipeStart"
              @touchend="handleSwipeEnd"
            />
          </div>
          
          <!-- 左右切换按钮 -->
          <template v-if="hasMultiple">
            <button
              class="nav-btn nav-prev"
              title="上一张 (←)"
              @click.stop="handlePrev"
            >
              <ChevronLeft :size="32" />
            </button>
            <button
              class="nav-btn nav-next"
              title="下一张 (→)"
              @click.stop="handleNext"
            >
              <ChevronRight :size="32" />
            </button>
          </template>
          
          <!-- 底部：标题和缩略图 -->
          <div class="image-viewer-toolbar bottom">
            <!-- 标题 -->
            <div v-if="currentImage?.caption" class="image-caption">
              {{ currentImage.caption }}
            </div>
            
            <!-- 缩略图 -->
            <div v-if="hasMultiple && images.length <= 20" class="thumbnails">
              <button
                v-for="(img, index) in images"
                :key="index"
                :class="['thumbnail', { active: index === currentIndex }]"
                @click="goTo(index)"
              >
                <img :src="img.thumbnail || img.src" :alt="`缩略图 ${index + 1}`" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.image-viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-viewer-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
}

.image-viewer-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 工具栏 */
.image-viewer-toolbar {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), transparent);
}

.image-viewer-toolbar.top {
  top: 0;
  padding-top: max(12px, env(safe-area-inset-top));
}

.image-viewer-toolbar.bottom {
  bottom: 0;
  flex-direction: column;
  gap: 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5), transparent);
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.image-counter {
  color: white;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.toolbar-btn:active {
  transform: scale(0.95);
}

.toolbar-btn.close-btn {
  background: rgba(239, 68, 68, 0.3);
}

.toolbar-btn.close-btn:hover {
  background: rgba(239, 68, 68, 0.5);
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
}

/* 图片容器 */
.image-viewer-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 60px 0;
}

.viewer-image {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
  border-radius: 4px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
}

/* 加载指示器 */
.image-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: #ff1493;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 错误提示 */
.image-error {
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
}

/* 导航按钮 */
.nav-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 80px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-prev {
  left: 0;
  border-radius: 0 12px 12px 0;
}

.nav-next {
  right: 0;
  border-radius: 12px 0 0 12px;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  width: 56px;
}

.nav-btn:active {
  background: rgba(255, 255, 255, 0.35);
}

/* 标题 */
.image-caption {
  color: white;
  font-size: 15px;
  text-align: center;
  max-width: 80%;
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 8px;
}

/* 缩略图 */
.thumbnails {
  display: flex;
  gap: 8px;
  padding: 8px;
  max-width: 90vw;
  overflow-x: auto;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 12px;
}

.thumbnail {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(0, 0, 0, 0.3);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05);
}

.thumbnail.active {
  border-color: #ff1493;
  box-shadow: 0 0 12px rgba(255, 20, 147, 0.5);
}

/* 移动端适配 */
@media (max-width: 768px) {
  .image-viewer-toolbar {
    padding: 8px 12px;
  }
  
  .image-viewer-toolbar.top {
    padding-top: max(8px, env(safe-area-inset-top));
  }
  
  .toolbar-btn {
    width: 36px;
    height: 36px;
  }
  
  .toolbar-btn.hidden-mobile {
    display: none;
  }
  
  .toolbar-divider {
    display: none;
  }
  
  .toolbar-right {
    gap: 6px;
  }
  
  .image-counter {
    font-size: 12px;
    padding: 3px 10px;
  }
  
  .nav-btn {
    width: 40px;
    height: 60px;
  }
  
  .thumbnail {
    width: 48px;
    height: 48px;
  }
  
  .image-caption {
    font-size: 13px;
    max-width: 90%;
  }
  
  .image-viewer-content {
    padding: 50px 0;
  }
}

/* 隐藏滚动条但保持功能 */
.thumbnails::-webkit-scrollbar {
  height: 4px;
}

.thumbnails::-webkit-scrollbar-track {
  background: transparent;
}

.thumbnails::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}
</style>
