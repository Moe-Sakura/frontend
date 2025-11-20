<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="history.length > 0 && showHistory"
      class="w-full max-w-2xl mx-auto mt-3 px-2 sm:px-0"
    >
      <div class="bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 border border-white/30">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <i class="fas fa-history text-pink-500 text-sm" />
            <span class="text-sm font-semibold text-gray-700">搜索历史</span>
            <span class="text-xs text-gray-500">({{ history.length }})</span>
          </div>
          <button
            class="text-xs text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1"
            @click="clearHistory"
          >
            <i class="fas fa-trash-alt" />
            <span>清空</span>
          </button>
        </div>
        
        <div class="flex flex-wrap gap-2">
          <button
            v-for="(item, index) in history"
            :key="index"
            class="history-item px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-pink-50 border border-gray-200 hover:border-pink-300 transition-all text-sm flex items-center gap-2 group"
            @click="selectHistory(item)"
          >
            <i
              :class="item.mode === 'game' ? 'fas fa-gamepad' : 'fas fa-tools'"
              class="text-xs text-gray-400 group-hover:text-pink-500 transition-colors"
            />
            <span class="text-gray-700 group-hover:text-pink-600 font-medium">{{ item.query }}</span>
            <span class="text-xs text-gray-400 group-hover:text-pink-400">{{ item.resultCount }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { loadSearchHistory, clearSearchHistory as clearHistoryStorage, type SearchHistory } from '@/utils/persistence'

const history = ref<SearchHistory[]>([])
const showHistory = ref(true)

const emit = defineEmits<{
  select: [history: SearchHistory]
}>()

function loadHistory() {
  history.value = loadSearchHistory()
}

function selectHistory(item: SearchHistory) {
  emit('select', item)
  showHistory.value = false
  // 延迟显示，避免闪烁
  setTimeout(() => {
    showHistory.value = true
  }, 300)
}

function clearHistory() {
  if (confirm('确定要清空搜索历史吗？')) {
    clearHistoryStorage()
    history.value = []
  }
}

onMounted(() => {
  loadHistory()
})

// 暴露方法供父组件调用
defineExpose({
  loadHistory,
})
</script>

<style scoped>
.history-item {
  cursor: pointer;
  user-select: none;
}

.history-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(236, 72, 153, 0.2);
}

.history-item:active {
  transform: translateY(0);
}
</style>

