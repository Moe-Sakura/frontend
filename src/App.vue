<template>
  <!-- 
    #app 样式说明：
    - min-h-screen: 最小高度 100vh
    - relative: 相对定位
    - 字体、行高、换行等样式由 Tailwind 的 @layer base 处理
  -->
  <div 
    id="app" 
    class="min-h-screen relative"
  >
    <!-- 背景层容器 - GPU 加速 -->
    <div
      id="background-container" 
      class="fixed inset-0 z-[-2] overflow-hidden gpu-layer"
    >
      <!-- 默认背景纹理（无图片时显示） -->
      <div
        id="background-pattern"
        class="absolute inset-0 transition-opacity duration-800"
        :class="{ 'opacity-0': hasBackgroundImage }"
      />
      
      <!-- 动画背景图层 - 使用 anime.js + CSS Ken Burns 效果 -->
      <AnimatedBackground
        :image-url="backgroundImageUrl"
        :image-key="currentBgKey"
        :ken-burns-class="kenBurnsClass"
      />
      
      <!-- 半透明遮罩层（提升内容可读性） -->
      <div class="absolute inset-0 bg-white/15 dark:bg-slate-900/30 z-[1]" />
    </div>

    <main class="flex-1 flex flex-col min-h-screen">
      <StatsCorner />
      <TopToolbar :current-background-url="randomImageUrl" @open-settings="openSettings" />
      <SearchHeader ref="searchHeaderRef" />
      <SearchResults />
      <FloatingButtons />
      <CommentsModal />
      <VndbPanel />
      <SearchHistoryModal @select="handleHistorySelect" />
      <SettingsModal
        :is-open="uiStore.isSettingsModalOpen"
        :custom-api="searchStore.customApi"
        :custom-c-s-s="uiStore.customCSS"
        @close="uiStore.isSettingsModalOpen = false"
        @save="saveSettings"
      />

      <!-- 键盘快捷键帮助 -->
      <KeyboardHelpPanel />

      <!-- 图片预览器 -->
      <ImageViewer />

      <!-- SW 更新提示 -->
      <UpdateToast
        :is-visible="uiStore.showUpdateToast"
        :on-update="handleSwUpdate"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import { useSearchStore } from '@/stores/search'
import { useUIStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { 
  saveCustomCSS,
  applyCustomCSS,
  applyCustomJS,
  applyCustomHTML,
} from '@/utils/theme'
import { scheduleIdleTask } from '@/composables/usePerformance'
import { useBackgroundImage } from '@/composables/useBackgroundImage'

// 关键组件 - 同步加载
import StatsCorner from '@/components/StatsCorner.vue'
import TopToolbar from '@/components/TopToolbar.vue'
import SearchHeader from '@/components/SearchHeader.vue'
import SearchResults from '@/components/SearchResults.vue'
import FloatingButtons from '@/components/FloatingButtons.vue'

// 非关键组件 - 异步懒加载（用户交互时才加载）
const CommentsModal = defineAsyncComponent(() => import('@/components/CommentsModal.vue'))
const VndbPanel = defineAsyncComponent(() => import('@/components/VndbPanel.vue'))
const SettingsModal = defineAsyncComponent(() => import('@/components/SettingsModal.vue'))
const SearchHistoryModal = defineAsyncComponent(() => import('@/components/SearchHistoryModal.vue'))
const KeyboardHelpPanel = defineAsyncComponent(() => import('@/components/KeyboardHelpPanel.vue'))
const ImageViewer = defineAsyncComponent(() => import('@/components/ImageViewer.vue'))
const UpdateToast = defineAsyncComponent(() => import('@/components/UpdateToast.vue'))

import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

// 启用全局快捷键
useKeyboardShortcuts()

const searchStore = useSearchStore()
const uiStore = useUIStore()
const settingsStore = useSettingsStore()
const searchHeaderRef = ref<InstanceType<typeof SearchHeader> | null>(null)

// 背景图片管理
const {
  currentImageUrl: randomImageUrl,
  currentBgKey,
  hasBackgroundImage,
  backgroundImageUrl,
  kenBurnsClass,
  init: initBackground,
  destroy: destroyBackground,
} = useBackgroundImage()

// 切换设置面板（互斥）
function openSettings() {
  uiStore.toggleSettingsModal()
}

// 处理 SW 更新
function handleSwUpdate() {
  // SW 更新逻辑由 main.ts 的 controllerchange 事件处理
  // 这里只需要关闭提示并发送消息给 SW
  uiStore.setShowUpdateToast(false)
  navigator.serviceWorker.controller?.postMessage({ type: 'SKIP_WAITING' })
}

// 处理历史记录选择
function handleHistorySelect(item: { query: string; mode: 'game' | 'patch' }) {
  // 同步设置 store（用于其他地方读取）
  searchStore.setSearchQuery(item.query)
  searchStore.setSearchMode(item.mode)
  
  // 直接调用 SearchHeader 的搜索方法（会更新 URL 参数）
  searchHeaderRef.value?.searchWithParams(item.query, item.mode)
  
  // 关闭历史模态框
  uiStore.isHistoryModalOpen = false
}

onMounted(async () => {
  // === 关键任务：立即执行 ===
  
  // 初始化 UI Store（恢复持久化状态 + 会话状态）
  uiStore.init()
  
  // URL hash 优先级最高 - 覆盖会话状态
  const hash = window.location.hash
  if (hash.startsWith('#atk-comment-')) {
    // 评论链接：打开评论面板（互斥）
    uiStore.openCommentsModal()
  }

  // 恢复保存的搜索状态
  searchStore.restoreState()
  
  // === 非关键任务：空闲时执行 ===
  
  scheduleIdleTask(() => {
    // 应用自定义 CSS
    if (uiStore.customCSS) {
      applyCustomCSS(uiStore.customCSS)
    }
    
    // 应用自定义 JS
    if (settingsStore.settings.customJS) {
      applyCustomJS(settingsStore.settings.customJS)
    }
    
    // 应用自定义 HTML
    if (settingsStore.settings.customHTML) {
      applyCustomHTML(settingsStore.settings.customHTML)
    }
  }, { timeout: 2000 })
  
  // === 背景图片初始化 ===
  await initBackground()
})

onUnmounted(() => {
  destroyBackground()
})

// 设置相关函数
function saveSettings(customApi: string, newCustomCSS: string) {
  // 保存自定义 API 到 search store
  searchStore.setCustomApi(customApi)
  // 保存自定义 CSS 到 UI store（会自动持久化）
  uiStore.setCustomCSS(newCustomCSS)
  // 同时保存到旧的 localStorage key（兼容性）
  saveCustomCSS(newCustomCSS)
  // 应用到页面
  applyCustomCSS(newCustomCSS)
  // 应用自定义 JS（settingsStore 已在 SettingsModal 中更新）
  applyCustomJS(settingsStore.settings.customJS)
  // 应用自定义 HTML
  applyCustomHTML(settingsStore.settings.customHTML)
}
</script>

<style>
@import "tailwindcss";

/* Tailwind v4: 配置 dark 变体使用 .dark 类 */
@custom-variant dark (&:where(.dark, .dark *));

/* Ken Burns 动画效果 - 使用 CSS 动画实现更流畅的背景切换 */
.ken-burns {
  /* 初始状态 - 稍微放大以便动画有空间 */
  transform-origin: center center;
}

/* 缩放进入 - 从 100% 缓慢放大到 115% */
.kb-zoom-in {
  animation: kb-zoom-in 12s ease-out forwards;
}

@keyframes kb-zoom-in {
  0% { transform: scale(1); }
  100% { transform: scale(1.15); }
}

/* 缩放退出 - 从 115% 缓慢缩小到 100% */
.kb-zoom-out {
  animation: kb-zoom-out 12s ease-out forwards;
}

@keyframes kb-zoom-out {
  0% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* 向左平移 */
.kb-pan-left {
  animation: kb-pan-left 12s ease-out forwards;
}

@keyframes kb-pan-left {
  0% { transform: scale(1.1) translateX(3%); }
  100% { transform: scale(1.1) translateX(-3%); }
}

/* 向右平移 */
.kb-pan-right {
  animation: kb-pan-right 12s ease-out forwards;
}

@keyframes kb-pan-right {
  0% { transform: scale(1.1) translateX(-3%); }
  100% { transform: scale(1.1) translateX(3%); }
}

/* 向上平移 */
.kb-pan-up {
  animation: kb-pan-up 12s ease-out forwards;
}

@keyframes kb-pan-up {
  0% { transform: scale(1.1) translateY(3%); }
  100% { transform: scale(1.1) translateY(-3%); }
}

/* 向下平移 */
.kb-pan-down {
  animation: kb-pan-down 12s ease-out forwards;
}

@keyframes kb-pan-down {
  0% { transform: scale(1.1) translateY(-3%); }
  100% { transform: scale(1.1) translateY(3%); }
}

/* 减少动画偏好 - 禁用 Ken Burns 效果 */
@media (prefers-reduced-motion: reduce) {
  .ken-burns {
    animation: none !important;
    transform: scale(1.05) !important;
  }
}
</style>
