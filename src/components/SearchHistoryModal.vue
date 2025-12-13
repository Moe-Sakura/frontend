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
        v-if="uiStore.isHistoryModalOpen"
        class="fixed inset-0 z-[99] hidden sm:block glassmorphism-overlay"
        @click="closeModal"
      />
    </Transition>

    <!-- 历史记录面板 -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 max-sm:translate-y-full sm:scale-95 sm:opacity-0"
      enter-to-class="opacity-100 max-sm:translate-y-0 sm:scale-100 sm:opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 max-sm:translate-y-0 sm:scale-100 sm:opacity-100"
      leave-to-class="opacity-0 max-sm:translate-y-full sm:scale-95 sm:opacity-0"
    >
      <div
        v-if="uiStore.isHistoryModalOpen"
        class="history-modal fixed z-[100] flex flex-col
               inset-0 
               sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2
               sm:w-[90vw] sm:max-w-xl sm:h-auto sm:max-h-[80vh]
               sm:rounded-2xl sm:shadow-2xl sm:shadow-amber-500/20"
      >
        <!-- 顶部导航栏 -->
        <div class="history-header flex-shrink-0 flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/50">
          <!-- 返回按钮 -->
          <button
            v-ripple
            class="flex items-center gap-1 px-3 py-2 -ml-2 rounded-xl text-amber-500 dark:text-amber-400 font-medium transition-all hover:bg-amber-50 dark:hover:bg-amber-900/20"
            @click="closeModal"
          >
            <ChevronLeft :size="20" />
            <span class="text-sm sm:text-base">返回</span>
          </button>

          <!-- 标题 -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <History :size="16" class="text-white" />
            </div>
            <h1 class="text-base sm:text-lg font-bold text-gray-800 dark:text-white">搜索历史</h1>
            <span 
              v-if="history.length > 0"
              class="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-xs font-semibold text-amber-600 dark:text-amber-400"
            >
              {{ history.length }}
            </span>
          </div>

          <!-- 桌面端关闭按钮 / 移动端清空按钮 -->
          <button
            v-if="history.length > 0"
            v-ripple="'rgba(239, 68, 68, 0.3)'"
            class="sm:hidden flex items-center gap-1 px-3 py-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
            @click="handleClearHistory"
          >
            <Trash2 :size="16" />
          </button>
          <button
            v-ripple
            class="hidden sm:flex w-9 h-9 rounded-xl items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
            @click="closeModal"
          >
            <X :size="20" />
          </button>
          <div v-if="history.length === 0" class="w-12 sm:w-9" />
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div class="px-4 sm:px-5 py-4 sm:py-5">
            <!-- 无历史记录时显示 -->
            <div 
              v-if="history.length === 0"
              class="flex flex-col items-center justify-center py-12 text-center"
            >
              <div class="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4">
                <History :size="32" class="text-amber-400/50" />
              </div>
              <h3 class="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">暂无搜索历史</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                你的搜索记录将会显示在这里
              </p>
            </div>

            <!-- 历史记录列表 -->
            <div v-else class="space-y-2">
              <!-- 桌面端清空按钮 -->
              <div class="hidden sm:flex justify-end mb-3">
                <button
                  v-ripple="'rgba(239, 68, 68, 0.3)'"
                  class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all font-medium"
                  @click="handleClearHistory"
                >
                  <Trash2 :size="14" />
                  <span>清空全部</span>
                </button>
              </div>

              <TransitionGroup
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 translate-y-2 scale-95"
                enter-to-class="opacity-100 translate-y-0 scale-100"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0 scale-100"
                leave-to-class="opacity-0 translate-y-2 scale-95"
                move-class="transition-all duration-300 ease-out"
              >
                <button
                  v-for="(item, index) in history"
                  :key="item.query + item.mode + index"
                  v-ripple
                  class="history-item group w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200"
                  :style="{ animationDelay: `${index * 30}ms` }"
                  @click="handleSelectHistory(item)"
                >
                  <!-- 模式图标 -->
                  <div
                    class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md"
                    :class="item.mode === 'game' 
                      ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' 
                      : 'bg-gradient-to-br from-amber-400 to-orange-500'"
                  >
                    <component
                      :is="item.mode === 'game' ? Gamepad2 : Wrench"
                      :size="20"
                      class="text-white"
                    />
                  </div>
                  
                  <!-- 搜索信息 -->
                  <div class="flex-1 text-left min-w-0">
                    <div class="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                      {{ item.query }}
                    </div>
                    <div class="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span :class="item.mode === 'game' ? 'text-emerald-500' : 'text-amber-500'">
                        {{ item.mode === 'game' ? '游戏' : '补丁' }}
                      </span>
                      <span v-if="item.resultCount" class="text-gray-300 dark:text-gray-600">•</span>
                      <span v-if="item.resultCount">{{ item.resultCount }} 个结果</span>
                    </div>
                  </div>

                  <!-- 删除按钮 -->
                  <button
                    class="w-8 h-8 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                    @click.stop="handleRemoveItem(index)"
                  >
                    <X :size="16" class="text-gray-400 hover:text-red-500" />
                  </button>

                  <!-- 箭头 -->
                  <ChevronRight :size="18" class="text-gray-300 dark:text-gray-600 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                </button>
              </TransitionGroup>
            </div>
          </div>
        </div>

        <!-- 底部快捷键提示 -->
        <div 
          v-if="history.length > 0"
          class="flex-shrink-0 px-4 sm:px-5 py-3 border-t border-gray-100 dark:border-slate-700/50 flex items-center justify-center gap-4 text-xs text-gray-400 dark:text-gray-500"
        >
          <span class="flex items-center gap-1.5">
            <kbd class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 font-mono text-[10px]">Enter</kbd>
            搜索
          </span>
          <span class="flex items-center gap-1.5">
            <kbd class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-700 font-mono text-[10px]">Esc</kbd>
            关闭
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { loadSearchHistory, clearSearchHistory as clearHistoryStorage, type SearchHistory } from '@/utils/persistence'
import { playClick, playPop } from '@/composables/useSound'
import { lockScroll, unlockScroll, forceUnlockScroll } from '@/composables/useScrollLock'
import { ChevronLeft, History, Trash2, Gamepad2, Wrench, X, ChevronRight } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const uiStore = useUIStore()
const history = ref<SearchHistory[]>([])

const emit = defineEmits<{
  select: [history: SearchHistory]
}>()

// 加载历史记录
function loadHistory() {
  history.value = loadSearchHistory()
}

// 选择历史记录
function handleSelectHistory(item: SearchHistory) {
  playClick()
  
  // 先发送事件（让父组件更新 URL）
  emit('select', item)
  
  // 然后关闭模态框（不使用 router.push 避免覆盖 URL 参数）
  uiStore.isHistoryModalOpen = false
  unlockScroll()
}

// 清空历史
function handleClearHistory() {
  playPop()
  if (confirm('确定要清空所有搜索历史吗？')) {
    clearHistoryStorage()
    history.value = []
  }
}

// 删除单条记录
function handleRemoveItem(index: number) {
  playClick()
  history.value.splice(index, 1)
  if (history.value.length > 0) {
    // 使用与 persistence.ts 一致的 key
    window.localStorage.setItem('searchgal_history', JSON.stringify(history.value))
  } else {
    clearHistoryStorage()
  }
}

// 关闭模态框
function closeModal() {
  playPop()
  // 移除 ui 参数，保留其他参数
  const newQuery = { ...route.query }
  delete newQuery.ui
  router.push({ path: '/', query: newQuery })
}

// 键盘事件
function handleKeydown(e: globalThis.KeyboardEvent) {
  if (!uiStore.isHistoryModalOpen) {return}
  
  if (e.key === 'Escape') {
    e.preventDefault()
    closeModal()
  }
}

// 监听模态框打开时加载数据
watch(() => uiStore.isHistoryModalOpen, (isOpen) => {
  if (isOpen) {
    loadHistory()
    lockScroll()
  } else {
    unlockScroll()
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  if (uiStore.isHistoryModalOpen) {
    loadHistory()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  forceUnlockScroll()
})
</script>

<style>
/* 历史记录模态框 - 移动端全屏 */
.history-modal {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(255, 251, 235, 0.98) 100%
  );
}

/* 桌面端模态框 */
@media (min-width: 640px) {
  .history-modal {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(251, 191, 36, 0.2);
  }
}

/* 暗色模式 */
.dark .history-modal {
  background: linear-gradient(
    180deg,
    rgb(15, 23, 42) 0%,
    rgb(30, 27, 17) 100%
  ) !important;
}

@media (min-width: 640px) {
  .dark .history-modal {
    background: rgba(30, 41, 59, 0.95) !important;
    border: 1px solid rgba(251, 191, 36, 0.1) !important;
  }
}

/* 头部样式 */
.history-header {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.dark .history-header {
  background: rgba(30, 41, 59, 0.8) !important;
}

/* 历史记录项 */
.history-item {
  background: rgba(255, 251, 235, 0.5);
  border: 1px solid rgba(251, 191, 36, 0.1);
  animation: historyItemFadeIn 0.3s ease-out both;
}

.dark .history-item {
  background: rgba(51, 48, 35, 0.5) !important;
  border: 1px solid rgba(251, 191, 36, 0.1) !important;
}

.history-item:hover {
  background: rgba(251, 191, 36, 0.1);
  border-color: rgba(251, 191, 36, 0.3);
  transform: translateX(4px);
}

.dark .history-item:hover {
  background: rgba(251, 191, 36, 0.15) !important;
  border-color: rgba(251, 191, 36, 0.3) !important;
}

@keyframes historyItemFadeIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #f59e0b, #d97706);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #d97706, #b45309);
}
</style>
