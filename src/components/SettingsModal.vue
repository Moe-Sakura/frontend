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
        class="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/50 backdrop-blur-xl bg-white/70 dark:bg-slate-900/80"
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

          <!-- 技术栈卡片 -->
          <Motion
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: 0.25 }"
            class="settings-card"
          >
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Layers :size="20" class="text-white" />
              </div>
              <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-white">技术栈</h2>
                <p class="text-sm text-gray-500 dark:text-slate-400">本项目所使用的技术</p>
                    </div>
                  </div>

            <!-- 技术栈分类 -->
            <div class="space-y-4">
              <div v-for="category in techStack" :key="category.title">
                <h3 class="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">{{ category.title }}</h3>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="tech in category.items" 
                    :key="tech.name"
                    :class="['tech-badge', tech.class]"
                  >
                    <span class="tech-icon" v-html="tech.icon" />
                    {{ tech.name }}
                  </span>
                </div>
              </div>
            </div>

            <!-- 版本信息 -->
            <div class="mt-4 pt-4 border-t border-gray-200/50 dark:border-slate-700/50 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
              <span>SearchGal Frontend v1.0.0</span>
              <a
                href="https://github.com/Moe-Sakura"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1.5 text-[#ff1493] dark:text-[#ff69b4] hover:underline"
              >
                <Github :size="14" />
                <span>Moe-Sakura</span>
              </a>
          </div>
          </Motion>

          <!-- 重置区域 -->
          <Motion
            :initial="{ opacity: 0, y: 30 }"
            :animate="{ opacity: 1, y: 0 }"
            :transition="{ delay: 0.3 }"
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
  Github,
  Layers,
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

// 技术栈数据（含 SVG 图标）
const techStack = [
  {
    title: '核心框架',
    items: [
      { name: 'Vue 3.5', class: 'tech-vue', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M2 3h3.5L12 15l6.5-12H22L12 21 2 3Zm4.5 0L12 12.5 17.5 3H15l-3 5.5L9 3H6.5Z"/></svg>' },
      { name: 'TypeScript', class: 'tech-ts', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3Zm10.71 13.44v1.85c.31.16.68.28 1.1.37.42.09.85.13 1.3.13.44 0 .84-.05 1.21-.15.37-.1.69-.26.95-.47.26-.21.47-.48.61-.8.15-.32.22-.7.22-1.14 0-.32-.05-.6-.14-.84-.09-.24-.23-.46-.42-.65-.18-.19-.41-.36-.68-.51-.27-.15-.58-.3-.93-.43-.26-.1-.48-.2-.66-.29-.18-.09-.33-.19-.44-.29-.12-.1-.2-.21-.26-.33-.05-.12-.08-.25-.08-.4 0-.14.03-.26.08-.37.05-.11.13-.2.24-.28.1-.08.24-.14.4-.18.16-.04.35-.06.56-.06.15 0 .31.01.48.04.17.03.34.07.51.12.17.06.34.13.5.21.16.09.3.18.43.29v-1.73c-.27-.11-.57-.19-.89-.24-.32-.05-.69-.08-1.1-.08-.43 0-.82.05-1.18.16-.36.11-.67.27-.93.48-.26.21-.46.47-.6.78-.14.31-.21.67-.21 1.07 0 .53.14.98.42 1.34.28.36.73.67 1.36.93.26.1.49.2.69.3.2.1.37.2.5.31.14.1.24.22.31.34.07.12.1.26.1.41 0 .13-.02.25-.07.36-.05.11-.12.21-.22.28-.1.08-.23.14-.38.18-.15.04-.34.06-.55.06-.37 0-.74-.07-1.1-.21-.36-.14-.7-.35-1-.63Zm-3.88-4.36H12v-1.52H6v1.52h2.15v7.48h1.68v-7.48Z"/></svg>' },
      { name: 'Vite 7', class: 'tech-vite', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m21.9 6.42-9.29 16.08a.54.54 0 0 1-.94 0L2.1 6.42a.53.53 0 0 1 .59-.78l9.23 1.86a.54.54 0 0 0 .21 0l9.18-1.86a.53.53 0 0 1 .59.78ZM15.2 1l-6.56 1.23a.27.27 0 0 0-.22.24l-.4 6.72a.27.27 0 0 0 .32.28l1.95-.45a.27.27 0 0 1 .32.32l-.58 2.84a.27.27 0 0 0 .34.31l1.2-.36a.27.27 0 0 1 .34.32l-.92 4.53a.17.17 0 0 0 .31.15l.22-.33 4.4-8.74a.27.27 0 0 0-.28-.39l-2.01.35a.27.27 0 0 1-.3-.33l1.15-5.12A.27.27 0 0 0 15.2 1Z"/></svg>' },
      { name: 'Pinia 3', class: 'tech-pinia', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.63 2.04c-.48-.28-1.08-.28-1.56 0L3.84 6.35c-.48.28-.78.8-.78 1.35v8.6c0 .56.3 1.08.78 1.35l7.23 4.31c.48.28 1.08.28 1.56 0l7.23-4.31c.48-.28.78-.8.78-1.35v-8.6c0-.56-.3-1.08-.78-1.35l-7.23-4.31ZM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10Z"/></svg>' },
      { name: 'Vue Router', class: 'tech-router', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 2 19h20L12 2Zm0 4 7.53 12H4.47L12 6Z"/></svg>' },
    ],
  },
  {
    title: '样式与动画',
    items: [
      { name: 'Tailwind', class: 'tech-tailwind', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 6c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.31.74 1.91 1.35.98 1 2.11 2.15 4.59 2.15 2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35C15.61 7.15 14.48 6 12 6ZM7 12c-2.67 0-4.33 1.33-5 4 1-1.33 2.17-1.83 3.5-1.5.76.19 1.3.74 1.91 1.35C8.39 16.85 9.52 18 12 18c2.67 0 4.33-1.33 5-4-1 1.33-2.17 1.83-3.5 1.5-.76-.19-1.3-.74-1.91-1.35C10.61 13.15 9.48 12 7 12Z"/></svg>' },
      { name: 'Motion V', class: 'tech-motion', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9Z"/></svg>' },
      { name: 'Lucide', class: 'tech-lucide', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>' },
    ],
  },
  {
    title: '功能库',
    items: [
      { name: 'Artalk', class: 'tech-artalk', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2Zm0 14H5.17L4 17.17V4h16v12Z"/></svg>' },
      { name: 'FancyApps', class: 'tech-fancybox', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 5v14H5V5h14Zm0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2Zm-4.86 8.86-3 3.87L9 13.14 6 17h12l-3.86-5.14Z"/></svg>' },
      { name: 'Lozad', class: 'tech-lozad', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8Zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3Z"/></svg>' },
      { name: 'NProgress', class: 'tech-nprogress', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2.05v2.02c3.95.49 7 3.85 7 7.93 0 3.21-1.92 6-4.72 7.28l.96 1.86A9.994 9.994 0 0 0 22 12c0-5.18-3.95-9.45-9-9.95Zm-2 0c-5.05.5-9 4.77-9 9.95 0 5.52 4.47 10 9.99 10 3.31 0 6.24-1.61 8.06-4.09l-1.66-1.11A8.01 8.01 0 0 1 11.99 20C7.58 20 4 16.42 4 12c0-3.86 2.79-7.08 6.46-7.78l-.01-.02L11 4.05v-2Z"/></svg>' },
      { name: 'Quicklink', class: 'tech-quicklink', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1ZM8 13h8v-2H8v2Zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5Z"/></svg>' },
    ],
  },
  {
    title: '代码质量',
    items: [
      { name: 'ESLint 9', class: 'tech-eslint', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 2.53 12 5.58l4.59-3.05 1.52 2.42-4.56 3.05V13h-3V8l-4.56-3.05 1.42-2.42ZM21 16.61 12 22l-9-5.39V11h3v4.22l6 3.6 6-3.6V11h3v5.61Z"/></svg>' },
      { name: 'Vue TSC', class: 'tech-ts', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v18H3V3Zm10.71 13.44v1.85c.31.16.68.28 1.1.37.42.09.85.13 1.3.13.44 0 .84-.05 1.21-.15.37-.1.69-.26.95-.47.26-.21.47-.48.61-.8.15-.32.22-.7.22-1.14 0-.32-.05-.6-.14-.84-.09-.24-.23-.46-.42-.65-.18-.19-.41-.36-.68-.51-.27-.15-.58-.3-.93-.43-.26-.1-.48-.2-.66-.29-.18-.09-.33-.19-.44-.29-.12-.1-.2-.21-.26-.33-.05-.12-.08-.25-.08-.4 0-.14.03-.26.08-.37.05-.11.13-.2.24-.28.1-.08.24-.14.4-.18.16-.04.35-.06.56-.06.15 0 .31.01.48.04.17.03.34.07.51.12.17.06.34.13.5.21.16.09.3.18.43.29v-1.73c-.27-.11-.57-.19-.89-.24-.32-.05-.69-.08-1.1-.08-.43 0-.82.05-1.18.16-.36.11-.67.27-.93.48-.26.21-.46.47-.6.78-.14.31-.21.67-.21 1.07 0 .53.14.98.42 1.34.28.36.73.67 1.36.93.26.1.49.2.69.3.2.1.37.2.5.31.14.1.24.22.31.34.07.12.1.26.1.41 0 .13-.02.25-.07.36-.05.11-.12.21-.22.28-.1.08-.23.14-.38.18-.15.04-.34.06-.55.06-.37 0-.74-.07-1.1-.21-.36-.14-.7-.35-1-.63Zm-3.88-4.36H12v-1.52H6v1.52h2.15v7.48h1.68v-7.48Z"/></svg>' },
    ],
  },
  {
    title: '自研特性',
    items: [
      { name: 'Web Audio', class: 'tech-custom', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02ZM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77Z"/></svg>' },
      { name: 'Ripple', class: 'tech-custom', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8Zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6Zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4Zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2Z"/></svg>' },
      { name: 'PWA', class: 'tech-custom', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93Zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39Z"/></svg>' },
      { name: 'IndexedDB', class: 'tech-custom', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 13H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-6c0-.55-.45-1-1-1ZM7 19c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2ZM20 3H4c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V4c0-.55-.45-1-1-1ZM7 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2Z"/></svg>' },
      { name: 'SSE', class: 'tech-custom', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96ZM19 18H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h.71C7.37 7.69 9.48 6 12 6a5.5 5.5 0 0 1 5.5 5.5v.5H19c1.66 0 3 1.34 3 3s-1.34 3-3 3Z"/></svg>' },
    ],
  },
]

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

/* 技术栈徽章基础样式 */
.tech-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  transition: all 0.2s ease;
  cursor: default;
}

.tech-badge:hover {
  transform: translateY(-1px);
}

/* 技术栈图标 */
.tech-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.tech-icon svg {
  width: 100%;
  height: 100%;
}

/* Vue 绿色 */
.tech-vue {
  background: linear-gradient(135deg, rgba(66, 184, 131, 0.15), rgba(52, 211, 153, 0.15));
  color: #059669;
  border: 1px solid rgba(52, 211, 153, 0.3);
}
.dark .tech-vue {
  background: linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(16, 185, 129, 0.2));
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.4);
}

/* TypeScript 蓝色 */
.tech-ts {
  background: linear-gradient(135deg, rgba(49, 120, 198, 0.15), rgba(59, 130, 246, 0.15));
  color: #2563eb;
  border: 1px solid rgba(59, 130, 246, 0.3);
}
.dark .tech-ts {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(96, 165, 250, 0.2));
  color: #60a5fa;
  border-color: rgba(59, 130, 246, 0.4);
}

/* Vite 紫色 */
.tech-vite {
  background: linear-gradient(135deg, rgba(189, 52, 254, 0.15), rgba(255, 198, 41, 0.1));
  color: #9333ea;
  border: 1px solid rgba(168, 85, 247, 0.3);
}
.dark .tech-vite {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(251, 191, 36, 0.15));
  color: #c084fc;
  border-color: rgba(168, 85, 247, 0.4);
}

/* Pinia 黄色 */
.tech-pinia {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15));
  color: #d97706;
  border: 1px solid rgba(251, 191, 36, 0.3);
}
.dark .tech-pinia {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.2));
  color: #fbbf24;
  border-color: rgba(251, 191, 36, 0.4);
}

/* Router 绿色 */
.tech-router {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.15));
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
.dark .tech-router {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(74, 222, 128, 0.2));
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.4);
}

/* Tailwind 青色 */
.tech-tailwind {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(34, 211, 238, 0.15));
  color: #0891b2;
  border: 1px solid rgba(34, 211, 238, 0.3);
}
.dark .tech-tailwind {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(103, 232, 249, 0.2));
  color: #22d3ee;
  border-color: rgba(34, 211, 238, 0.4);
}

/* Motion 粉色 */
.tech-motion {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.15));
  color: #db2777;
  border: 1px solid rgba(236, 72, 153, 0.3);
}
.dark .tech-motion {
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(244, 114, 182, 0.2));
  color: #f472b6;
  border-color: rgba(236, 72, 153, 0.4);
}

/* Lucide 灰色 */
.tech-lucide {
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.15), rgba(71, 85, 105, 0.15));
  color: #475569;
  border: 1px solid rgba(100, 116, 139, 0.3);
}
.dark .tech-lucide {
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.2), rgba(148, 163, 184, 0.2));
  color: #94a3b8;
  border-color: rgba(100, 116, 139, 0.4);
}

/* Artalk 蓝紫色 */
.tech-artalk {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(129, 140, 248, 0.15));
  color: #4f46e5;
  border: 1px solid rgba(99, 102, 241, 0.3);
}
.dark .tech-artalk {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(129, 140, 248, 0.2));
  color: #818cf8;
  border-color: rgba(99, 102, 241, 0.4);
}

/* FancyApps 橙色 */
.tech-fancybox {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(251, 146, 60, 0.15));
  color: #ea580c;
  border: 1px solid rgba(249, 115, 22, 0.3);
}
.dark .tech-fancybox {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(251, 146, 60, 0.2));
  color: #fb923c;
  border-color: rgba(249, 115, 22, 0.4);
}

/* Lozad 青绿色 */
.tech-lozad {
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.15), rgba(45, 212, 191, 0.15));
  color: #0d9488;
  border: 1px solid rgba(20, 184, 166, 0.3);
}
.dark .tech-lozad {
  background: linear-gradient(135deg, rgba(20, 184, 166, 0.2), rgba(45, 212, 191, 0.2));
  color: #2dd4bf;
  border-color: rgba(20, 184, 166, 0.4);
}

/* NProgress 粉红 */
.tech-nprogress {
  background: linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(251, 113, 133, 0.15));
  color: #e11d48;
  border: 1px solid rgba(244, 63, 94, 0.3);
}
.dark .tech-nprogress {
  background: linear-gradient(135deg, rgba(244, 63, 94, 0.2), rgba(251, 113, 133, 0.2));
  color: #fb7185;
  border-color: rgba(244, 63, 94, 0.4);
}

/* Quicklink 蓝色 */
.tech-quicklink {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(56, 189, 248, 0.15));
  color: #0284c7;
  border: 1px solid rgba(14, 165, 233, 0.3);
}
.dark .tech-quicklink {
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(56, 189, 248, 0.2));
  color: #38bdf8;
  border-color: rgba(14, 165, 233, 0.4);
}

/* ESLint 紫色 */
.tech-eslint {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(167, 139, 250, 0.15));
  color: #7c3aed;
  border: 1px solid rgba(139, 92, 246, 0.3);
}
.dark .tech-eslint {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(167, 139, 250, 0.2));
  color: #a78bfa;
  border-color: rgba(139, 92, 246, 0.4);
}

/* 自研特性 渐变粉色 */
.tech-custom {
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.12), rgba(217, 70, 239, 0.12));
  color: #c026d3;
  border: 1px solid rgba(217, 70, 239, 0.25);
}
.dark .tech-custom {
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.18), rgba(217, 70, 239, 0.18));
  color: #e879f9;
  border-color: rgba(217, 70, 239, 0.35);
}
</style>
