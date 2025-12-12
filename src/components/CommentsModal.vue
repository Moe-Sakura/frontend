<template>
  <!-- 遮罩层 -->
  <Transition
    enter-active-class="transition-opacity duration-200 ease-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200 ease-in"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="uiStore.isCommentsModalOpen"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      @click.self="closeModal"
    >
      <!-- 对话框 -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="uiStore.isCommentsModalOpen"
          class="glassmorphism-modal rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl sm:max-w-5xl lg:max-w-6xl max-h-[90vh] mx-1 sm:mx-4 flex flex-col overflow-hidden"
          @click.stop
        >
          <!-- 标题栏 -->
          <div class="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-b border-[#ff1493]/20 dark:border-slate-700">
            <MessageCircle :size="20" class="text-[#ff1493] dark:text-[#ff69b4]" />
            <h2 class="text-base sm:text-lg font-bold text-gray-800 dark:text-slate-100 flex-1">评论区</h2>
            <button
              class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-[#ff1493]/10 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-[#ff1493] dark:hover:text-[#ff69b4] transition-all duration-200"
              @click="closeModal"
            >
              <X :size="20" />
            </button>
          </div>

          <!-- 内容区域 -->
          <div class="flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar">
            <div id="Comments" />
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useUIStore } from '@/stores/ui'
import Artalk from 'artalk/dist/Artalk.mjs'
import { MessageCircle, X } from 'lucide-vue-next'

interface ArtalkInstance {
  destroy(): void
}

const uiStore = useUIStore()
let artalkInstance: ArtalkInstance | null = null
let isClosing = false

function closeModal() {
  if (isClosing) {return}
  isClosing = true
  
  uiStore.toggleCommentsModal()
  
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
    } catch (error) {
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
      } catch (error) {
        // 静默处理错误
      }
    }
  })
}

// 监听模态框打开状态
watch(() => uiStore.isCommentsModalOpen, (isOpen: boolean) => {
  if (isOpen) {
    // 延迟初始化，确保 DOM 已渲染
    setTimeout(() => {
      initArtalk()
    }, 100)
  }
})

onMounted(() => {
  // 如果挂载时模态框就是打开的，初始化 Artalk
  if (uiStore.isCommentsModalOpen) {
    setTimeout(() => {
      initArtalk()
    }, 200)
  }
})

onUnmounted(() => {
  // 销毁 Artalk 实例
  if (artalkInstance) {
    try {
      artalkInstance.destroy()
      artalkInstance = null
    } catch (error) {
      // 静默处理错误
    }
  }
})
</script>

<style scoped>
/* 自定义滚动条 - 粉色渐变 */
.custom-scrollbar::-webkit-scrollbar {
  width: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--theme-primary), var(--theme-accent));
  border-radius: 10px;
  transition: background 0.3s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(219, 39, 119), rgb(124, 58, 237));
}
</style>
