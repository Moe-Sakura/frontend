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
          class="bg-white/60 dark:bg-slate-800/60 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] mx-4 flex flex-col overflow-hidden border border-white/40 dark:border-slate-700/40"
          @click.stop
        >
          <!-- 标题栏 -->
          <div class="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200/50 dark:border-slate-700">
            <i class="fas fa-cog text-[#ff1493] dark:text-[#ff69b4] text-xl sm:text-2xl" />
            <h2 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-slate-100 flex-1">设置</h2>
            <button
              class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200/50 dark:hover:bg-slate-700/50 text-gray-500 hover:text-[#ff1493] dark:text-slate-400 dark:hover:text-[#ff69b4] transition-all duration-200"
              @click="close"
            >
              <i class="fas fa-times text-xl" />
            </button>
          </div>

          <!-- 内容区域 -->
          <div class="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            <div class="space-y-6">
              <!-- 自定义样式 -->
              <div class="setting-section">
                <h3 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <i class="fas fa-paint-brush text-[#ff1493] dark:text-[#ff69b4]" />
                  <span>自定义样式</span>
                </h3>
                
                <div class="space-y-4">
                  <p class="text-sm text-gray-600 dark:text-slate-400">
                    自定义 CSS 样式代码，支持 Tailwind CSS 的暗色模式变体（dark:）
                  </p>
                  
                  <!-- CSS 代码编辑器 -->
                  <div class="relative">
                    <textarea
                      v-model="localCustomCSS"
                      placeholder="/* 输入自定义 CSS 代码 */
.my-custom-class {
  background: linear-gradient(to right, #ff1493, #d946ef);
}

.dark .my-custom-class {
  background: linear-gradient(to right, #ff69b4, #e879f9);
}"
                      rows="10"
                      class="w-full px-4 py-3 text-sm font-mono rounded-xl bg-white dark:bg-slate-700/50 backdrop-blur-md shadow-md focus:shadow-lg focus:scale-[1.01] transition-all outline-none border-2 border-transparent text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 resize-none"
                        @focus="$event.target.style.borderColor = '#ff1493'"
                      @blur="$event.target.style.borderColor = 'transparent'"
                    />
                  </div>
                  
                  <!-- 提示信息 -->
                  <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
                    <div class="flex items-start gap-3">
                      <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-lg mt-0.5" />
                      <div class="flex-1 text-sm text-blue-700 dark:text-blue-300">
                        <p class="font-semibold mb-1">使用说明</p>
                        <ul class="list-disc list-inside space-y-1">
                          <li>支持标准 CSS 语法</li>
                          <li>使用 <code class="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded">.dark</code> 选择器定义暗色模式样式</li>
                          <li>可以覆盖现有样式或添加新样式</li>
                          <li>修改后点击"保存"即可应用</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- API 设置 -->
              <div class="setting-section">
                <h3 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <i class="fas fa-server text-[#ff1493] dark:text-[#ff69b4]" />
                  <span>API 设置</span>
                </h3>
                
                <div class="space-y-4">
                  <!-- 自定义 API 地址 -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                      自定义 API 地址
                    </label>
                    <div class="relative">
                      <i class="fas fa-link absolute left-3 sm:left-4 top-3 sm:top-4 text-gray-400 text-lg sm:text-xl pointer-events-none z-10" />
                      <input
                        v-model="localCustomApi"
                        type="url"
                        placeholder="https://cfapi.searchgal.homes"
                        class="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base rounded-xl bg-white dark:bg-slate-700/50 backdrop-blur-md shadow-md focus:shadow-lg focus:scale-[1.01] transition-all outline-none border-2 border-transparent text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400"
                        @focus="$event.target.style.borderColor = '#ff1493'"
                        @blur="$event.target.style.borderColor = 'transparent'"
                      />
                    </div>
                    <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
                      留空使用默认 API 地址。例如: https://cfapi.searchgal.homes 或 http://127.0.0.1:8787
                    </p>
                  </div>

                  <!-- API 状态 -->
                  <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4">
                    <div class="flex items-start gap-3">
                      <i class="fas fa-info-circle text-blue-500 dark:text-blue-400 text-lg mt-0.5" />
                      <div class="flex-1 text-sm text-blue-700 dark:text-blue-300">
                        <p class="font-semibold mb-1">关于自定义 API</p>
                        <p>您可以使用自己部署的后端 API 进行搜索。API 需要兼容 SearchGal 的接口规范。</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 底部操作栏 -->
          <div class="flex items-center justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-slate-700">
            <button
              class="px-4 py-2 rounded-xl text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all font-medium"
              @click="reset"
            >
              <i class="fas fa-undo mr-2" />
              重置
            </button>
            <button
              class="px-6 py-2 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all bg-gradient-to-r from-[#ff1493] to-[#d946ef]"
              @click="save"
            >
              <i class="fas fa-check mr-2" />
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
  customCSS: string
}>()

const emit = defineEmits<{
  close: []
  save: [customApi: string, customCSS: string]
}>()

const localCustomApi = ref(props.customApi)
const localCustomCSS = ref(props.customCSS)
const originalCustomCSS = ref(props.customCSS)

// 监听外部变化
watch(() => props.customApi, (newValue) => {
  localCustomApi.value = newValue
})

watch(() => props.customCSS, (newValue) => {
  localCustomCSS.value = newValue
})

// 监听打开状态，同步数据
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    localCustomApi.value = props.customApi
    localCustomCSS.value = props.customCSS
    originalCustomCSS.value = props.customCSS
  }
})

function close() {
  emit('close')
}

function save() {
  emit('save', localCustomApi.value, localCustomCSS.value)
  emit('close')
}

function reset() {
  localCustomApi.value = ''
  localCustomCSS.value = ''
}
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 10px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #ff1493, #d946ef);
  border-radius: 10px;
  transition: background 0.3s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #c71585, #c026d3);
}

/* 暗色模式滚动条 */
.dark .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(30, 41, 59, 0.3);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #ff69b4, #e879f9);
}

.dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #ff1493, #d946ef);
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

