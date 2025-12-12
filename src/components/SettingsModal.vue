<template>
  <!-- 遮罩层 -->
  <AnimatePresence>
    <Motion
      v-if="isOpen"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0 }"
      :transition="{ duration: 0.25 }"
      class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      @click.self="close"
    >
      <!-- 背景遮罩 -->
      <div class="absolute inset-0 bg-black/40 backdrop-blur-md" />

      <!-- 对话框 -->
      <Motion
        :initial="{ opacity: 0, scale: 0.95, y: 20 }"
        :animate="{ opacity: 1, scale: 1, y: 0 }"
        :exit="{ opacity: 0, scale: 0.95, y: 20 }"
        :transition="{ type: 'spring', stiffness: 400, damping: 30 }"
        class="glassmorphism-modal relative rounded-xl sm:rounded-2xl md:rounded-3xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] mx-1 sm:mx-4 flex flex-col overflow-hidden"
        @click.stop
      >
        <!-- 标题栏 -->
        <div class="relative z-10 flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-5 border-b border-white/20 dark:border-slate-700/50">
          <Motion
            :initial="{ rotate: -90, scale: 0 }"
            :animate="{ rotate: 0, scale: 1 }"
            :transition="{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }"
            :while-hover="{ rotate: 90, scale: 1.1 }"
            class="cursor-pointer"
          >
            <SettingsIcon :size="24" class="text-[#ff1493] dark:text-[#ff69b4]" />
          </Motion>
          
          <Motion
            :initial="{ opacity: 0, x: -10 }"
            :animate="{ opacity: 1, x: 0 }"
            :transition="{ delay: 0.15 }"
          >
            <h2 class="text-lg sm:text-xl font-bold text-gray-800 dark:text-slate-100">
              设置
            </h2>
          </Motion>
          
          <div class="flex-1" />
          
          <Motion
            :initial="{ opacity: 0, scale: 0 }"
            :animate="{ opacity: 1, scale: 1 }"
            :transition="{ type: 'spring', stiffness: 400, damping: 20, delay: 0.2 }"
            :while-hover="{ scale: 1.1, backgroundColor: 'rgba(255,20,147,0.1)' }"
            :while-tap="{ scale: 0.9 }"
            as="button"
            class="w-10 h-10 flex items-center justify-center rounded-full text-gray-500 hover:text-[#ff1493] dark:text-slate-400 dark:hover:text-[#ff69b4] transition-colors"
            @click="close"
          >
            <X :size="20" />
          </Motion>
        </div>

        <!-- 内容区域 -->
        <div class="relative z-10 flex-1 overflow-y-auto p-3 sm:p-6 custom-scrollbar">
          <div class="space-y-6">
            <!-- 自定义样式区块 -->
            <Motion
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: 0.1 }"
              class="setting-section"
            >
              <div class="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Paintbrush :size="20" class="text-[#ff1493] dark:text-[#ff69b4]" />
                <span>自定义样式</span>
              </div>

              <div class="space-y-4">
                <p class="text-sm text-gray-600 dark:text-slate-400">
                  输入自定义 CSS 样式代码
                </p>

                <!-- CSS 代码编辑器 -->
                <div class="relative">
                  <textarea
                    v-model="localCustomCSS"
                    placeholder="*:hover {
  display: none;
}"
                    rows="10"
                    class="css-input w-full px-4 py-3 text-sm font-mono rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-md focus:shadow-lg focus:shadow-pink-500/10 transition-shadow duration-200 outline-none border-2 border-white/50 dark:border-slate-600/50 focus:border-[#ff1493] text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 resize-y min-h-[200px] max-h-[600px]"
                  />
                  <div class="absolute bottom-2 right-2 pointer-events-none text-gray-400 dark:text-slate-500 opacity-50">
                    <GripVertical :size="14" />
                  </div>
                </div>

                <!-- 提示信息卡片 -->
                <div class="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/30 rounded-xl p-4">
                  <div class="flex items-start gap-3">
                    <Info :size="20" class="text-blue-500 dark:text-blue-400 mt-0.5" />
                    <div class="flex-1 text-sm text-blue-700 dark:text-blue-300">
                      <p class="font-semibold mb-1">使用说明</p>
                      <ul class="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                        <li>支持标准 CSS 语法</li>
                        <li>可以覆盖现有样式或添加新样式</li>
                        <li>修改后点击"保存"即可应用</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Motion>

            <!-- API 设置区块 -->
            <Motion
              :initial="{ opacity: 0, y: 15 }"
              :animate="{ opacity: 1, y: 0 }"
              :transition="{ delay: 0.15 }"
              class="setting-section"
            >
              <div class="text-base sm:text-lg font-semibold text-gray-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Server :size="20" class="text-[#ff1493] dark:text-[#ff69b4]" />
                <span>API 设置</span>
              </div>

              <div class="space-y-4">
                <!-- API 服务器选择 -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
                    API 服务器
                  </label>
                  <div class="flex flex-wrap gap-2">
                    <Motion
                      v-for="(option, index) in apiOptions"
                      :key="option.value"
                      :initial="{ opacity: 0, scale: 0.9 }"
                      :animate="{ opacity: 1, scale: 1 }"
                      :transition="{ delay: 0.2 + index * 0.05 }"
                      :while-hover="{ scale: 1.03, y: -1 }"
                      :while-tap="{ scale: 0.97 }"
                      as="button"
                      type="button"
                      :class="[
                        'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 select-none',
                        selectedApiOption === option.value
                          ? 'bg-gradient-to-r from-[#ff1493] to-[#d946ef] text-white shadow-lg shadow-pink-500/25'
                          : 'bg-white/80 dark:bg-slate-700/80 text-gray-700 dark:text-slate-300 border border-gray-200/50 dark:border-slate-600/50 hover:border-pink-300 dark:hover:border-pink-500/50 hover:shadow-md'
                      ]"
                      @click="selectApiOption(option.value)"
                    >
                      {{ option.label }}
                    </Motion>
                  </div>
                </div>

                <!-- 自定义 API 地址 -->
                <AnimatePresence>
                  <Motion
                    v-if="selectedApiOption === 'custom'"
                    :initial="{ opacity: 0, height: 0 }"
                    :animate="{ opacity: 1, height: 'auto' }"
                    :exit="{ opacity: 0, height: 0 }"
                    :transition="{ duration: 0.2 }"
                    class="overflow-hidden"
                  >
                    <div class="pt-2">
                      <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                        自定义 API 地址
                      </label>
                      <div class="relative">
                        <LinkIcon
                          :size="20"
                          class="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                        />
                        <input
                          v-model="customApiInput"
                          type="url"
                          placeholder="https://api.example.com"
                          class="api-input w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-md focus:shadow-lg focus:shadow-pink-500/10 transition-shadow duration-200 outline-none border-2 border-white/50 dark:border-slate-600/50 focus:border-[#ff1493] text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400"
                        />
                      </div>
                      <div class="mt-2 space-y-1">
                        <p class="text-xs text-gray-500 dark:text-slate-400">
                          输入您自己部署的后端 API 地址。例如: http://127.0.0.1:8787
                        </p>
                        <p class="text-xs text-gray-500 dark:text-slate-400">
                          部署自定义 API 后端:
                          <a
                            href="https://github.com/Moe-Sakura/Wrangler-API"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex items-center gap-1 text-[#ff1493] dark:text-[#ff69b4] hover:underline"
                          >
                            <Github :size="12" />
                            <span>Moe-Sakura/Wrangler-API</span>
                          </a>
                        </p>
                      </div>
                    </div>
                  </Motion>
                </AnimatePresence>

                <!-- 当前选择展示 -->
                <AnimatePresence>
                  <Motion
                    v-if="selectedApiOption !== 'custom'"
                    :initial="{ opacity: 0, y: -5 }"
                    :animate="{ opacity: 1, y: 0 }"
                    :exit="{ opacity: 0, y: -5 }"
                    :transition="{ duration: 0.15 }"
                    class="p-3 rounded-xl bg-gray-50/80 dark:bg-slate-800/60 border border-gray-200/50 dark:border-slate-700/50"
                  >
                    <p class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                      <span>当前 API 地址:</span>
                      <code class="px-2 py-0.5 rounded-lg bg-white/80 dark:bg-slate-700/80 text-[#ff1493] dark:text-[#ff69b4] font-mono text-xs select-all border border-pink-200/50 dark:border-pink-800/30">
                        {{ getApiUrl(selectedApiOption) }}
                      </code>
                    </p>
                  </Motion>
                </AnimatePresence>
              </div>
            </Motion>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <Motion
          :initial="{ opacity: 0, y: 10 }"
          :animate="{ opacity: 1, y: 0 }"
          :transition="{ delay: 0.2 }"
          class="relative z-10 flex items-center justify-end gap-2 sm:gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t border-white/20 dark:border-slate-700/50 bg-white/30 dark:bg-slate-900/30"
        >
          <!-- 重置按钮 -->
          <Motion
            :while-hover="{ scale: 1.02 }"
            :while-tap="{ scale: 0.98 }"
            as="button"
            class="px-4 py-2 rounded-xl text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-slate-700/80 transition-colors font-medium flex items-center gap-2"
            @click="reset"
          >
            <RotateCcw :size="16" />
            <span>重置</span>
          </Motion>
          
          <!-- 保存按钮 -->
          <Motion
            :while-hover="{ scale: 1.03 }"
            :while-tap="{ scale: 0.97 }"
            as="button"
            class="px-6 py-2 rounded-xl text-white font-semibold shadow-lg shadow-pink-500/25 bg-gradient-to-r from-[#ff1493] to-[#d946ef] hover:shadow-xl hover:shadow-pink-500/30 transition-shadow flex items-center gap-2"
            @click="save"
          >
            <Check :size="16" />
            <span>保存</span>
          </Motion>
        </Motion>
      </Motion>
    </Motion>
  </AnimatePresence>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Motion, AnimatePresence } from 'motion-v'
import {
  Settings as SettingsIcon,
  X,
  Paintbrush,
  GripVertical,
  Info,
  Server,
  Link as LinkIcon,
  RotateCcw,
  Check,
  Github,
} from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
  customApi: string
  customCSS: string
}>()

const emit = defineEmits<{
  close: []
  save: [customApi: string, customCSS: string]
}>()

// API 服务器选项
const apiOptions = [
  { value: 'cfapi', label: 'Cloudflare' },
  { value: 'api', label: '香港' },
  { value: 'custom', label: '自定义' },
]

// API URL 映射
const apiUrls: Record<string, string> = {
  cfapi: 'https://cf.api.searchgal.homes',
  api: 'https://api.searchgal.homes',
}

// 根据 URL 判断选中的选项
function getOptionFromUrl(url: string): string {
  if (!url || url === apiUrls.cfapi) {
    return 'cfapi'
  }
  if (url === apiUrls.api) {
    return 'api'
  }
  return 'custom'
}

// 获取 API URL
function getApiUrl(option: string): string {
  return apiUrls[option] || ''
}

const selectedApiOption = ref(getOptionFromUrl(props.customApi))
const customApiInput = ref(
  selectedApiOption.value === 'custom' ? props.customApi : '',
)
const localCustomCSS = ref(props.customCSS)
const originalCustomCSS = ref(props.customCSS)

// 计算最终的 API 地址
const localCustomApi = computed(() => {
  if (selectedApiOption.value === 'custom') {
    return customApiInput.value
  }
  if (selectedApiOption.value === 'cfapi') {
    return '' // 空字符串表示使用默认
  }
  return apiUrls[selectedApiOption.value] || ''
})

// 选择 API 选项
function selectApiOption(option: string) {
  selectedApiOption.value = option
  if (option !== 'custom') {
    customApiInput.value = ''
  }
}

// 监听外部变化
watch(() => props.customApi, (newValue) => {
  selectedApiOption.value = getOptionFromUrl(newValue)
  if (selectedApiOption.value === 'custom') {
    customApiInput.value = newValue
  }
})

watch(() => props.customCSS, (newValue) => {
  localCustomCSS.value = newValue
})

// 监听打开状态，同步数据
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    selectedApiOption.value = getOptionFromUrl(props.customApi)
    customApiInput.value = selectedApiOption.value === 'custom' ? props.customApi : ''
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
  selectedApiOption.value = 'cfapi'
  customApiInput.value = ''
  localCustomCSS.value = ''
}
</script>

<style scoped>
/* 液态玻璃效果 */
.glassmorphism-modal {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.8) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 20px 40px -12px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.8) inset;
}

.dark .glassmorphism-modal {
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.95) 0%,
    rgba(15, 23, 42, 0.9) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 105, 180, 0.15);
  box-shadow:
    0 20px 40px -12px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
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

/* 确保输入框内容可以正常选中 */
.api-input,
.css-input {
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
}

.api-input::selection,
.css-input::selection {
  background-color: rgba(255, 20, 147, 0.3);
}

/* 设置区块 */
.setting-section {
  border-radius: 0.75rem;
  padding: 0.75rem;
}

@media (min-width: 640px) {
  .setting-section {
    border-radius: 1rem;
    padding: 1rem;
  }
}
</style>
