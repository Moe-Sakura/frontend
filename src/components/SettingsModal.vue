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
      v-if="isOpen"
      class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="close"
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
          v-if="isOpen"
          class="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] mx-4 flex flex-col overflow-hidden border border-white/30 dark:border-slate-700/50"
          @click.stop
        >
          <!-- 标题栏 -->
          <div class="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-pink-100 dark:border-slate-700">
            <i class="fas fa-cog text-pink-500 dark:text-purple-400 text-xl sm:text-2xl"></i>
            <h2 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-slate-100 flex-1">设置</h2>
            <button
              @click="close"
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-pink-50 text-gray-500 hover:text-pink-500 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-purple-400 transition-all duration-200"
            >
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <!-- 内容区域 -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div class="space-y-6">
              <!-- API 设置 -->
              <div class="setting-section">
                <h3 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <i class="fas fa-server text-pink-500 dark:text-purple-400"></i>
                  <span>API 设置</span>
                </h3>
                
                <div class="space-y-4">
                  <!-- 自定义 API 地址 -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      自定义 API 地址
                    </label>
                    <div class="relative">
                      <i class="fas fa-link absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400 text-lg sm:text-xl pointer-events-none z-10"></i>
                      <input
                        v-model="localCustomApi"
                        type="url"
                        placeholder="https://cfapi.searchgal.homes"
                        class="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base rounded-xl bg-white dark:bg-slate-700/50 backdrop-blur-md shadow-md focus:shadow-lg focus:scale-[1.01] transition-all outline-none border-2 border-transparent focus:border-pink-500 dark:focus:border-purple-500 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400"
                      />
                    </div>
                    <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
                      留空使用默认 API 地址。例如: https://cfapi.searchgal.homes 或 http://127.0.0.1:8787
                    </p>
                  </div>

                  <!-- API 状态 -->
                  <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
                    <div class="flex items-start gap-3">
                      <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-lg mt-0.5"></i>
                      <div class="flex-1 text-sm text-blue-700 dark:text-blue-300">
                        <p class="font-semibold mb-1">关于自定义 API</p>
                        <p>您可以使用自己部署的后端 API 进行搜索。API 需要兼容 SearchGal 的接口规范。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 更多设置可以在这里添加 -->
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-pink-100 dark:border-slate-700">
            <button
              @click="reset"
              class="px-4 py-2 rounded-xl text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all font-medium"
            >
              <i class="fas fa-undo mr-2"></i>
              重置
            </button>
            <button
              @click="save"
              class="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-pink-600 dark:from-purple-600 dark:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <i class="fas fa-check mr-2"></i>
              保存
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  isOpen: boolean
  customApi: string
}>()

const emit = defineEmits<{
  close: []
  save: [customApi: string]
}>()

const localCustomApi = ref(props.customApi)

// 监听外部变化
watch(() => props.customApi, (newValue) => {
  localCustomApi.value = newValue
})

// 监听打开状态，同步数据
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    localCustomApi.value = props.customApi
  }
})

function close() {
  emit('close')
}

function save() {
  emit('save', localCustomApi.value)
  close()
}

function reset() {
  localCustomApi.value = ''
}
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
  background: linear-gradient(180deg, rgb(236, 72, 153), rgb(139, 92, 246));
  border-radius: 10px;
  transition: background 0.3s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(219, 39, 119), rgb(124, 58, 237));
}

/* 暗色模式滚动条 */
.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.3);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgb(139, 92, 246), rgb(99, 102, 241));
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(124, 58, 237), rgb(79, 70, 229));
}

/* 设置区块 */
.setting-section {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

