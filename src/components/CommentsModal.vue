<template>
  <Teleport to="body">
    <!-- 背景遮罩 - 仅桌面端 -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="uiStore.isCommentsModalOpen"
        class="fixed inset-0 z-[99] hidden sm:block glassmorphism-overlay"
        @click="closeModal"
      />
    </Transition>

    <!-- 评论面板 -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 max-sm:translate-y-full sm:scale-95 sm:opacity-0"
      enter-to-class="opacity-100 max-sm:translate-y-0 sm:scale-100 sm:opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 max-sm:translate-y-0 sm:scale-100 sm:opacity-100"
      leave-to-class="opacity-0 max-sm:translate-y-full sm:scale-95 sm:opacity-0"
    >
      <div
        v-if="uiStore.isCommentsModalOpen"
        class="comments-modal fixed z-[100] flex flex-col
               inset-0 
               sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
               sm:w-[90vw] sm:max-w-2xl sm:h-auto sm:max-h-[85vh]
               sm:rounded-2xl sm:shadow-2xl sm:shadow-pink-500/20"
      >
        <!-- 顶部导航栏 -->
        <div class="comments-header flex-shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/50">
          <!-- 返回按钮 -->
          <button
            v-ripple
            class="flex items-center gap-1 px-3 py-2 -ml-2 rounded-xl text-[#ff1493] dark:text-[#ff69b4] font-medium transition-all hover:bg-pink-50 dark:hover:bg-pink-900/20"
            @click="closeModal"
          >
            <ChevronLeft :size="20" />
            <span class="text-sm sm:text-base">返回</span>
          </button>

          <!-- 标题 -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff1493] to-[#d946ef] flex items-center justify-center shadow-lg shadow-pink-500/30">
              <MessageCircle :size="16" class="text-white" />
            </div>
            <h1 class="text-base sm:text-lg font-bold text-gray-800 dark:text-white">评论区</h1>
          </div>

          <!-- 桌面端关闭按钮 -->
          <button
            v-ripple
            class="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
            @click="closeModal"
          >
            <X :size="20" />
          </button>
          
          <!-- 移动端占位 -->
          <div class="w-12 sm:hidden" />
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div class="px-4 sm:px-5 py-4 sm:py-5">
            <div id="Comments" class="comments-container" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { playPop } from '@/composables/useSound'
import { lockScroll, unlockScroll, forceUnlockScroll } from '@/composables/useScrollLock'
import Artalk from 'artalk/dist/Artalk.mjs'
import { MessageCircle, ChevronLeft, X } from 'lucide-vue-next'

interface ArtalkInstance {
  destroy(): void
}

const router = useRouter()
const route = useRoute()
const uiStore = useUIStore()
let artalkInstance: ArtalkInstance | null = null
let isClosing = false

function closeModal() {
  if (isClosing) {return}
  isClosing = true
  
  playPop()
  // 恢复 body 滚动
  unlockScroll()
  // 通过路由返回（移除 ui 参数，保留其他参数）
  const newQuery = { ...route.query }
  delete newQuery.ui
  router.push({ path: '/', query: newQuery })
  
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
    playPop()
    // 锁定 body 滚动
    lockScroll()
    // 延迟初始化，确保 DOM 已渲染
    setTimeout(() => {
      initArtalk()
    }, 100)
  } else {
    // 恢复 body 滚动
    unlockScroll()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  // 如果挂载时模态框就是打开的，初始化 Artalk
  if (uiStore.isCommentsModalOpen) {
    lockScroll()
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
  // 确保恢复 body 滚动
  forceUnlockScroll()
})
</script>

<style>
/* 评论模态框 - 移动端全屏 */
.comments-modal {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.98) 100%
  );
}

/* 桌面端模态框 */
@media (min-width: 640px) {
  .comments-modal {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
}

/* 暗色模式 */
.dark .comments-modal {
  background: linear-gradient(
    180deg,
    rgb(15, 23, 42) 0%,
    rgb(2, 6, 23) 100%
  ) !important;
}

@media (min-width: 640px) {
  .dark .comments-modal {
    background: rgba(30, 41, 59, 0.95) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
  }
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
