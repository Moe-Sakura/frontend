<template>
  <Teleport to="body">
    <!-- 键盘快捷键面板 -->
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="uiStore.isKeyboardHelpOpen"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- 面板 -->
        <div
          ref="panelRef"
          class="keyboard-help-panel glassmorphism-card rounded-3xl shadow-2xl shadow-black/20 w-full max-w-md overflow-hidden"
        >
          <!-- 标题栏 -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-white/10 dark:border-slate-700/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff1493] to-[#d946ef] flex items-center justify-center shadow-lg shadow-pink-500/30">
                <Keyboard :size="20" class="text-white" />
              </div>
              <div>
                <h2 class="font-bold text-gray-800 dark:text-white">键盘快捷键</h2>
                <p class="text-xs text-gray-500 dark:text-slate-400">按 ? 或 Esc 关闭</p>
              </div>
            </div>
            <button
              class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              @click="close"
            >
              <X :size="18" />
            </button>
          </div>

          <!-- 快捷键列表 -->
          <div class="px-5 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <!-- 导航 -->
            <div class="mb-4">
              <h3 class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Navigation :size="12" />
                导航
              </h3>
              <div class="space-y-2">
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <X :size="14" class="text-gray-400" />
                    关闭当前面板
                  </span>
                  <kbd>Esc</kbd>
                </div>
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <Home :size="14" class="text-blue-400" />
                    返回首页
                  </span>
                  <kbd>H</kbd>
                </div>
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <Settings :size="14" class="text-gray-400" />
                    打开/关闭设置
                  </span>
                  <kbd>,</kbd>
                </div>
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <MessageSquare :size="14" class="text-pink-400" />
                    打开/关闭评论
                  </span>
                  <kbd>C</kbd>
                </div>
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <BookOpen :size="14" class="text-purple-400" />
                    打开/关闭作品介绍
                  </span>
                  <kbd>V</kbd>
                </div>
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <History :size="14" class="text-amber-400" />
                    打开/关闭搜索历史
                  </span>
                  <kbd>Y</kbd>
                </div>
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <Grid3x3 :size="14" class="text-cyan-400" />
                    站点导航
                  </span>
                  <kbd>N</kbd>
                </div>
              </div>
            </div>

            <!-- 操作 -->
            <div class="mb-4">
              <h3 class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap :size="12" />
                操作
              </h3>
              <div class="space-y-2">
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <Search :size="14" class="text-green-400" />
                    聚焦搜索框
                  </span>
                  <kbd>/</kbd>
                </div>
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <HelpCircle :size="14" class="text-indigo-400" />
                    显示/隐藏快捷键帮助
                  </span>
                  <kbd>?</kbd>
                </div>
              </div>
            </div>

            <!-- 滚动 -->
            <div>
              <h3 class="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Command :size="12" />
                滚动
              </h3>
              <div class="space-y-2">
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <ArrowUp :size="14" class="text-rose-400" />
                    回到顶部
                  </span>
                  <kbd>T</kbd>
                </div>
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <ChevronLeft :size="14" class="text-orange-400" />
                    上一个平台
                  </span>
                  <kbd>[</kbd>
                </div>
                <div class="shortcut-row">
                  <span class="flex items-center gap-2">
                    <ChevronRight :size="14" class="text-orange-400" />
                    下一个平台
                  </span>
                  <kbd>]</kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUIStore } from '@/stores/ui'
import { playTransitionDown } from '@/composables/useSound'
import { 
  Keyboard, X, 
  Home, Settings, MessageSquare, BookOpen, History, Grid3x3, Search, HelpCircle,
  ArrowUp, ChevronLeft, ChevronRight,
  Navigation, Command, Zap
} from 'lucide-vue-next'

const uiStore = useUIStore()
const panelRef = ref<HTMLElement | null>(null)

function close() {
  playTransitionDown()
  uiStore.isKeyboardHelpOpen = false
}
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
  background: linear-gradient(135deg, #ff1493, #d946ef);
  border-radius: 0.5rem;
  box-shadow: 
    0 2px 6px rgba(255, 20, 147, 0.3),
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
  background: rgba(255, 20, 147, 0.3);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 20, 147, 0.5);
}
</style>
