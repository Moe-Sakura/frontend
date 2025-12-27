<script setup lang="ts">
/**
 * 简单全屏图片预览组件
 * 点击图片全屏预览，点击任意位置关闭
 */

import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight, X } from 'lucide-vue-next'
import { useImageViewer } from '@/composables/useImageViewer'
import { playSwipe, playTransitionUp, playTransitionDown } from '@/composables/useSound'

const {
  isOpen,
  images,
  currentIndex,
  currentImage,
  hasMultiple,
  close,
  prev,
  next,
} = useImageViewer()

// 图片加载状态
const isLoading = ref(true)

// 进入动画播放音效
function onEnter() {
  playTransitionUp()
}

// 监听图片切换，重置加载状态
watch(currentIndex, () => {
  isLoading.value = true
})

// 图片加载完成
function handleImageLoad() {
  isLoading.value = false
}

// 关闭预览
function handleClose() {
  playTransitionDown()
  close()
}

// 上一张
function handlePrev(e: Event) {
  e.stopPropagation()
  playSwipe()
  prev()
}

// 下一张
function handleNext(e: Event) {
  e.stopPropagation()
  playSwipe()
  next()
}

// 键盘事件
function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value) {return}
  
  switch (e.key) {
    case 'Escape':
      handleClose()
      break
    case 'ArrowLeft':
      playSwipe()
      prev()
      break
    case 'ArrowRight':
      playSwipe()
      next()
      break
  }
}

// 触摸滑动切换
let touchStartX = 0

function handleTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
}

function handleTouchEnd(e: TouchEvent) {
  const deltaX = e.changedTouches[0].clientX - touchStartX
  
  if (Math.abs(deltaX) > 80) {
    if (deltaX > 0) {
      playSwipe()
      prev()
    } else {
      playSwipe()
      next()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
      @enter="onEnter"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 cursor-pointer select-none"
        @click="handleClose"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
      >
        <!-- 关闭按钮 -->
        <button
          class="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          style="padding-top: max(0.5rem, env(safe-area-inset-top))"
          @click.stop="handleClose"
        >
          <X :size="24" />
        </button>

        <!-- 图片计数 -->
        <div
          v-if="hasMultiple"
          class="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm font-medium"
          style="padding-top: max(0.5rem, env(safe-area-inset-top))"
        >
          {{ currentIndex + 1 }} / {{ images.length }}
        </div>

        <!-- 加载指示器 -->
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="w-10 h-10 border-3 border-white/20 border-t-pink-500 rounded-full animate-spin" />
        </div>

        <!-- 图片 -->
        <img
          v-show="currentImage"
          :src="currentImage?.src"
          :alt="currentImage?.caption || ''"
          class="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl transition-transform duration-200"
          :class="{ 'scale-95 opacity-0': isLoading, 'scale-100 opacity-100': !isLoading }"
          draggable="false"
          @click.stop
          @load="handleImageLoad"
        />

        <!-- 图片标题 -->
        <div
          v-if="currentImage?.caption && !isLoading"
          class="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg bg-black/60 text-white text-sm max-w-[80%] text-center"
          style="padding-bottom: max(1.5rem, env(safe-area-inset-bottom))"
        >
          {{ currentImage.caption }}
        </div>

        <!-- 左右切换按钮 -->
        <template v-if="hasMultiple">
          <button
            class="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110"
            @click="handlePrev"
          >
            <ChevronLeft :size="28" />
          </button>
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all hover:scale-110"
            @click="handleNext"
          >
            <ChevronRight :size="28" />
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* 加载动画 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 0.8s linear infinite;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .absolute.left-2,
  .absolute.right-2 {
    display: none;
  }
}
</style>
