<template>
  <Teleport to="body">
    <!-- 评论面板 - 模态框 -->
    <Transition
      :css="false"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="uiStore.isCommentsModalOpen"
        class="comments-modal fixed z-[100] flex flex-col shadow-2xl shadow-black/20 inset-0 md:inset-6 md:m-auto md:w-[900px] md:max-w-[calc(100%-3rem)] md:h-[760px] md:max-h-[calc(100%-3rem)] md:rounded-3xl"
      >
        <!-- 顶部导航栏 -->
        <div 
          class="comments-header flex-shrink-0 flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-4 border-b border-white/10 dark:border-slate-700/50 select-none md:rounded-t-3xl"
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
import { watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useUIStore } from '@/stores/ui'
import { playTransitionUp, playTransitionDown } from '@/composables/useSound'
import { animate } from '@/composables/useAnime'
import Artalk from 'artalk/dist/Artalk.mjs'
import { MessageCircle, ChevronLeft, X } from 'lucide-vue-next'

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

// 检查并滚动到指定评论
function scrollToComment() {
  const hash = window.location.hash
  if (!hash.startsWith('#atk-comment-')) {return}
  
  // 等待 Artalk 渲染完成后滚动
  const maxAttempts = 20
  let attempts = 0
  
  const tryScroll = () => {
    attempts++
    const targetEl = document.querySelector(hash)
    
    if (targetEl) {
      // 滚动到评论
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // 高亮效果
      targetEl.classList.add('atk-comment-highlight')
      setTimeout(() => {
        targetEl.classList.remove('atk-comment-highlight')
      }, 2000)
    } else if (attempts < maxAttempts) {
      // 评论还没加载完，继续尝试
      setTimeout(tryScroll, 200)
    }
  }
  
  // 延迟一点开始尝试，等待 Artalk 初始化
  setTimeout(tryScroll, 500)
}

function closeModal() {
  if (isClosing) {return}
  isClosing = true
  
  playTransitionDown()
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
        
        // 尝试滚动到指定评论
        scrollToComment()
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
/* 评论面板 - 半透明效果 */
.comments-modal {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-panel, 0.85));
  will-change: transform;
  border: var(--border-thin, 1px) solid rgba(var(--color-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-xl, 0 12px 32px rgba(0, 0, 0, 0.15));
}

/* 移动端无底部边框 */
@media (max-width: 767px) {
  .comments-modal {
    border-bottom: none;
  }
}

/* 评论面板 - 暗色模式 */
.dark .comments-modal {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-panel-dark, 0.88));
  border-color: rgba(var(--color-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 头部样式 */
.comments-header {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-header, 0.7));
}

.dark .comments-header {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-header-dark, 0.7));
}

/* 评论容器样式 */
.comments-container {
  background: rgba(248, 250, 252, var(--opacity-header, 0.7));
  border-radius: var(--radius-lg, 1rem);
  padding: var(--spacing-md, 1rem);
  border: var(--border-thin, 1px) solid rgba(226, 232, 240, 0.4);
}

@media (min-width: 640px) {
  .comments-container {
    padding: var(--spacing-lg, 1.25rem);
    border-radius: var(--radius-xl, 1.25rem);
  }
}

/* 暗色模式评论容器 */
.dark .comments-container {
  background: rgba(51, 65, 85, var(--opacity-header-dark, 0.7));
  border: var(--border-thin, 1px) solid rgba(255, 255, 255, 0.05);
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

/* 评论高亮动画 */
.atk-comment-highlight {
  animation: comment-highlight 2s ease-out;
}

@keyframes comment-highlight {
  0%, 50% {
    background-color: rgba(255, 20, 147, 0.2);
    box-shadow: 0 0 0 4px rgba(255, 20, 147, 0.3);
    border-radius: 8px;
  }
  100% {
    background-color: transparent;
    box-shadow: 0 0 0 0 transparent;
  }
}
</style>
