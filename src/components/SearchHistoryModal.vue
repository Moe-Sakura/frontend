<template>
  <Teleport to="body">
    <!-- 历史记录面板 - 右下角弹出 -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-90 translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-90 translate-y-2"
    >
      <div
        v-if="uiStore.isHistoryModalOpen"
        class="history-modal fixed z-[100] flex flex-col
               bottom-20 right-4 w-80 max-h-[60vh]
               rounded-2xl shadow-2xl shadow-black/20"
      >
        <!-- 顶部导航栏 -->
        <div class="history-header flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/10 dark:border-slate-700/50 rounded-t-2xl">
          <!-- 标题 -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30">
              <History :size="16" class="text-white" />
            </div>
            <div>
              <h1 class="text-sm font-bold text-gray-800 dark:text-white">搜索历史</h1>
              <p v-if="history.length > 0" class="text-xs text-gray-500 dark:text-slate-400">{{ history.length }} 条记录</p>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="flex items-center gap-1">
            <button
              v-if="history.length > 0"
              v-ripple="'rgba(239, 68, 68, 0.3)'"
              class="w-7 h-7 rounded-full flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="清空历史"
              @click="handleClearHistory"
            >
              <Trash2 :size="14" />
            </button>
            <button
              class="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              @click="closeModal"
            >
              <X :size="16" />
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div class="p-2">
            <!-- 无历史记录时显示 -->
            <div 
              v-if="history.length === 0"
              class="flex flex-col items-center justify-center py-8 text-center"
            >
              <div class="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-3">
                <History :size="24" class="text-amber-400/50" />
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                暂无搜索历史
              </p>
            </div>

            <!-- 历史记录列表 -->
            <div v-else class="space-y-1">
              <TransitionGroup
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 translate-x-2"
                enter-to-class="opacity-100 translate-x-0"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0 scale-95"
                move-class="transition-all duration-200"
              >
                <div
                  v-for="(item, index) in history"
                  :key="item.query + item.mode + index"
                  v-ripple
                  role="button"
                  tabindex="0"
                  class="history-item group w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer"
                  @click="handleSelectHistory(item)"
                  @keydown.enter="handleSelectHistory(item)"
                  @keydown.space.prevent="handleSelectHistory(item)"
                >
                  <!-- 模式标签 -->
                  <span
                    class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0"
                    :class="item.mode === 'game' 
                      ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' 
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'"
                  >
                    {{ item.mode === 'game' ? '游戏' : '补丁' }}
                  </span>
                  
                  <!-- 搜索关键词 -->
                  <span 
                    v-text-scroll 
                    class="flex-1 text-sm font-medium text-gray-700 dark:text-slate-200 text-left group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                  >
                    {{ item.query }}
                  </span>

                  <!-- 结果数 -->
                  <span 
                    v-if="item.resultCount" 
                    class="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0"
                  >
                    {{ item.resultCount }}
                  </span>

                  <!-- 删除按钮 -->
                  <button
                    type="button"
                    class="w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex-shrink-0"
                    @click.stop="handleRemoveItem(index)"
                  >
                    <X :size="12" class="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              </TransitionGroup>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { loadSearchHistory, clearSearchHistory as clearHistoryStorage, type SearchHistory } from '@/utils/persistence'
import { playSelect, playTap, playCaution, playTransitionUp, playTransitionDown } from '@/composables/useSound'
import { History, Trash2, X } from 'lucide-vue-next'

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
  playSelect()
  
  // 先发送事件（让父组件更新 URL）
  emit('select', item)
  
  // 然后关闭面板
  uiStore.isHistoryModalOpen = false
}

// 清空历史
function handleClearHistory() {
  playCaution()
  if (confirm('确定要清空所有搜索历史吗？')) {
    clearHistoryStorage()
    history.value = []
  }
}

// 删除单条记录
function handleRemoveItem(index: number) {
  playTap()
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
  playTransitionDown()
  uiStore.isHistoryModalOpen = false
}

// 键盘事件
function handleKeydown(e: globalThis.KeyboardEvent) {
  if (!uiStore.isHistoryModalOpen) {return}
  
  if (e.key === 'Escape') {
    e.preventDefault()
    closeModal()
  }
}

// 监听面板打开时加载数据
watch(() => uiStore.isHistoryModalOpen, (isOpen) => {
  if (isOpen) {
    playTransitionUp()
    loadHistory()
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
})
</script>

<style>
/* 历史记录面板 - 右下角弹出 (亮色模式) */
.history-modal {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(255, 251, 235, 0.98) 100%
  );
  backdrop-filter: blur(40px) saturate(1.5);
  -webkit-backdrop-filter: blur(40px) saturate(1.5);
  border: 1px solid rgba(251, 191, 36, 0.2);
}

/* 历史记录面板 - 右下角弹出 (暗色模式) */
.dark .history-modal {
  background: linear-gradient(
    180deg,
    rgba(30, 41, 59, 0.95) 0%,
    rgba(30, 27, 17, 0.98) 100%
  ) !important;
  backdrop-filter: blur(40px) saturate(1.5) !important;
  -webkit-backdrop-filter: blur(40px) saturate(1.5) !important;
  border: 1px solid rgba(251, 191, 36, 0.1) !important;
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
  background: transparent;
}

.history-item:hover {
  background: rgba(251, 191, 36, 0.08);
}

.dark .history-item:hover {
  background: rgba(251, 191, 36, 0.12) !important;
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
