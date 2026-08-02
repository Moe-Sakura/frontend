<script setup lang="ts">
import { Link as LinkIcon, ExternalLink, FileText, Copy, Check } from '@lucide/vue'
import { ref } from 'vue'
import { playTap, playNotification } from '@/composables/useSound'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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
      
      <!--
        迁移到 Button 主要是为了可达性：这颗按钮 opacity-0 直到 group-hover，
        键盘用户 Tab 上去原本什么都看不见。Button 自带 focus-visible:ring-3，
        再补一条 focus-visible:opacity-100 让它在获得焦点时现形。
        copied 态要重复写 hover:text-green-500，否则鼠标停在按钮上时
        （刚点完就是这个状态）会被上面的 hover:text-theme-primary 盖掉。
      -->
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        class="size-7 shrink-0 rounded-lg text-gray-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100
               hover:bg-theme-primary/10 hover:text-theme-primary
               dark:hover:bg-theme-accent/10 dark:hover:text-theme-accent"
        :class="{ 'opacity-100 text-green-500 hover:text-green-500 dark:hover:text-green-500': copied }"
        :title="copied ? '已复制' : '复制链接'"
        :aria-label="copied ? '已复制链接' : '复制链接'"
        @click.stop="copyLink(source.url)"
      >
        <component :is="copied ? Check : Copy" />
      </Button>
    </div>

    <!--
      复制成功原先只体现为图标从 Copy 变成 Check —— 屏幕阅读器用户完全收不到
      反馈。这里用一个 aria-live 区域播报，视觉上不占位。
    -->
    <span class="sr-only" role="status" aria-live="polite">
      {{ copied ? '链接已复制到剪贴板' : '' }}
    </span>

    <!-- 资源相对路径（从URL中提取） -->
    <div v-if="source.url" class="flex items-center gap-2 mt-2 ml-7 sm:ml-9">
      <LinkIcon :size="12" class="text-theme-primary/50 dark:text-theme-accent/50 shrink-0" />
      <Badge
        class="rounded border-transparent bg-gray-100/80 px-2 py-1 font-mono text-xs font-normal break-all whitespace-normal text-gray-500 dark:bg-slate-800/80 dark:text-slate-400"
      >
        {{ decodeUrl(source.url) }}
      </Badge>
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

