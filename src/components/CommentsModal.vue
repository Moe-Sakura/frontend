<template>
  <Dialog v-model:open="open">
    <DialogContent
      :show-close-button="false"
      class="comments-modal inset-0 flex translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 shadow-2xl shadow-black/20
             max-w-none sm:max-w-none
             md:inset-6 md:m-auto md:h-[760px] md:max-h-[calc(100%_-_3rem)] md:w-[900px] md:max-w-[calc(100%_-_3rem)] md:rounded-3xl"
    >
      <!-- 顶部导航栏 -->
      <DialogHeader
        class="comments-header flex-row flex-shrink-0 items-center justify-between space-y-0 border-b border-white/10 px-3 py-2.5 select-none sm:px-5 sm:py-4 md:rounded-t-3xl dark:border-slate-700/50"
      >
        <!-- 返回按钮 - 移动端 -->
        <!-- ChevronLeft 必须显式写 size-5：基类的 [&_svg:not([class*='size-'])]:size-4
             是 CSS，会赢过 lucide 渲染的 width/height 属性，20px 会被静默压成 16px。
             hover:text-* 两条是压 ghost 自带的 hover:text-accent-foreground —— 原样式
             hover 时不变色，不压住会跳成 brand-primary-darker/lighter -->
        <Button
          v-ripple
          type="button"
          variant="ghost"
          class="-ml-2 h-auto gap-1 rounded-xl px-3 py-2 font-medium text-theme-primary hover:bg-theme-primary/5 hover:text-theme-primary md:hidden dark:text-theme-primary-light dark:hover:bg-theme-primary-darker/20 dark:hover:text-theme-primary-light"
          @click="open = false"
        >
          <ChevronLeft :size="20" class="size-5" />
          <span class="text-sm sm:text-base">返回</span>
        </Button>

        <!-- 标题 -->
        <div class="flex items-center gap-2 md:ml-0">
          <div
            class="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-theme-primary to-theme-accent shadow-lg shadow-theme-primary/30"
          >
            <MessageCircle :size="16" class="text-white" />
            <Send :size="8" class="absolute -right-0.5 -bottom-0.5 text-white/80" />
          </div>
          <div class="text-left">
            <DialogTitle
              class="flex items-center gap-1.5 text-base font-bold text-gray-800 sm:text-lg dark:text-white"
            >
              评论区
              <Sparkles :size="14" class="text-amber-400" />
            </DialogTitle>
            <DialogDescription class="hidden text-xs text-gray-500 md:block dark:text-slate-400">
              欢迎留下你的想法 💬
            </DialogDescription>
            <DialogDescription class="sr-only md:hidden">
              站点评论区
            </DialogDescription>
          </div>
        </div>

        <!-- 右侧按钮组 -->
        <div class="flex items-center gap-2">
          <!-- 关闭按钮 - 仅桌面端 -->
          <!-- hidden 会顶掉基类的 inline-flex，md:flex 是另一个修饰符所以保留下来 -->
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="关闭"
            title="关闭"
            class="hidden rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-500 md:flex dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            @click="open = false"
          >
            <X :size="16" />
          </Button>

          <!-- 移动端占位 -->
          <div class="w-8 md:hidden" />
        </div>
      </DialogHeader>

      <!-- 内容区域 -->
      <div class="custom-scrollbar flex-1 overflow-y-auto">
        <div class="px-2 py-3 sm:px-5 sm:py-5">
          <div id="Comments" class="comments-container" />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useUIStore } from '@/stores/ui'
import { playTransitionUp, playTransitionDown } from '@/composables/useSound'
import Artalk from 'artalk/dist/Artalk.mjs'
import 'artalk/dist/Artalk.css'
import { MessageCircle, ChevronLeft, X, Sparkles, Send } from '@lucide/vue'
import { config } from '@/config'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface ArtalkInstance {
  destroy(): void
}

const uiStore = useUIStore()
let artalkInstance: ArtalkInstance | null = null

/**
 * 音效挂在 setter 上：Reka 处理 Esc 与点击遮罩时只会把 open 置为 false，
 * 不会调用组件里的函数。原先的 isClosing 去抖也不需要了 —— 那是为了防住
 * 手写关闭路径的重复触发，Reka 的状态机自己保证幂等。
 */
const open = computed({
  get: () => uiStore.isCommentsModalOpen,
  set: (value: boolean) => {
    if (value) { playTransitionUp() } else { playTransitionDown() }
    uiStore.isCommentsModalOpen = value
  },
})

// 检查并滚动到指定评论
function scrollToComment() {
  const hash = window.location.hash
  if (!hash.startsWith('#atk-comment-')) {return}

  // 等待 Artalk 渲染完成后滚动
  const maxAttempts = 20
  let attempts = 0

  const tryScroll = () => {
    attempts++
    const targetEl = document.querySelector(hash)

    if (targetEl) {
      // 滚动到评论
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // 高亮效果
      targetEl.classList.add('atk-comment-highlight')
      setTimeout(() => {
        targetEl.classList.remove('atk-comment-highlight')
      }, 2000)
    } else if (attempts < maxAttempts) {
      // 评论还没加载完，继续尝试
      setTimeout(tryScroll, 200)
    }
  }

  // 延迟一点开始尝试，等待 Artalk 初始化
  setTimeout(tryScroll, 500)
}

// 初始化 Artalk
function initArtalk() {
  // 如果已经有实例，先销毁
  if (artalkInstance) {
    try {
      artalkInstance.destroy()
      artalkInstance = null
    } catch (error) {
      console.warn('[Artalk] 销毁旧实例失败：', error)
      artalkInstance = null
    }
  }

  void nextTick(() => {
    const commentsEl = document.getElementById('Comments')
    if (!commentsEl) {
      console.error('[Artalk] 未找到挂载点 #Comments，评论区无法初始化')
      return
    }

    try {
      artalkInstance = Artalk.init({
        el: '#Comments',
        pageKey: '/',
        server: config.services.artalkServer,
        site: config.services.artalkSite,
        darkMode: 'auto',
      })

      // 尝试滚动到指定评论
      scrollToComment()
    } catch (error) {
      // 不再静默：初始化失败时评论区会是空白，必须留下可诊断的线索
      console.error('[Artalk] 初始化失败：', error)
    }
  })
}

/**
 * Dialog 关闭时会卸载内容，#Comments 挂载点随之消失，所以每次打开都要重建
 * Artalk 实例 —— 这与迁移前的行为一致（原先虽然用 v-show 保留了 DOM，
 * initArtalk 里也是先 destroy 再 init）。延时是等 Reka 把内容挂进 portal。
 */
watch(() => uiStore.isCommentsModalOpen, (isOpen: boolean) => {
  if (isOpen) {
    setTimeout(initArtalk, 100)
  }
})

onMounted(() => {
  // 面板状态会被持久化，刷新后可能一上来就是打开的
  if (uiStore.isCommentsModalOpen) {
    setTimeout(initArtalk, 200)
  }
})

onUnmounted(() => {
  if (artalkInstance) {
    try {
      artalkInstance.destroy()
      artalkInstance = null
    } catch {
      // 静默处理错误
    }
  }
})
</script>

<style>
/* 评论面板 - 半透明效果 */
.comments-modal {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-panel, 0.85));
  will-change: transform;
  border: var(--border-thin, 1px) solid rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-xl, 0 12px 32px rgba(0, 0, 0, 0.15));
}

/* 移动端无底部边框 */
@media (max-width: 767px) {
  .comments-modal {
    border-bottom: none;
  }
}

/* 评论面板 - 暗色模式 */
.dark .comments-modal {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-panel-dark, 0.88));
  border-color: rgba(var(--brand-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 头部样式 */
.comments-header {
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-header, 0.7));
}

.dark .comments-header {
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-header-dark, 0.7));
}

/* 评论容器样式 */
.comments-container {
  background: rgba(248, 250, 252, var(--opacity-header, 0.7));
  border-radius: var(--radius-lg, 1rem);
  padding: var(--spacing-md, 1rem);
  border: var(--border-thin, 1px) solid rgba(226, 232, 240, 0.4);
}

@media (min-width: 640px) {
  .comments-container {
    padding: var(--spacing-lg, 1.25rem);
    border-radius: var(--radius-xl, 1.25rem);
  }
}

/* 暗色模式评论容器 */
.dark .comments-container {
  background: rgba(51, 65, 85, var(--opacity-header-dark, 0.7));
  border: var(--border-thin, 1px) solid rgba(255, 255, 255, 0.05);
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  /* 跟随主题色预设，原先写死 #ff1493 → #d946ef */
  background: linear-gradient(180deg, rgb(var(--brand-primary)), rgb(var(--brand-accent)));
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(var(--brand-primary-dark)), rgb(var(--brand-accent-dark)));
}

/* 评论高亮动画 */
.atk-comment-highlight {
  animation: comment-highlight 2s ease-out;
}

@keyframes comment-highlight {
  0%, 50% {
    background-color: rgba(var(--brand-primary), 0.2);
    box-shadow: 0 0 0 4px rgba(var(--brand-primary), 0.3);
    border-radius: 8px;
  }
  100% {
    background-color: transparent;
    box-shadow: 0 0 0 0 transparent;
  }
}
</style>
