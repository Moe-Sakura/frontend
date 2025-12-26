<template>
  <Teleport to="body">
    <!-- 设置面板 - 模态框 -->
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0 scale-[0.98] translate-y-10"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-[0.98] translate-y-10"
    >
      <div
        v-if="isOpen"
        class="fixed z-[100] flex flex-col settings-page shadow-2xl shadow-black/20 inset-0 md:inset-6 md:m-auto md:w-[800px] md:max-w-[calc(100%-3rem)] md:h-[700px] md:max-h-[calc(100%-3rem)] md:rounded-3xl"
      >
        <!-- 顶部导航栏 -->
        <div
          class="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/50 glassmorphism-navbar select-none md:rounded-t-3xl"
        >
          <!-- 返回按钮 - 仅移动端 -->
          <button
            class="flex items-center gap-1 text-[#ff1493] dark:text-[#ff69b4] font-medium transition-colors active:scale-95 md:hidden"
            @click="close"
          >
            <ChevronLeft :size="24" />
            <span class="text-base">返回</span>
          </button>

          <!-- 标题 -->
          <div class="flex items-center gap-2 md:ml-0">
            <SettingsIcon :size="20" class="text-[#ff1493] dark:text-[#ff69b4]" />
            <h1 class="text-lg font-bold text-gray-800 dark:text-white">设置</h1>
          </div>

          <!-- 右侧按钮组 -->
          <div class="flex items-center gap-2">
            <!-- 保存按钮 -->
            <button
              class="px-4 py-1.5 rounded-full text-white text-sm font-semibold bg-[#ff1493] hover:bg-[#e0117f] active:scale-95 transition-all shadow-lg shadow-pink-500/25"
              @click="save"
            >
              保存
            </button>
          
            <!-- 关闭按钮 - 仅桌面端 -->
            <button
              class="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="关闭"
              @click="close"
            >
              <X :size="16" />
            </button>
          </div>
        </div>

        <!-- 内容区域 -->
        <div class="flex-1 overflow-y-auto custom-scrollbar">
          <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            <!-- 主题设置卡片 -->
            <div
              class="settings-card"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Palette :size="20" class="text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-800 dark:text-white">外观主题</h2>
                  <p class="text-sm text-gray-500 dark:text-slate-400">选择亮色、暗色或跟随系统</p>
                </div>
              </div>

              <!-- 主题选项 -->
              <div class="grid grid-cols-3 gap-3">
                <button
                  v-for="option in themeOptions"
                  :key="option.value"
                  type="button"
                  :class="[
                    'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-200',
                    uiStore.themeMode === option.value
                      ? 'bg-[#ff1493]/10 border-2 border-[#ff1493] dark:border-[#ff69b4]'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-2 border-transparent hover:border-pink-200 dark:hover:border-pink-900'
                  ]"
                  @click="handleThemeChange(option.value)"
                >
                  <!-- 图标 -->
                  <div
                    :class="[
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                      uiStore.themeMode === option.value
                        ? 'bg-[#ff1493] text-white'
                        : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
                    ]"
                  >
                    <component :is="option.icon" :size="20" />
                  </div>
                  <!-- 标签 -->
                  <span
                    :class="[
                      'text-sm font-medium',
                      uiStore.themeMode === option.value
                        ? 'text-[#ff1493] dark:text-[#ff69b4]'
                        : 'text-gray-700 dark:text-slate-300'
                    ]"
                  >
                    {{ option.label }}
                  </span>
                </button>
              </div>
            </div>

            <!-- API 设置卡片 -->
            <div
              class="settings-card"
            >
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Server :size="20" class="text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-800 dark:text-white">聚搜 API 后端</h2>
                  <p class="text-sm text-gray-500 dark:text-slate-400">选择或自定义 URL 地址</p>
                </div>
              </div>

              <!-- API 选项列表 -->
              <div class="space-y-2">
                <button
                  v-for="option in apiOptions"
                  :key="option.value"
                  type="button"
                  :class="[
                    'w-full flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-xl transition-all duration-200 text-left',
                    selectedApiOption === option.value
                      ? 'bg-gradient-to-r from-[#ff1493]/10 to-[#d946ef]/10 border-2 border-[#ff1493] dark:border-[#ff69b4]'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-2 border-transparent hover:border-pink-200 dark:hover:border-pink-900'
                  ]"
                  @click="selectApiOption(option.value)"
                >
                  <div class="flex items-center gap-3">
                    <div
                      :class="[
                        'w-5 h-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-colors',
                        selectedApiOption === option.value
                          ? 'border-[#ff1493] bg-[#ff1493]'
                          : 'border-gray-300 dark:border-slate-600'
                      ]"
                    >
                      <Check v-if="selectedApiOption === option.value" :size="12" class="text-white" />
                    </div>
                    <span
                      :class="[
                        'font-medium text-sm sm:text-base',
                        selectedApiOption === option.value
                          ? 'text-[#ff1493] dark:text-[#ff69b4]'
                          : 'text-gray-700 dark:text-slate-300'
                      ]"
                    >
                      {{ option.label }}
                    </span>
                  </div>
                  <!-- 移动端：URL 显示在第二行；桌面端：显示在右侧靠右 -->
                  <span 
                    v-if="option.value !== 'custom'" 
                    v-text-scroll
                    class="text-xs text-gray-400 dark:text-slate-500 font-mono mt-1.5 sm:mt-0 ml-8 sm:ml-auto sm:text-right truncate max-w-[50%]"
                  >
                    {{ getApiUrl(option.value) }}
                  </span>
                </button>
              </div>

              <!-- 自定义 API 输入 -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-40"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 max-h-40"
                leave-to-class="opacity-0 max-h-0"
              >
                <div
                  v-if="selectedApiOption === 'custom'"
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
                        @input="handleTyping"
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
                </div>
              </Transition>
            </div>

            <!-- 自定义样式卡片 -->
            <div
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

              <!-- CSS 编辑器 - 带语法高亮 -->
              <div class="css-editor-wrapper rounded-2xl overflow-hidden border-2 border-transparent focus-within:border-[#ff1493] transition-all duration-200">
                <PrismEditor
                  v-model="localCustomCSS"
                  :highlight="highlightCSS"
                  :line-numbers="true"
                  class="css-editor"
                  @input="handleTyping"
                />
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
            </div>

            <!-- 重置区域 -->
            <div
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
                <button
                  class="px-4 py-2 rounded-xl text-red-600 dark:text-red-400 font-medium bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/50 active:scale-95 transition-all"
                  @click="reset"
                >
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { playTap, playCelebration, playToggle, playType } from '@/composables/useSound'

// Prism Editor
import { PrismEditor } from 'vue-prism-editor'
import 'vue-prism-editor/dist/prismeditor.min.css'

// Prism 语法高亮
import { highlight, languages } from 'prismjs/components/prism-core'
import 'prismjs/components/prism-css'
import 'prismjs/themes/prism-tomorrow.css'

// CSS 语法高亮函数
function highlightCSS(code: string): string {
  return highlight(code, languages.css, 'css')
}

// 打字音效节流
let lastTypingSound = 0
const TYPING_THROTTLE = 80

function handleTyping() {
  const now = Date.now()
  if (now - lastTypingSound >= TYPING_THROTTLE) {
    playType()
    lastTypingSound = now
  }
}
import {
  Settings as SettingsIcon,
  ChevronLeft,
  Paintbrush,
  Info,
  Server,
  Link as LinkIcon,
  RotateCcw,
  Check,
  Github,
  X,
  Palette,
  Sun,
  Moon,
  Monitor,
} from 'lucide-vue-next'
import { useUIStore, type ThemeMode } from '@/stores/ui'

const uiStore = useUIStore()

// 主题选项
const themeOptions = [
  { value: 'light' as ThemeMode, label: '亮色', icon: Sun },
  { value: 'system' as ThemeMode, label: '系统', icon: Monitor },
  { value: 'dark' as ThemeMode, label: '暗色', icon: Moon },
]

function handleThemeChange(mode: ThemeMode) {
  playToggle()
  uiStore.setThemeMode(mode)
}

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
  { value: 'cfapi', label: 'Cloudflare Workers' },
  { value: 'api', label: '中国香港 雨云' },
  { value: 'usapi', label: '美国洛杉矶 CloudCone' },
  { value: 'jpapi', label: '日本东京 ClawCloud' },
  { value: 'deapi', label: '德国法兰克福 ClawCloud' },
  { value: 'custom', label: '自定义' },
]

// API URL 映射
const apiUrls: Record<string, string> = {
  cfapi: 'https://cf.api.searchgal.homes',
  api: 'https://api.searchgal.homes',
  usapi: 'https://us.api.searchgal.homes',
  jpapi: 'https://jp.api.searchgal.homes',
  deapi: 'https://de.api.searchgal.homes',
}

// 根据 URL 判断选中的选项
function getOptionFromUrl(url: string): string {
  if (!url || url === apiUrls.cfapi) {
    return 'cfapi'
  }
  if (url === apiUrls.api) {
    return 'api'
  }
  if (url === apiUrls.usapi) {
    return 'usapi'
  }
  if (url === apiUrls.jpapi) {
    return 'jpapi'
  }
  if (url === apiUrls.deapi) {
    return 'deapi'
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
  }
})

function close() {
  playTap()
  emit('close')
}

function save() {
  playCelebration()
  emit('save', localCustomApi.value, localCustomCSS.value)
  emit('close')
}

function reset() {
  playTap()
  selectedApiOption.value = 'cfapi'
  customApiInput.value = ''
  localCustomCSS.value = ''
}
</script>

<style>
/* 设置面板 - 半透明效果 */
.settings-page {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-panel, 0.85));
  will-change: transform;
  border: var(--border-thin, 1px) solid rgba(var(--color-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-xl, 0 12px 32px rgba(0, 0, 0, 0.15));
}

/* 移动端无底部边框 */
@media (max-width: 767px) {
  .settings-page {
    border-bottom: none;
  }
}

/* 设置面板 - 暗色模式 */
.dark .settings-page {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-panel-dark, 0.88));
  border-color: rgba(var(--color-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 设置卡片 - 亮色模式 */
.settings-card {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-card-inner, 0.75));
  border-radius: var(--radius-xl, 1.25rem);
  padding: var(--spacing-lg, 1.25rem);
  border: var(--border-thin, 1px) solid rgba(var(--color-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-md, 0 4px 16px rgba(0, 0, 0, 0.08));
}

/* 设置卡片 - 暗色模式 */
.dark .settings-card {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-card-inner-dark, 0.75));
  border: var(--border-thin, 1px) solid rgba(var(--color-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
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

/* CSS 编辑器容器 */
.css-editor-wrapper {
  background: #1e1e1e;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Prism Editor 样式覆盖 */
.css-editor {
  font-family: "Consolas", "Monaco", "Fira Code", monospace !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
  padding: 1rem !important;
  min-height: 280px !important;
  max-height: 450px !important;
  overflow-y: auto !important;
  background: #1e1e1e !important;
  color: #d4d4d4 !important;
  caret-color: #ff1493 !important;
}

.css-editor .prism-editor__textarea {
  outline: none !important;
}

.css-editor .prism-editor__textarea:focus {
  outline: none !important;
}

/* 行号样式 */
.css-editor .prism-editor__line-numbers {
  padding-right: 0.75rem !important;
  border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
  margin-right: 0.75rem !important;
  color: rgba(255, 255, 255, 0.35) !important;
  user-select: none !important;
}

/* 代码高亮 - 主题色调整 */
.css-editor .token.selector {
  color: #d7ba7d !important;
}

.css-editor .token.property {
  color: #9cdcfe !important;
}

.css-editor .token.punctuation {
  color: #d4d4d4 !important;
}

.css-editor .token.string {
  color: #ce9178 !important;
}

.css-editor .token.number,
.css-editor .token.unit {
  color: #b5cea8 !important;
}

.css-editor .token.function {
  color: #dcdcaa !important;
}

.css-editor .token.comment {
  color: #6a9955 !important;
  font-style: italic;
}

.css-editor .token.atrule,
.css-editor .token.keyword {
  color: #c586c0 !important;
}

.css-editor .token.important {
  color: #ff1493 !important;
}

/* 选中文本样式 */
.css-editor .prism-editor__textarea::selection,
.css-editor .prism-editor__editor *::selection {
  background-color: rgba(255, 20, 147, 0.3) !important;
}

/* 自定义滚动条 */
.css-editor::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.css-editor::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.css-editor::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #ff1493, #d946ef);
  border-radius: 4px;
}

.css-editor::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #c71585, #c026d3);
}
</style>
