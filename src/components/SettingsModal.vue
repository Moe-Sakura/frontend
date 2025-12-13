<template>
  <!-- 全屏设置页面 -->
  <AnimatePresence>
    <Motion
      v-if="isOpen"
      :initial="{ opacity: 0, y: '100%' }"
      :animate="{ opacity: 1, y: 0 }"
      :exit="{ opacity: 0, y: '100%' }"
      :transition="{ type: 'spring', stiffness: 300, damping: 30 }"
      class="fixed inset-0 z-50 flex flex-col settings-page"
    >
      <!-- 顶部导航栏 -->
      <Motion
        :initial="{ opacity: 0, y: -20 }"
        :animate="{ opacity: 1, y: 0 }"
        :transition="{ delay: 0.1, duration: 0.3 }"
        class="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/50 glassmorphism-navbar"
      >
        <!-- 返回按钮 -->
        <Motion
          :while-hover="{ scale: 1.05, x: -2 }"
          :while-tap="{ scale: 0.95 }"
          as="button"
          class="flex items-center gap-1 text-[#ff1493] dark:text-[#ff69b4] font-medium transition-colors"
          @click="close"
        >
          <ChevronLeft :size="24" />
          <span class="text-base">返回</span>
        </Motion>

        <!-- 标题 -->
        <div class="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <SettingsIcon :size="20" class="text-[#ff1493] dark:text-[#ff69b4]" />
          <h1 class="text-lg font-bold text-gray-800 dark:text-white">设置</h1>
        </div>

        <!-- 保存按钮 -->
        <Motion
          :while-hover="{ scale: 1.05 }"
          :while-tap="{ scale: 0.95 }"
          as="button"
          class="px-4 py-1.5 rounded-full text-white text-sm font-semibold bg-gradient-to-r from-[#ff1493] to-[#d946ef] shadow-lg shadow-pink-500/25"
          @click="save"
        >
          保存
        </Motion>
      </Motion>

      <!-- 内容区域 -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <!-- API 设置卡片 -->
          <Motion
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: 0.15 }"
            class="settings-card"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Server :size="20" class="text-white" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-white">API 服务器</h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">选择或自定义 API 地址</p>
              </div>
            </div>

            <!-- API 选项列表 -->
            <div class="space-y-2">
              <Motion
                v-for="(option, index) in apiOptions"
                :key="option.value"
                :initial="{ opacity: 0, x: -20 }"
                :animate="{ opacity: 1, x: 0 }"
                :transition="{ delay: 0.25 + index * 0.05 }"
                :while-tap="{ scale: 0.98 }"
                as="button"
                type="button"
                :class="[
                  'w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200',
                  selectedApiOption === option.value
                    ? 'bg-gradient-to-r from-[#ff1493]/10 to-[#d946ef]/10 border-2 border-[#ff1493] dark:border-[#ff69b4]'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-2 border-transparent hover:border-pink-200 dark:hover:border-pink-900'
                ]"
                @click="selectApiOption(option.value)"
              >
                <div class="flex items-center gap-3">
                  <div
                    :class="[
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
                      selectedApiOption === option.value
                        ? 'border-[#ff1493] bg-[#ff1493]'
                        : 'border-gray-300 dark:border-slate-600'
                    ]"
                  >
                    <Check v-if="selectedApiOption === option.value" :size="12" class="text-white" />
                  </div>
                  <span
                    :class="[
                      'font-medium',
                      selectedApiOption === option.value
                        ? 'text-[#ff1493] dark:text-[#ff69b4]'
                        : 'text-gray-700 dark:text-slate-300'
                    ]"
                  >
                    {{ option.label }}
                  </span>
                </div>
                <span v-if="option.value !== 'custom'" class="text-xs text-gray-400 dark:text-slate-500 font-mono">
                  {{ getApiUrl(option.value) }}
                </span>
              </Motion>
            </div>

            <!-- 自定义 API 输入 -->
            <AnimatePresence>
              <Motion
                v-if="selectedApiOption === 'custom'"
                :initial="{ opacity: 0, height: 0 }"
                :animate="{ opacity: 1, height: 'auto' }"
                :exit="{ opacity: 0, height: 0 }"
                :transition="{ duration: 0.2 }"
                class="overflow-hidden"
              >
                <div class="mt-4 space-y-3">
                  <div class="relative">
                    <LinkIcon :size="18" class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      v-model="customApiInput"
                      type="url"
                      placeholder="https://api.example.com"
                      class="api-input w-full pl-12 pr-4 py-4 text-base rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-pink-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-[#ff1493] text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    />
                  </div>
                  <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
                    <Github :size="14" />
                    <span>部署后端:</span>
                    <a
                      href="https://github.com/Moe-Sakura/Wrangler-API"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-[#ff1493] dark:text-[#ff69b4] hover:underline"
                    >
                      Moe-Sakura/Wrangler-API
                    </a>
                  </div>
                </div>
              </Motion>
            </AnimatePresence>
          </Motion>

          <!-- 自定义样式卡片 -->
          <Motion
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: 0.2 }"
            class="settings-card"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Paintbrush :size="20" class="text-white" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-white">自定义样式</h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">添加自定义 CSS 代码</p>
              </div>
            </div>

            <!-- CSS 编辑器 -->
            <div class="relative">
              <textarea
                v-model="localCustomCSS"
                placeholder="/* 在这里输入自定义 CSS */
*:hover {
  display: none;
}"
                rows="12"
                class="css-input w-full px-4 py-4 text-sm font-mono rounded-2xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-pink-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-[#ff1493] text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 resize-y min-h-[250px] max-h-[500px]"
              />
              <div class="absolute bottom-3 right-3 pointer-events-none text-gray-300 dark:text-slate-600">
                <GripVertical :size="16" />
              </div>
            </div>

            <!-- 提示信息 -->
            <div class="mt-4 flex items-start gap-3 p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/30">
              <Info :size="18" class="text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div class="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <p class="font-medium">使用说明</p>
                <ul class="text-blue-600 dark:text-blue-400 space-y-0.5 text-xs">
                  <li>• 支持标准 CSS 语法</li>
                  <li>• 可以覆盖现有样式或添加新样式</li>
                  <li>• 修改后点击"保存"即可应用</li>
                </ul>
              </div>
            </div>
          </Motion>

          <!-- 重置区域 -->
          <Motion
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: 0.25 }"
            class="settings-card bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/30"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/30">
                  <RotateCcw :size="20" class="text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-800 dark:text-white">重置设置</h2>
                  <p class="text-sm text-gray-500 dark:text-slate-400">恢复所有设置为默认值</p>
                </div>
              </div>
              <Motion
                :while-hover="{ scale: 1.05 }"
                :while-tap="{ scale: 0.95 }"
                as="button"
                class="px-4 py-2 rounded-xl text-red-600 dark:text-red-400 font-medium bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                @click="reset"
              >
                重置
              </Motion>
            </div>
          </Motion>
        </div>
      </div>
    </Motion>
  </AnimatePresence>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Motion, AnimatePresence } from 'motion-v'
import { playClick, playSuccess, playToggle } from '@/composables/useSound'
import { lockScroll, unlockScroll } from '@/composables/useScrollLock'
import {
  Settings as SettingsIcon,
  ChevronLeft,
  Paintbrush,
  GripVertical,
  Info,
  Server,
  Link as LinkIcon,
  RotateCcw,
  Check,
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
  { value: 'cfapi', label: 'Cloudflare (默认)' },
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
  playToggle()
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
    // 锁定 body 滚动
    lockScroll()
  } else {
    // 恢复 body 滚动
    unlockScroll()
  }
})

function close() {
  playClick()
  emit('close')
}

function save() {
  playSuccess()
  emit('save', localCustomApi.value, localCustomCSS.value)
  emit('close')
}

function reset() {
  playClick()
  selectedApiOption.value = 'cfapi'
  customApiInput.value = ''
  localCustomCSS.value = ''
}
</script>

<style>
/* 全屏设置页面背景 - 亮色模式 */
.settings-page {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(248, 250, 252, 0.98) 100%
  );
}

/* 全屏设置页面背景 - 暗色模式 */
.dark .settings-page {
  background: linear-gradient(
    180deg,
    rgb(15, 23, 42) 0%,
    rgb(2, 6, 23) 100%
  ) !important;
}

/* 设置卡片 - 亮色模式 */
.settings-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.25rem;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 4px 24px -4px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
}

/* 设置卡片 - 暗色模式 */
.dark .settings-card {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow:
    0 4px 24px -4px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
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

/* 输入框选中样式 */
.api-input,
.css-input {
  user-select: text;
  -webkit-user-select: text;
}

.api-input::selection,
.css-input::selection {
  background-color: rgba(255, 20, 147, 0.3);
}
</style>
