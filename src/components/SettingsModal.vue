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

            <!-- 自定义代码卡片 - IDE 风格 -->
            <div class="settings-card !p-0 overflow-hidden">
              <!-- IDE 风格顶部栏 -->
              <div class="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#3c3c3c]">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Code :size="16" class="text-white" />
                  </div>
                  <div>
                    <h2 class="text-sm font-semibold text-white">自定义代码</h2>
                    <p class="text-xs text-gray-400">CSS · JavaScript · HTML</p>
                  </div>
                </div>
                <!-- 窗口控制按钮装饰 -->
                <div class="flex items-center gap-1.5">
                  <div class="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div class="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div class="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
              </div>

              <!-- IDE 风格 Tab 栏 -->
              <div class="flex bg-[#2d2d2d] border-b border-[#3c3c3c]">
                <button
                  :class="[
                    'group relative flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all border-r border-[#3c3c3c]',
                    activeCodeTab === 'css'
                      ? 'bg-[#1e1e1e] text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#383838]'
                  ]"
                  @click="switchCodeTab('css')"
                >
                  <Paintbrush :size="14" :class="activeCodeTab === 'css' ? 'text-[#ff1493]' : 'text-gray-500 group-hover:text-[#ff1493]'" />
                  <span>style.css</span>
                  <div v-if="activeCodeTab === 'css'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ff1493]" />
                </button>
                <button
                  :class="[
                    'group relative flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all border-r border-[#3c3c3c]',
                    activeCodeTab === 'js'
                      ? 'bg-[#1e1e1e] text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#383838]'
                  ]"
                  @click="switchCodeTab('js')"
                >
                  <Terminal :size="14" :class="activeCodeTab === 'js' ? 'text-amber-400' : 'text-gray-500 group-hover:text-amber-400'" />
                  <span>script.js</span>
                  <div v-if="activeCodeTab === 'js'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
                </button>
                <button
                  :class="[
                    'group relative flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all',
                    activeCodeTab === 'html'
                      ? 'bg-[#1e1e1e] text-white'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-[#383838]'
                  ]"
                  @click="switchCodeTab('html')"
                >
                  <FileCode :size="14" :class="activeCodeTab === 'html' ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-400'" />
                  <span>custom.html</span>
                  <div v-if="activeCodeTab === 'html'" class="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                </button>
              </div>

              <!-- 编辑器区域 -->
              <div class="relative">
                <!-- CSS 编辑器 -->
                <div v-show="activeCodeTab === 'css'">
                  <PrismEditor
                    v-model="localCustomCSS"
                    :highlight="highlightCSS"
                    :line-numbers="true"
                    class="code-editor"
                    @input="handleTyping"
                  />
                </div>

                <!-- JS 编辑器 -->
                <div v-show="activeCodeTab === 'js'">
                  <PrismEditor
                    v-model="localCustomJS"
                    :highlight="highlightJS"
                    :line-numbers="true"
                    class="code-editor"
                    @input="handleTyping"
                  />
                </div>

                <!-- HTML 编辑器 -->
                <div v-show="activeCodeTab === 'html'">
                  <PrismEditor
                    v-model="localCustomHTML"
                    :highlight="highlightHTML"
                    :line-numbers="true"
                    class="code-editor"
                    @input="handleTyping"
                  />
                </div>
              </div>

              <!-- 底部状态栏 -->
              <div class="flex items-center justify-between px-4 py-1.5 bg-[#007acc] text-white text-xs">
                <div class="flex items-center gap-4">
                  <span class="flex items-center gap-1">
                    <Info :size="12" />
                    <span v-if="activeCodeTab === 'css'">CSS 样式会覆盖现有样式</span>
                    <span v-else-if="activeCodeTab === 'js'">脚本在页面加载时执行</span>
                    <span v-else>HTML 添加到 body 末尾</span>
                  </span>
                </div>
                <div class="flex items-center gap-3 text-white/80">
                  <span>UTF-8</span>
                  <span v-if="activeCodeTab === 'css'">CSS</span>
                  <span v-else-if="activeCodeTab === 'js'">JavaScript</span>
                  <span v-else>HTML</span>
                </div>
              </div>
            </div>

            <!-- 高级 API 设置卡片 -->
            <div class="settings-card">
              <div class="flex items-center gap-3 mb-4">
                <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Terminal :size="20" class="text-white" />
                </div>
                <div>
                  <h2 class="text-lg font-bold text-gray-800 dark:text-white">高级 API 设置</h2>
                  <p class="text-sm text-gray-500 dark:text-slate-400">自定义 VNDB 和 AI 翻译 API</p>
                </div>
              </div>

              <div class="space-y-4">
                <!-- VNDB API Base URL -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    VNDB API 地址
                  </label>
                  <input
                    v-model="localVndbApiBaseUrl"
                    type="url"
                    placeholder="https://api.vndb.org/kana"
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    @input="handleTyping"
                  />
                </div>

                <!-- VNDB Image Proxy URL -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    VNDB 图片代理地址
                  </label>
                  <input
                    v-model="localVndbImageProxyUrl"
                    type="url"
                    placeholder="https://rp.searchgal.homes/"
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    @input="handleTyping"
                  />
                </div>

                <!-- AI Translate API URL -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    AI 翻译 API 地址
                  </label>
                  <input
                    v-model="localAiTranslateApiUrl"
                    type="url"
                    placeholder="https://ai.searchgal.homes/v1/chat/completions"
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    @input="handleTyping"
                  />
                </div>

                <!-- AI Translate API Key -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    AI 翻译 API Key
                  </label>
                  <input
                    v-model="localAiTranslateApiKey"
                    type="password"
                    placeholder="sk-..."
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400 font-mono"
                    @input="handleTyping"
                  />
                </div>

                <!-- AI Translate Model -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    AI 翻译模型
                  </label>
                  <input
                    v-model="localAiTranslateModel"
                    type="text"
                    placeholder="Qwen/Qwen2.5-32B-Instruct"
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    @input="handleTyping"
                  />
                </div>

                <!-- Background Image API URL -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                    背景图片 API 地址
                  </label>
                  <input
                    v-model="localBackgroundImageApiUrl"
                    type="url"
                    placeholder="https://api.illlights.com/v1/img"
                    class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
                    @input="handleTyping"
                  />
                </div>

                <!-- 恢复默认按钮 -->
                <button
                  class="w-full px-4 py-2.5 rounded-xl text-cyan-600 dark:text-cyan-400 font-medium bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 hover:bg-cyan-100 dark:hover:bg-cyan-950/60 active:scale-[0.98] transition-all text-sm"
                  @click="resetAdvancedApiSettings"
                >
                  恢复默认值
                </button>
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
import 'prismjs/components/prism-clike'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-markup'
import 'prismjs/themes/prism-tomorrow.css'

// CSS 语法高亮函数
function highlightCSS(code: string): string {
  return highlight(code, languages.css, 'css')
}

// JS 语法高亮函数
function highlightJS(code: string): string {
  return highlight(code, languages.javascript, 'javascript')
}

// HTML 语法高亮函数
function highlightHTML(code: string): string {
  return highlight(code, languages.markup, 'markup')
}

// 代码编辑器 Tab 类型
type CodeEditorTab = 'css' | 'js' | 'html'
const activeCodeTab = ref<CodeEditorTab>('css')

function switchCodeTab(tab: CodeEditorTab) {
  playTap()
  activeCodeTab.value = tab
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
  Terminal,
  Code,
  FileCode,
  Check,
  Github,
  X,
  Palette,
  Sun,
  Moon,
  Monitor,
} from 'lucide-vue-next'
import { useUIStore, type ThemeMode } from '@/stores/ui'
import { useSettingsStore, DEFAULT_API_CONFIG } from '@/stores/settings'

const uiStore = useUIStore()
const settingsStore = useSettingsStore()

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
const localCustomJS = ref(settingsStore.settings.customJS)
const localCustomHTML = ref(settingsStore.settings.customHTML)

// 高级 API 设置状态
const localVndbApiBaseUrl = ref(settingsStore.settings.vndbApiBaseUrl)
const localVndbImageProxyUrl = ref(settingsStore.settings.vndbImageProxyUrl)
const localAiTranslateApiUrl = ref(settingsStore.settings.aiTranslateApiUrl)
const localAiTranslateApiKey = ref(settingsStore.settings.aiTranslateApiKey)
const localAiTranslateModel = ref(settingsStore.settings.aiTranslateModel)
const localBackgroundImageApiUrl = ref(settingsStore.settings.backgroundImageApiUrl)

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
    localCustomJS.value = settingsStore.settings.customJS
    localCustomHTML.value = settingsStore.settings.customHTML
    // 同步高级 API 设置
    localVndbApiBaseUrl.value = settingsStore.settings.vndbApiBaseUrl
    localVndbImageProxyUrl.value = settingsStore.settings.vndbImageProxyUrl
    localAiTranslateApiUrl.value = settingsStore.settings.aiTranslateApiUrl
    localAiTranslateApiKey.value = settingsStore.settings.aiTranslateApiKey
    localAiTranslateModel.value = settingsStore.settings.aiTranslateModel
    localBackgroundImageApiUrl.value = settingsStore.settings.backgroundImageApiUrl
  }
})

function close() {
  playTap()
  emit('close')
}

function save() {
  playCelebration()
  // 保存高级 API 设置和自定义脚本/HTML
  settingsStore.updateSettings({
    customJS: localCustomJS.value,
    customHTML: localCustomHTML.value,
    vndbApiBaseUrl: localVndbApiBaseUrl.value,
    vndbImageProxyUrl: localVndbImageProxyUrl.value,
    aiTranslateApiUrl: localAiTranslateApiUrl.value,
    aiTranslateApiKey: localAiTranslateApiKey.value,
    aiTranslateModel: localAiTranslateModel.value,
    backgroundImageApiUrl: localBackgroundImageApiUrl.value,
  })
  emit('save', localCustomApi.value, localCustomCSS.value)
  emit('close')
}

function reset() {
  playTap()
  selectedApiOption.value = 'cfapi'
  customApiInput.value = ''
  localCustomCSS.value = ''
  localCustomJS.value = ''
  localCustomHTML.value = ''
  // 重置高级 API 设置（不播放音效，因为已经播放过）
  resetAdvancedApiSettings(false)
}

function resetAdvancedApiSettings(playSound = true) {
  if (playSound) {
    playTap()
  }
  localVndbApiBaseUrl.value = DEFAULT_API_CONFIG.vndbApiBaseUrl
  localVndbImageProxyUrl.value = DEFAULT_API_CONFIG.vndbImageProxyUrl
  localAiTranslateApiUrl.value = DEFAULT_API_CONFIG.aiTranslateApiUrl
  localAiTranslateApiKey.value = DEFAULT_API_CONFIG.aiTranslateApiKey
  localAiTranslateModel.value = DEFAULT_API_CONFIG.aiTranslateModel
  localBackgroundImageApiUrl.value = DEFAULT_API_CONFIG.backgroundImageApiUrl
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

/* IDE 风格代码编辑器 */
.code-editor {
  font-family: "JetBrains Mono", "Fira Code", "Consolas", "Monaco", monospace !important;
  font-size: 13px !important;
  line-height: 1.5 !important;
  min-height: 240px !important;
  max-height: 360px !important;
  background: #1e1e1e !important;
  color: #d4d4d4 !important;
  caret-color: #aeafad !important;
  tab-size: 2 !important;
  /* 外层容器只处理垂直滚动 */
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

/* 禁止代码换行 */
.code-editor .prism-editor__textarea,
.code-editor .prism-editor__editor,
.code-editor pre,
.code-editor code {
  white-space: pre !important;
  word-wrap: normal !important;
  overflow-wrap: normal !important;
}

/* 让编辑器填满整个区域，点击空白处也能聚焦 */
.code-editor .prism-editor__container {
  min-height: 220px !important;
  /* 容器启用水平滚动 */
  overflow-x: auto !important;
  overflow-y: visible !important;
}

.code-editor .prism-editor__textarea,
.code-editor .prism-editor__editor {
  min-height: 220px !important;
  outline: none !important;
  /* 编辑区域内容不换行 */
  min-width: max-content !important;
}

.code-editor .prism-editor__textarea:focus {
  outline: none !important;
}

/* 行号样式 - VS Code 风格 */
.code-editor .prism-editor__line-numbers {
  padding: 0 1rem 0 0.5rem !important;
  background: #1e1e1e !important;
  color: #858585 !important;
  user-select: none !important;
  text-align: right !important;
  min-width: 2.5rem !important;
  border-right: none !important;
  margin-right: 0 !important;
}

/* 当前行高亮 */
.code-editor .prism-editor__line-number {
  transition: color 0.1s;
}

/* VS Code Dark+ 主题色 */
.code-editor .token.selector {
  color: #d7ba7d !important;
}

.code-editor .token.property {
  color: #9cdcfe !important;
}

.code-editor .token.punctuation {
  color: #d4d4d4 !important;
}

.code-editor .token.string {
  color: #ce9178 !important;
}

.code-editor .token.number,
.code-editor .token.unit {
  color: #b5cea8 !important;
}

.code-editor .token.function {
  color: #dcdcaa !important;
}

.code-editor .token.comment {
  color: #6a9955 !important;
  font-style: italic;
}

.code-editor .token.atrule,
.code-editor .token.keyword {
  color: #c586c0 !important;
}

.code-editor .token.important {
  color: #569cd6 !important;
}

.code-editor .token.tag {
  color: #569cd6 !important;
}

.code-editor .token.attr-name {
  color: #9cdcfe !important;
}

.code-editor .token.attr-value {
  color: #ce9178 !important;
}

/* 选中文本样式 - VS Code 风格 */
.code-editor .prism-editor__textarea::selection,
.code-editor .prism-editor__editor *::selection {
  background-color: #264f78 !important;
}

/* VS Code 风格滚动条 */
.code-editor::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.code-editor::-webkit-scrollbar-track {
  background: #1e1e1e;
}

.code-editor::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 0;
}

.code-editor::-webkit-scrollbar-thumb:hover {
  background: #4f4f4f;
}

.code-editor::-webkit-scrollbar-corner {
  background: #1e1e1e;
}
</style>
