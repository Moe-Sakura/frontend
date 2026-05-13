<template>
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
      <div v-for="field in fields" :key="field.key">
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          {{ field.label }}
        </label>
        <input
          :value="modelValue[field.key]"
          :type="field.type"
          :placeholder="field.placeholder"
          class="api-input w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 shadow-inner focus:shadow-lg focus:shadow-cyan-500/10 transition-all duration-200 outline-none border-2 border-transparent focus:border-cyan-500 text-gray-800 dark:text-slate-100 placeholder:text-gray-400"
          :class="{ 'font-mono': field.mono }"
          @input="onInput(field.key, $event)"
        />
      </div>

      <button
        class="w-full px-4 py-2.5 rounded-xl text-cyan-600 dark:text-cyan-400 font-medium bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 hover:bg-cyan-100 dark:hover:bg-cyan-950/60 active:scale-[0.98] transition-all text-sm"
        @click="onReset"
      >
        恢复默认值
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Terminal } from 'lucide-vue-next'
import { DEFAULT_API_CONFIG } from '@/stores/settings'

export interface AdvancedApiConfig {
  vndbApiBaseUrl: string
  vndbImageProxyUrl: string
  aiTranslateApiUrl: string
  aiTranslateApiKey: string
  aiTranslateModel: string
  backgroundImageApiUrl: string
  videoParseApiUrl: string
}

const modelValue = defineModel<AdvancedApiConfig>({ required: true })

const emit = defineEmits<{
  typing: []
  reset: []
}>()

interface FieldDef {
  key: keyof AdvancedApiConfig
  label: string
  type: 'url' | 'text' | 'password'
  placeholder: string
  mono?: boolean
}

const fields: FieldDef[] = [
  { key: 'vndbApiBaseUrl', label: 'VNDB API 地址', type: 'url', placeholder: 'https://api.vndb.org/kana' },
  { key: 'vndbImageProxyUrl', label: 'VNDB 图片代理地址', type: 'url', placeholder: 'https://rp.searchgal.top/' },
  { key: 'aiTranslateApiUrl', label: 'AI 翻译 API 地址', type: 'url', placeholder: 'https://ai.searchgal.top/v1/chat/completions' },
  { key: 'aiTranslateApiKey', label: 'AI 翻译 API Key', type: 'password', placeholder: 'sk-...', mono: true },
  { key: 'aiTranslateModel', label: 'AI 翻译模型', type: 'text', placeholder: 'Qwen/Qwen2.5-32B-Instruct' },
  { key: 'backgroundImageApiUrl', label: '背景图片 API 地址', type: 'url', placeholder: 'https://api.illlights.com/v1/img' },
  { key: 'videoParseApiUrl', label: '视频解析 API 地址', type: 'url', placeholder: 'https://vp.searchgal.top/' },
]

function onInput(key: keyof AdvancedApiConfig, event: Event) {
  const target = event.target as HTMLInputElement
  modelValue.value = { ...modelValue.value, [key]: target.value }
  emit('typing')
}

function onReset() {
  modelValue.value = {
    vndbApiBaseUrl: DEFAULT_API_CONFIG.vndbApiBaseUrl,
    vndbImageProxyUrl: DEFAULT_API_CONFIG.vndbImageProxyUrl,
    aiTranslateApiUrl: DEFAULT_API_CONFIG.aiTranslateApiUrl,
    aiTranslateApiKey: DEFAULT_API_CONFIG.aiTranslateApiKey,
    aiTranslateModel: DEFAULT_API_CONFIG.aiTranslateModel,
    backgroundImageApiUrl: DEFAULT_API_CONFIG.backgroundImageApiUrl,
    videoParseApiUrl: DEFAULT_API_CONFIG.videoParseApiUrl,
  }
  emit('reset')
}
</script>
