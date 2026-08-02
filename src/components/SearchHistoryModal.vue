<template>
  <!--
    modal={false}：这是右下角的浮层而非模态框 —— 不要遮罩、不锁滚动、
    不阻断页面指针事件，但仍然拿到 Esc 关闭、点击外部关闭与焦点管理。
    触发按钮在 FloatingButtons 里，所以这里没有 DialogTrigger，靠 store 驱动。
  -->
  <Dialog v-model:open="open" :modal="false">
    <DialogContent
      :show-close-button="false"
      class="history-modal top-auto right-4 bottom-20 left-auto flex max-h-[60vh] w-80 max-w-[calc(100vw_-_2rem)] translate-x-0 translate-y-0 flex-col gap-0 rounded-2xl border-0 p-0 shadow-2xl shadow-black/20 sm:max-w-[calc(100vw_-_2rem)]"
    >
      <!-- 顶部导航栏 -->
      <DialogHeader
        class="history-header flex-row flex-shrink-0 items-center justify-between space-y-0 rounded-t-2xl border-b border-white/10 px-4 py-3 dark:border-slate-700/50"
      >
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/30"
          >
            <History :size="16" class="text-white" />
          </div>
          <div class="text-left">
            <DialogTitle class="text-sm font-bold text-gray-800 dark:text-white">
              搜索历史
            </DialogTitle>
            <DialogDescription
              v-if="historyStore.historyCount > 0"
              class="text-xs text-gray-500 dark:text-slate-400"
            >
              {{ historyStore.historyCount }} 条记录
            </DialogDescription>
            <DialogDescription v-else class="sr-only">
              搜索历史面板，当前没有记录
            </DialogDescription>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex items-center gap-1">
          <AlertDialog v-model:open="confirmClearOpen">
            <AlertDialogTrigger v-if="history.length > 0" as-child>
              <!-- Trash2 要显式写 size-3.5(14px)：基类的 [&_svg:not([class*='size-'])]:size-4
                   是 CSS，会赢过 lucide 的 width/height 属性，否则被撑到 16px。
                   原先只有 title，title 不是可靠的可访问名，补 aria-label -->
              <Button
                v-ripple="'rgba(239, 68, 68, 0.3)'"
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="清空搜索历史"
                title="清空历史"
                class="size-7 rounded-full text-red-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                @click="playCaution()"
              >
                <Trash2 class="size-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent class="glassmorphism-card">
              <AlertDialogHeader>
                <AlertDialogTitle>清空搜索历史？</AlertDialogTitle>
                <AlertDialogDescription>
                  将删除全部 {{ historyStore.historyCount }} 条记录，此操作无法撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel @click="playTap()">
                  取消
                </AlertDialogCancel>
                <AlertDialogAction
                  class="bg-red-500 text-white hover:bg-red-600"
                  @click="handleClearHistory"
                >
                  清空
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <!-- 原先既无 title 也无 aria-label，纯图标按钮对屏幕阅读器完全无名 -->
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="关闭搜索历史"
            class="size-7 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-700 dark:hover:text-gray-300"
            @click="open = false"
          >
            <X :size="16" />
          </Button>
        </div>
      </DialogHeader>

      <!-- 内容区域 -->
      <div class="custom-scrollbar flex-1 overflow-y-auto">
        <div class="p-2">
          <!-- 无历史记录时显示 -->
          <div
            v-if="history.length === 0"
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <div
              class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-900/20"
            >
              <Clock :size="24" class="text-amber-400/50" />
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              暂无搜索历史
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              搜索后会自动记录
            </p>
          </div>

          <!-- 历史记录列表 -->
          <div v-else class="space-y-1">
            <TransitionGroup
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 translate-x-2"
              enter-to-class="opacity-100 translate-x-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0 scale-95"
              move-class="transition-all duration-200"
            >
              <div
                v-for="(item, index) in history"
                :key="item.query + item.mode + index"
                v-ripple
                role="button"
                tabindex="0"
                class="history-item group flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 transition-all duration-150"
                @click="handleSelectHistory(item)"
                @keydown.enter="handleSelectHistory(item)"
                @keydown.space.prevent="handleSelectHistory(item)"
              >
                <!-- 模式标签 -->
                <Badge
                  class="flex-shrink-0 gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase"
                  :class="item.mode === 'game'
                    ? 'border-transparent bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'border-transparent bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'"
                >
                  <component :is="item.mode === 'game' ? Gamepad2 : Wrench" :size="10" />
                  {{ item.mode === 'game' ? '游戏' : '补丁' }}
                </Badge>

                <!-- 搜索图标 + 关键词 -->
                <div class="flex min-w-0 flex-1 items-center gap-1.5">
                  <Search
                    :size="12"
                    class="shrink-0 text-gray-400 transition-colors group-hover:text-amber-500 dark:text-slate-500"
                  />
                  <span
                    v-text-scroll
                    class="flex-1 text-left text-sm font-medium text-gray-700 transition-colors group-hover:text-amber-600 dark:text-slate-200 dark:group-hover:text-amber-400"
                  >
                    {{ item.query }}
                  </span>
                </div>

                <!-- 结果数 -->
                <span
                  v-if="item.resultCount"
                  class="flex flex-shrink-0 items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500"
                  :title="`${item.resultCount} 条结果`"
                >
                  <Hash :size="10" />
                  {{ item.resultCount }}
                </span>

                <!--
                  icon-xs 正好是 size-6 且强制 svg size-3(12px)，与原尺寸一致。
                  颜色从 <X> 挪到按钮上：基类有 [&_svg]:pointer-events-none，
                  挂在 svg 上的 hover:text-red-500 永远不会触发。
                  focus-visible:opacity-100 让键盘用户能看见这颗默认透明的按钮。
                -->
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label="删除这条历史"
                  class="shrink-0 rounded-md text-gray-400 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 dark:hover:text-red-500"
                  @click.stop="handleRemoveItem(index)"
                >
                  <X />
                </Button>
              </div>
            </TransitionGroup>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useHistoryStore } from '@/stores/history'
import type { SearchHistory } from '@/utils/persistence'
import {
  playSelect,
  playTap,
  playCaution,
  playTransitionUp,
  playTransitionDown,
} from '@/composables/useSound'
import { History, Trash2, X, Gamepad2, Wrench, Hash, Clock, Search } from '@lucide/vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const uiStore = useUIStore()
const historyStore = useHistoryStore()

const history = computed(() => historyStore.searchHistory)
const confirmClearOpen = ref(false)

const emit = defineEmits<{
  select: [history: SearchHistory]
}>()

/**
 * Reka 处理 Esc 与点击外部时只会把 open 置为 false，不会调用组件里的函数，
 * 所以开关音效都要挂在这个 setter 上。开面板时顺带刷新一次列表。
 */
const open = computed({
  get: () => uiStore.isHistoryModalOpen,
  set: (value: boolean) => {
    if (value) {
      playTransitionUp()
      historyStore.loadHistory()
    } else {
      playTransitionDown()
    }
    uiStore.isHistoryModalOpen = value
  },
})

function handleSelectHistory(item: SearchHistory) {
  playSelect()
  // 先发事件让父组件更新 URL，再关闭面板
  emit('select', item)
  uiStore.isHistoryModalOpen = false
}

function handleClearHistory() {
  historyStore.clearHistory()
}

function handleRemoveItem(index: number) {
  playTap()
  historyStore.removeHistory(index)
}

onMounted(() => {
  // 面板状态会被持久化，刷新后可能一上来就是打开的
  if (uiStore.isHistoryModalOpen) {
    historyStore.loadHistory()
  }
})
</script>

<style>
/* 历史记录面板 - 右下角弹出 (亮色模式) */
.history-modal {
  background: linear-gradient(
    180deg,
    rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-panel, 0.85)) 0%,
    rgba(255, 253, 245, var(--opacity-panel-hover, 0.9)) 100%
  );
  border: var(--border-thin, 1px) solid rgba(var(--color-warning, 251, 191, 36), var(--opacity-border, 0.15));
  border-radius: var(--radius-2xl, 1.5rem);
}

/* 历史记录面板 - 右下角弹出 (暗色模式) */
.dark .history-modal {
  background: linear-gradient(
    180deg,
    rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-panel-dark, 0.88)) 0%,
    rgba(30, 27, 17, var(--opacity-panel-dark-hover, 0.92)) 100%
  ) !important;
  border: var(--border-thin, 1px) solid rgba(var(--color-warning, 251, 191, 36), var(--opacity-border-dark, 0.2)) !important;
}

/* 头部样式 */
.history-header {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-header, 0.7));
}

.dark .history-header {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-header-dark, 0.7)) !important;
}

/* 历史记录项 */
.history-item {
  background: transparent;
}

.history-item:hover {
  background: rgba(251, 191, 36, 0.08);
}

.dark .history-item:hover {
  background: rgba(251, 191, 36, 0.12) !important;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #f59e0b, #d97706);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #d97706, #b45309);
}
</style>
