<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-2 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-2 scale-95"
  >
    <div v-if="error" class="mt-4 w-full max-w-2xl px-2 sm:px-0">
      <Alert class="error-card block border-red-200/50 dark:border-red-800/30">
        <!-- 错误头部 -->
        <div class="flex items-start gap-3">
          <div
            class="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl shadow-lg"
            :class="kindStyle.bgClass"
          >
            <component :is="kindStyle.icon" :size="22" class="text-white" />
          </div>

          <div class="min-w-0 flex-1">
            <div class="mb-1.5 flex flex-wrap items-center gap-2">
              <AlertTitle class="mb-0 text-base font-bold text-red-700 dark:text-red-300">
                {{ info.title }}
              </AlertTitle>
              <div class="flex items-center gap-1.5">
                <Badge
                  class="rounded-md border-transparent bg-gradient-to-r from-red-500 to-rose-500 px-2 py-0.5 text-[11px] font-bold text-white shadow-sm"
                >
                  {{ info.code }}
                </Badge>
                <Badge
                  v-if="info.httpStatus"
                  class="rounded border-transparent bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-red-500 dark:bg-red-900/40 dark:text-red-400"
                >
                  {{ info.description }}
                </Badge>
              </div>
            </div>
            <AlertDescription
              class="text-sm leading-relaxed break-words text-red-600 dark:text-red-400"
            >
              {{ info.message }}
            </AlertDescription>

            <div
              v-if="info.details"
              class="mt-2 rounded-lg border border-red-200/50 bg-red-100/50 p-2.5 dark:border-red-800/30 dark:bg-red-950/40"
            >
              <div class="flex items-start gap-2">
                <div
                  class="flex-shrink-0 rounded bg-red-200/50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-red-500 dark:bg-red-900/50 dark:text-red-400"
                >
                  DETAIL
                </div>
                <code
                  class="font-mono text-[11px] leading-relaxed break-all text-red-600/80 dark:text-red-400/80"
                >
                  {{ info.details }}
                </code>
              </div>
            </div>
          </div>

          <!-- 原先既无 title 也无 aria-label，纯图标按钮对屏幕阅读器完全无名 -->
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="关闭错误提示"
            class="rounded-lg text-red-400 hover:scale-110 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-300"
            @click="emit('close')"
          >
            <X :size="16" />
          </Button>
        </div>

        <!-- 建议操作 -->
        <div
          class="mt-4 flex flex-wrap items-center gap-2 border-t border-red-200/30 pt-3 dark:border-red-800/30"
        >
          <span class="text-xs font-medium text-red-500/80 dark:text-red-400/80">快速操作：</span>
          <!--
            保留原生 <button>：背景是渐变。tailwind-merge 消不掉 Button 的
            hover:bg-primary/90（background-image 与 background-color 是两个属性），
            换 Button 得额外写 hover:bg-transparent hover:text-white 等 6 个覆盖类
            才压得住，为一个焦点圈不划算。焦点圈这里手写补上。
          -->
          <button
            v-ripple="'rgba(239, 68, 68, 0.3)'"
            type="button"
            class="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-red-500/20 transition-all outline-none hover:from-red-600 hover:to-rose-600 hover:shadow-lg hover:shadow-red-500/30 focus-visible:ring-3 focus-visible:ring-red-500/50 disabled:opacity-50"
            :disabled="retryDisabled"
            @click="emit('retry')"
          >
            <RefreshCw :size="12" :class="{ 'animate-spin': retryDisabled }" />
            <span>{{ retryDisabled ? '请稍候...' : '重新搜索' }}</span>
          </button>
          <!-- hover:text-* 是压 outline 自带的 hover:text-accent-foreground（品牌粉），
               不然红色错误卡上的按钮一 hover 就变粉 -->
          <Button
            type="button"
            variant="outline"
            size="sm"
            class="h-auto rounded-lg border-red-200/50 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 hover:text-red-600 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 dark:hover:text-red-400"
            @click="emit('close')"
          >
            关闭提示
          </Button>
          <a
            href="https://status.searchgal.top"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 rounded-lg border border-red-200/50 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 dark:border-red-800/30 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
          >
            <Wifi :size="12" />
            <span>服务状态</span>
          </a>
        </div>
      </Alert>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { computed } from 'vue'
import { AlertCircle, Clock, RefreshCw, Server, Wifi, WifiOff, X } from '@lucide/vue'
import { describeSearchError, type SearchErrorKind } from '@/utils/searchError'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  error: string
  retryDisabled?: boolean
}>()

const emit = defineEmits<{
  close: []
  retry: []
}>()

/** 错误大类 → 图标与配色。分类本身在 utils/searchError.ts。 */
const KIND_STYLE: Record<SearchErrorKind, { icon: Component, bgClass: string }> = {
  network: { icon: WifiOff, bgClass: 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/30' },
  timeout: { icon: Clock, bgClass: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30' },
  server: { icon: Server, bgClass: 'bg-gradient-to-br from-red-600 to-rose-600 shadow-red-600/30' },
  unknown: { icon: AlertCircle, bgClass: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30' },
}

const info = computed(() => describeSearchError(props.error))
const kindStyle = computed(() => KIND_STYLE[info.value.kind])
</script>

<style scoped>
.error-card {
  /*
   * 注意：--color-error 在 glassmorphism.css 里定义为 239, 68, 68（正红），
   * 所以这里第一个色标实际是 rgba(239,68,68,0.85) 的浓红，而第二个色标是
   * rgba(254,226,226) 的极浅粉 —— 一个跨度很大的渐变。
   * 写法里那个 254,242,242 的 fallback 属于同一浅色系，看起来作者本意是
   * 两端都用浅色，只是没意识到 --color-error 是有定义的。
   * 这次迁移不改视觉，原样保留；要不要修由你定。
   */
  background: linear-gradient(
    135deg,
    rgba(var(--color-error, 254, 242, 242), var(--opacity-panel, 0.85)),
    rgba(254, 226, 226, var(--opacity-panel, 0.85))
  );
  /* 原本这里连写了两遍 border-radius，后一条 1rem 让上面的 var() 形同虚设；
     两者取值相同，去掉重复的那条不改变渲染 */
  border-radius: var(--radius-lg, 1rem);
  padding: 1rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
  box-shadow:
    0 4px 20px -4px rgba(239, 68, 68, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  animation: errorShake 0.5s ease-out;
}

:global(.dark) .error-card {
  background: linear-gradient(135deg, rgba(127, 29, 29, 0.4), rgba(153, 27, 27, 0.3));
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow:
    0 4px 20px -4px rgba(239, 68, 68, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
</style>
