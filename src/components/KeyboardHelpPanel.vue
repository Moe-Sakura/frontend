<template>
  <Dialog v-model:open="open">
    <DialogContent
      class="keyboard-help-panel glassmorphism-card max-w-md gap-0 overflow-hidden rounded-3xl p-0 shadow-2xl shadow-black/20"
    >
      <!-- 标题栏 -->
      <DialogHeader
        class="flex-row items-center gap-3 space-y-0 border-b border-white/10 px-5 py-4 dark:border-slate-700/50"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-theme-primary to-theme-accent shadow-lg shadow-theme-primary/30"
        >
          <Keyboard :size="20" class="text-white" />
        </div>
        <div class="text-left">
          <DialogTitle class="font-bold text-gray-800 dark:text-white">
            键盘快捷键
          </DialogTitle>
          <DialogDescription class="text-xs text-gray-500 dark:text-slate-400">
            按 ? 或 Esc 关闭
          </DialogDescription>
        </div>
      </DialogHeader>

      <!-- 快捷键列表 -->
      <div class="custom-scrollbar max-h-[60vh] overflow-y-auto px-5 py-4">
        <div
          v-for="(group, i) in SHORTCUT_GROUPS"
          :key="group.label"
          :class="i < SHORTCUT_GROUPS.length - 1 ? 'mb-4' : ''"
        >
          <h3
            class="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wider text-gray-400 uppercase dark:text-slate-500"
          >
            <component :is="group.icon" :size="12" />
            {{ group.label }}
          </h3>
          <div class="space-y-2">
            <div v-for="item in group.items" :key="item.key" class="shortcut-row">
              <span class="flex items-center gap-2">
                <component :is="item.icon" :size="14" :class="item.iconClass" />
                {{ item.label }}
              </span>
              <kbd>{{ item.key }}</kbd>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Keyboard } from '@lucide/vue'
import { useUIStore } from '@/stores/ui'
import { playTransitionDown } from '@/composables/useSound'
import { SHORTCUT_GROUPS } from '@/config/shortcuts'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const uiStore = useUIStore()

/**
 * Reka 的 Dialog 会自己处理 Esc、点击遮罩和关闭按钮，这些路径都只体现为
 * open 变 false —— 不会调用组件里的某个 close()。所以关闭音效必须挂在这个
 * setter 上，否则除了「点关闭按钮」以外的关闭方式都会静音。
 */
const open = computed({
  get: () => uiStore.isKeyboardHelpOpen,
  set: (value: boolean) => {
    if (!value) { playTransitionDown() }
    uiStore.isKeyboardHelpOpen = value
  },
})
</script>

<style scoped>
.keyboard-help-panel {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-panel, 0.85));
}

.dark .keyboard-help-panel {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-panel-dark, 0.88));
}

.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
}

.shortcut-row span {
  font-size: 0.875rem;
  color: #374151;
}

.dark .shortcut-row span {
  color: #cbd5e1;
}

.shortcut-row kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
  font-weight: 600;
  color: white;
  /* 跟随主题色预设，原先是写死的 #ff1493 → #d946ef */
  background: linear-gradient(135deg, rgb(var(--brand-primary)), rgb(var(--brand-accent)));
  border-radius: 0.5rem;
  box-shadow:
    0 2px 6px rgba(var(--brand-primary), 0.3),
    0 1px 0 rgba(255, 255, 255, 0.2) inset;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(var(--brand-primary), 0.3);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--brand-primary), 0.5);
}
</style>
