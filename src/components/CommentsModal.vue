<template>
  <Teleport to="body">
    <!-- 评论面板 - macOS 风格浮动窗口 -->
    <Transition
      :css="false"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="uiStore.isCommentsModalOpen"
        ref="modalRef"
        :class="[
          'comments-modal fixed z-[100] flex flex-col shadow-2xl shadow-black/20',
          isFullscreen 
            ? 'inset-0' 
            : 'inset-0 md:inset-6 md:m-auto md:w-[800px] md:min-w-[400px] md:max-w-[calc(100%-3rem)] md:h-[600px] md:max-h-[calc(100%-3rem)] md:rounded-3xl'
        ]"
        :style="windowStyle"
      >
        <!-- 调整大小手柄 -->
        <WindowResizeHandles 
          :is-fullscreen="isFullscreen" 
          @resize="handleResize" 
        />
        
        <!-- 顶部导航栏 - 可拖动 -->
        <div 
          :class="[
            'comments-header flex-shrink-0 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-4 border-b border-white/10 dark:border-slate-700/50 select-none',
            isFullscreen ? '' : 'md:rounded-t-3xl md:cursor-move'
          ]"
          @mousedown="handleDragStart"
          @touchstart="handleDragStart"
        >
          <!-- 返回按钮 - 移动端 -->
          <button
            v-ripple
            class="flex items-center gap-1 px-3 py-2 -ml-2 rounded-xl text-[#ff1493] dark:text-[#ff69b4] font-medium transition-all hover:bg-pink-50 dark:hover:bg-pink-900/20 md:hidden"
            @click="closeModal"
          >
            <ChevronLeft :size="20" />
            <span class="text-sm sm:text-base">返回</span>
          </button>

          <!-- 标题 -->
          <div class="flex items-center gap-2 md:ml-0">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff1493] to-[#d946ef] flex items-center justify-center shadow-lg shadow-pink-500/30">
              <MessageCircle :size="16" class="text-white" />
            </div>
            <h1 class="text-base sm:text-lg font-bold text-gray-800 dark:text-white">评论区</h1>
          </div>

          <!-- 右侧按钮组 -->
          <div class="flex items-center gap-2">
            <!-- 全屏按钮 - 仅桌面端 -->
            <button
              class="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              title="全屏"
              @click="handleToggleFullscreen"
            >
              <Maximize2 v-if="!isFullscreen" :size="16" />
              <Minimize2 v-else :size="16" />
            </button>
            
            <!-- 关闭按钮 - 仅桌面端 -->
            <button
              class="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="关闭"
              @click="closeModal"
            >
              <X :size="16" />
            </button>
            
            <!-- 移动端占位 -->
            <div class="w-8 md:hidden" />
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div class="px-2 sm:px-5 py-3 sm:py-5">
            <div id="Comments" class="comments-container" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useUIStore } from '@/stores/ui'
import { playTransitionUp, playTransitionDown, playSwipe } from '@/composables/useSound'
import { useWindowManager, type ResizeDirection } from '@/composables/useWindowManager'
import { animate } from '@/composables/useAnime'
import WindowResizeHandles from '@/components/WindowResizeHandles.vue'
import Artalk from 'artalk/dist/Artalk.mjs'
import { MessageCircle, ChevronLeft, X, Maximize2, Minimize2 } from 'lucide-vue-next'

interface ArtalkInstance {
  destroy(): void
}

// 进入/离开动画
function onEnter(el: Element, done: () => void) {
  animate(el as HTMLElement, {
    opacity: [0, 1],
    scale: [0.98, 1],
    translateY: [40, 0],
    duration: 300,
    ease: 'outCubic',
    complete: done,
  })
}

function onLeave(el: Element, done: () => void) {
  animate(el as HTMLElement, {
    opacity: [1, 0],
    scale: [1, 0.98],
    translateY: [0, 40],
    duration: 200,
    ease: 'inCubic',
    complete: done,
  })
}

const uiStore = useUIStore()
let artalkInstance: ArtalkInstance | null = null
let isClosing = false

// 窗口管理
const modalRef = ref<HTMLElement | null>(null)
const { isFullscreen, windowStyle, startDrag, startResize, toggleFullscreen, reset } = useWindowManager({
  minWidth: 400,
  minHeight: 300,
})

function handleDragStart(e: MouseEvent | TouchEvent) {
  if ((e.target as HTMLElement).closest('button')) return
  if (modalRef.value) {
    startDrag(e, modalRef.value)
  }
}

function handleResize(e: MouseEvent | TouchEvent, direction: ResizeDirection) {
  if (modalRef.value) {
    startResize(e, direction, modalRef.value)
  }
}

// 切换全屏（带音效）
function handleToggleFullscreen() {
  playSwipe()
  toggleFullscreen()
}

function closeModal() {
  if (isClosing) {return}
  isClosing = true
  
  playTransitionDown()
  // 重置位置
  reset()
  // 关闭模态框
  uiStore.isCommentsModalOpen = false
  
  setTimeout(() => {
    isClosing = false
  }, 300)
}

// 初始化 Artalk
function initArtalk() {
  // 如果已经有实例，先销毁
  if (artalkInstance) {
    try {
      artalkInstance.destroy()
      artalkInstance = null
    } catch {
      // 静默处理错误
    }
  }

  nextTick(() => {
    const commentsEl = document.getElementById('Comments')
    if (commentsEl) {
      try {
        artalkInstance = Artalk.init({
          el: '#Comments',
          pageKey: 'https://searchgal.homes',
          pageTitle: 'Galgame 聚合搜索',
          server: 'https://artalk.saop.cc',
          site: 'Galgame 聚合搜索',
          darkMode: 'auto',
        })
      } catch {
        // 静默处理错误
      }
    }
  })
}

// 键盘事件
function handleKeydown(e: globalThis.KeyboardEvent) {
  if (!uiStore.isCommentsModalOpen) {return}
  
  if (e.key === 'Escape') {
    e.preventDefault()
    closeModal()
  }
}

// 监听模态框打开状态
watch(() => uiStore.isCommentsModalOpen, (isOpen: boolean) => {
  if (isOpen) {
    playTransitionUp()
    // 延迟初始化，确保 DOM 已渲染
    setTimeout(() => {
      initArtalk()
    }, 100)
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  // 如果挂载时模态框就是打开的，初始化 Artalk
  if (uiStore.isCommentsModalOpen) {
    setTimeout(() => {
      initArtalk()
    }, 200)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  // 销毁 Artalk 实例
  if (artalkInstance) {
    try {
      artalkInstance.destroy()
      artalkInstance = null
    } catch {
      // 静默处理错误
    }
  }
})
</script>

<style>
/* 评论面板 - WWDC 2025 液态玻璃效果 */
.comments-modal {
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 0 20px rgba(255, 20, 147, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
  /* 窗口/全屏切换动画 */
  transition: 
    inset 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    min-width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    margin 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 移动端无底部边框 */
@media (max-width: 767px) {
  .comments-modal {
    border-bottom: none;
  }
}

/* 液态玻璃高光 */
.comments-modal::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 30%,
    transparent 50%
  );
  pointer-events: none;
  z-index: 100;
}

/* 评论面板 - 暗色模式 */
.dark .comments-modal {
  background: rgba(30, 30, 40, 0.5);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 -8px 24px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(255, 105, 180, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.1) !important;
}

/* 头部样式 */
.comments-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.dark .comments-header {
  background: rgba(30, 41, 59, 0.8) !important;
}

/* 评论容器样式 */
.comments-container {
  background: rgba(248, 250, 252, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid rgba(226, 232, 240, 0.5);
}

@media (min-width: 640px) {
  .comments-container {
    background: rgba(248, 250, 252, 0.5);
    padding: 1.25rem;
    border-radius: 1.25rem;
  }
}

/* 暗色模式评论容器 */
.dark .comments-container {
  background: rgba(51, 65, 85, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.05) !important;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #ff1493, #d946ef);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #c71585, #c026d3);
}
</style>
