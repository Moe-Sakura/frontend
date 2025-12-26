<script setup lang="ts">
import { Link as LinkIcon } from 'lucide-vue-next'

defineProps<{
  index: number
  source: {
    title: string
    url: string
  }
}>()

// 从URL中提取路径
function extractPath(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname + urlObj.search + urlObj.hash
  } catch {
    return url
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
      <span class="text-theme-primary dark:text-theme-accent text-sm font-bold mt-0.5 shrink-0 opacity-60 group-hover:opacity-100">
        {{ index + 1 }}.
      </span>
      <a
        :href="source.url"
        target="_blank"
        rel="noopener noreferrer"
        class="text-gray-800 dark:text-slate-200 group-hover:text-theme-primary dark:group-hover:text-theme-accent font-semibold flex-1 text-sm sm:text-base break-words leading-relaxed"
      >
        {{ source.title }}
      </a>
    </div>
    
    <!-- 资源相对路径（从URL中提取） -->
    <div v-if="source.url" class="flex items-center gap-2 mt-2 ml-6 sm:ml-8">
      <LinkIcon :size="12" class="text-theme-primary/50 dark:text-theme-accent/50" />
      <span class="text-xs text-gray-500 dark:text-slate-400 break-all font-mono bg-gray-100/80 dark:bg-slate-800/80 px-2 py-1 rounded">
        {{ extractPath(source.url) }}
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

