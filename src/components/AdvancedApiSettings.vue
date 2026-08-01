<template>
  <div class="settings-card">
    <div class="mb-4 flex items-center gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30"
      >
        <Terminal :size="20" class="text-white" />
      </div>
      <div>
        <h2 class="text-lg font-bold text-gray-800 dark:text-white">
          高级 API 设置
        </h2>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          自定义 VNDB 和 AI 翻译 API
        </p>
      </div>
    </div>

    <div class="space-y-4">
      <div v-for="field in fields" :key="field.key">
        <Label
          :for="`api-field-${field.key}`"
          class="mb-2 block text-sm font-medium text-gray-700 dark:text-slate-300"
        >
          {{ field.label }}
        </Label>
        <Input
          :id="`api-field-${field.key}`"
          :model-value="modelValue[field.key]"
          :type="field.type"
          :placeholder="field.placeholder"
          class="api-input h-auto w-full rounded-xl border-2 border-transparent bg-slate-50 px-4 py-3 text-sm shadow-inner transition-all duration-200 focus-visible:border-cyan-500 focus-visible:shadow-lg focus-visible:shadow-cyan-500/10 focus-visible:ring-0 dark:bg-slate-800/80"
          :class="{ 'font-mono': field.mono }"
          @update:model-value="onInput(field.key, $event)"
        />
      </div>

      <Button
        variant="outline"
        class="h-auto w-full rounded-xl border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-medium text-cyan-600 transition-all hover:bg-cyan-100 active:scale-[0.98] dark:border-cyan-800/50 dark:bg-cyan-950/40 dark:text-cyan-400 dark:hover:bg-cyan-950/60"
        @click="onReset"
      >
        恢复默认值
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Terminal } from '@lucide/vue'
import { DEFAULT_API_CONFIG } from '@/stores/settings'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

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

function onInput(key: keyof AdvancedApiConfig, value: string | number) {
  modelValue.value = { ...modelValue.value, [key]: String(value) }
  emit('typing')
}

function onReset() {
  // 从 fields 派生，新增字段时不必再同步维护一份键名清单
  const next = { ...modelValue.value }
  for (const field of fields) {
    next[field.key] = DEFAULT_API_CONFIG[field.key]
  }

  modelValue.value = next
  emit('reset')
}
</script>
