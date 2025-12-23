<template>
  <Teleport to="body">
    <!-- 设置面板 - macOS 风格浮动窗口 -->
    <Transition
      :css="false"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="isOpen"
        ref="modalRef"
        :class="[
          'fixed z-[100] flex flex-col settings-page shadow-2xl shadow-black/20',
          isFullscreen 
            ? 'inset-0' 
            : 'inset-0 md:inset-6 md:m-auto md:w-[600px] md:min-w-[400px] md:max-w-[800px] md:h-[500px] md:max-h-[calc(100%-3rem)] md:rounded-3xl'
        ]"
        :style="windowStyle"
      >
        <!-- 调整大小手柄 -->
        <WindowResizeHandles 
          :is-fullscreen="isFullscreen" 
          @resize="handleResize" 
        />
      
        <!-- 顶部导航栏 - 可拖动 -->
        <div
          v-anime:100="'slideUp'"
          :class="[
            'flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/50 glassmorphism-navbar select-none',
            isFullscreen ? '' : 'md:rounded-t-3xl md:cursor-move'
          ]"
          @mousedown="handleDragStart"
          @touchstart="handleDragStart"
        >
          <!-- 返回按钮 - 仅移动端 -->
          <button
            v-tap
            class="flex items-center gap-1 text-[#ff1493] dark:text-[#ff69b4] font-medium transition-colors md:hidden"
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
              v-tap
              class="px-4 py-1.5 rounded-full text-white text-sm font-semibold bg-gradient-to-r from-[#ff1493] to-[#d946ef] shadow-lg shadow-pink-500/25"
              @click="save"
            >
              保存
            </button>
          
            <!-- 全屏按钮 - 仅桌面端 -->
            <button
              class="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              title="全屏"
              @click="handleToggleFullscreen"
            >
              <Maximize2 v-if="!isFullscreen" :size="16" />
              <Minimize2 v-else :size="16" />
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
            <!-- API 设置卡片 -->
            <div
              v-anime:150="'cardIn'"
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
              <div v-anime-stagger:50="'slideRight'" class="space-y-2">
                <button
                  v-for="option in apiOptions"
                  :key="option.value"
                  v-tap
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
                  <!-- 移动端：URL 显示在第二行；桌面端：显示在右侧 -->
                  <span 
                    v-if="option.value !== 'custom'" 
                    class="text-xs text-gray-400 dark:text-slate-500 font-mono mt-1.5 sm:mt-0 ml-8 sm:ml-0 truncate"
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
              v-anime:200="'cardIn'"
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
              v-anime:250="'cardIn'"
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
                  v-tap
                  class="px-4 py-2 rounded-xl text-red-600 dark:text-red-400 font-medium bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
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
import { animate } from '@/composables/useAnime'
import { playTap, playCelebration, playToggle, playType, playSwipe } from '@/composables/useSound'

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
import { useWindowManager, type ResizeDirection } from '@/composables/useWindowManager'
import WindowResizeHandles from '@/components/WindowResizeHandles.vue'
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
  Maximize2,
  Minimize2,
  X,
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

// 窗口管理
const modalRef = ref<HTMLElement | null>(null)
const { isFullscreen, windowStyle, startDrag, startResize, toggleFullscreen, reset: resetWindow } = useWindowManager({
  minWidth: 400,
  minHeight: 300,
})

// 进入/离开动画
function onEnter(el: Element, done: () => void) {
  animate(el as HTMLElement, {
    opacity: [0, 1],
    scale: [0.98, 1],
    translateY: [40, 0],
    duration: 400,
    ease: 'outCubic',
    complete: done,
  })
}

function onLeave(el: Element, done: () => void) {
  animate(el as HTMLElement, {
    opacity: [1, 0],
    scale: [1, 0.98],
    translateY: [0, 40],
    duration: 300,
    ease: 'inCubic',
    complete: done,
  })
}

function handleDragStart(e: MouseEvent | TouchEvent) {
  if ((e.target as HTMLElement).closest('button')) {return}
  if (modalRef.value) {
    startDrag(e, modalRef.value)
  }
}

function handleResize(e: MouseEvent | TouchEvent, direction: ResizeDirection) {
  if (modalRef.value) {
    startResize(e, direction, modalRef.value)
  }
}

// 切换全屏（带音效）
function handleToggleFullscreen() {
  playSwipe()
  toggleFullscreen()
}

// 关闭时重置窗口状态
watch(() => props.isOpen, (newVal) => {
  if (!newVal) {
    resetWindow()
  }
})

// API 服务器选项
const apiOptions = [
  { value: 'cfapi', label: 'Cloudflare Workers' },
  { value: 'api', label: '中国 香港' },
  { value: 'usapi', label: '美国 洛杉矶' },
  { value: 'custom', label: '自定义' },
]

// API URL 映射
const apiUrls: Record<string, string> = {
  cfapi: 'https://cf.api.searchgal.homes',
  api: 'https://api.searchgal.homes',
  usapi: 'https://us.api.searchgal.homes',
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
/* 设置面板 - WWDC 2025 液态玻璃效果 */
.settings-page {
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  will-change: transform;
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 0 20px rgba(255, 20, 147, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
  /* 窗口/全屏切换动画 */
  transition: 
    inset 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    min-width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    margin 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 移动端无底部边框 */
@media (max-width: 767px) {
  .settings-page {
    border-bottom: none;
  }
}

/* 液态玻璃高光 */
.settings-page::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 30%,
    transparent 50%
  );
  pointer-events: none;
  z-index: 100;
}

/* 设置面板 - 暗色模式 */
.dark .settings-page {
  background: rgba(30, 30, 40, 0.5);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 -8px 24px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(255, 105, 180, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.1) !important;
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
