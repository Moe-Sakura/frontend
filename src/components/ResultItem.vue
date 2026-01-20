<script setup lang="ts">
import { Link as LinkIcon, ExternalLink, FileText, Copy, Check } from 'lucide-vue-next'
import { ref } from 'vue'
import { playTap, playNotification } from '@/composables/useSound'

defineProps<{
  index: number
  source: {
    title: string
    url: string
  }
}>()

const copied = ref(false)

// 解码 URL 显示（包含完整网址）
function decodeUrl(url: string): string {
  try {
    // 解码 URL 编码的中文等字符
    return decodeURIComponent(url)
  } catch {
    // 解码失败则返回原始 URL
    return url
  }
}

// 复制链接
async function copyLink(url: string) {
  playTap()
  try {
    await navigator.clipboard.writeText(url)
    playNotification()
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    // 静默处理
  }
}
</script>

<template>
  <div
    class="result-item group p-3 sm:p-4 rounded-xl 
           bg-white/60 dark:bg-slate-700/60
           hover:bg-white/80 dark:hover:bg-slate-700/80
           border border-gray-200/40 dark:border-slate-600/40
           hover:border-theme-primary/30 dark:hover:border-theme-accent/30"
  >
    <!-- 标题行 -->
    <div class="flex items-start gap-2 sm:gap-3">
      <!-- 序号 + 文件图标 -->
      <div class="flex items-center gap-1.5 shrink-0 mt-0.5">
        <FileText :size="14" class="text-theme-primary/60 dark:text-theme-accent/60 group-hover:text-theme-primary dark:group-hover:text-theme-accent transition-colors" />
        <span class="text-theme-primary dark:text-theme-accent text-sm font-bold opacity-60 group-hover:opacity-100 transition-opacity">
          {{ index + 1 }}
        </span>
      </div>
      
      <!-- 标题链接 -->
      <a
        :href="source.url"
        target="_blank"
        rel="noopener noreferrer"
        class="flex-1 flex items-start gap-1.5 text-gray-800 dark:text-slate-200 group-hover:text-theme-primary dark:group-hover:text-theme-accent font-semibold text-sm sm:text-base break-words leading-relaxed transition-colors"
      >
        <span class="flex-1">{{ source.title }}</span>
        <ExternalLink :size="14" class="shrink-0 mt-1 opacity-0 group-hover:opacity-70 transition-opacity" />
      </a>
      
      <!-- 复制按钮 -->
      <button
        class="shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 
               text-gray-400 hover:text-theme-primary dark:hover:text-theme-accent
               hover:bg-theme-primary/10 dark:hover:bg-theme-accent/10
               transition-all"
        :class="{ '!opacity-100 !text-green-500': copied }"
        :title="copied ? '已复制' : '复制链接'"
        @click.stop="copyLink(source.url)"
      >
        <component :is="copied ? Check : Copy" :size="14" />
      </button>
    </div>
    
    <!-- 资源相对路径（从URL中提取） -->
    <div v-if="source.url" class="flex items-center gap-2 mt-2 ml-7 sm:ml-9">
      <LinkIcon :size="12" class="text-theme-primary/50 dark:text-theme-accent/50 shrink-0" />
      <span class="text-xs text-gray-500 dark:text-slate-400 break-all font-mono bg-gray-100/80 dark:bg-slate-800/80 px-2 py-1 rounded">
        {{ decodeUrl(source.url) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* 结果项 - 简化动画，仅使用 transform */
.result-item {
  transition: transform 0.15s ease-out, background-color 0.15s ease-out;
}

.result-item:hover {
  transform: translateX(4px);
}
</style>

