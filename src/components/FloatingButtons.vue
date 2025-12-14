<template>
  <div class="floating-buttons fixed bottom-4 sm:bottom-6 right-4 sm:right-6 flex flex-col gap-2 sm:gap-3 z-40">
    <!-- 回到顶部按钮 -->
    <button
      v-show="showScrollToTop"
      v-ripple
      aria-label="回到顶部"
      class="fab-button scroll-top-btn"
      @click="handleScrollToTop"
    >
      <ArrowUp :size="20" />
    </button>

    <!-- 站点导航按钮 -->
    <button
      v-show="searchStore.hasResults"
      v-ripple
      :aria-label="showPlatformNav ? '关闭站点导航' : '打开站点导航'"
      class="fab-button nav-btn"
      :class="{ 'nav-open': showPlatformNav }"
      @click="handleTogglePlatformNav"
    >
      <component :is="showPlatformNav ? X : Grid3x3" :size="20" />
    </button>

    <!-- 作品介绍按钮 -->
    <button
      v-show="searchStore.vndbInfo"
      v-ripple
      :aria-label="uiStore.isVndbPanelOpen ? '关闭作品介绍' : '打开作品介绍'"
      class="fab-button vndb-btn"
      :class="{ 'vndb-open': uiStore.isVndbPanelOpen }"
      @click="handleToggleVndbPanel"
    >
      <component :is="uiStore.isVndbPanelOpen ? X : BookOpen" :size="20" />
    </button>

    <!-- 评论按钮 -->
    <button
      v-ripple
      :aria-label="uiStore.isCommentsModalOpen ? '关闭评论' : '打开评论'"
      class="fab-button comments-btn"
      :class="{ 'comments-open': uiStore.isCommentsModalOpen }"
      @click="handleToggleComments"
    >
      <component :is="uiStore.isCommentsModalOpen ? X : MessageSquare" :size="20" />
    </button>

    <!-- 搜索历史按钮 -->
    <button
      v-ripple
      :aria-label="uiStore.isHistoryModalOpen ? '关闭搜索历史' : '打开搜索历史'"
      class="fab-button history-btn"
      :class="{ 'history-open': uiStore.isHistoryModalOpen }"
      @click="handleToggleHistory"
    >
      <component :is="uiStore.isHistoryModalOpen ? X : History" :size="20" />
    </button>

    <!-- 站点导航面板 - 右下角弹出 -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 scale-90 translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-90 translate-y-2"
    >
      <div
        v-if="showPlatformNav && searchStore.hasResults"
        class="nav-panel fixed z-50 flex flex-col
               bottom-20 right-4 w-72 max-h-[60vh]
               rounded-2xl shadow-2xl shadow-black/20"
      >
        <!-- 标题栏 -->
        <div class="nav-header flex items-center justify-between px-4 py-3 rounded-t-2xl">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff1493] to-[#d946ef] flex items-center justify-center shadow-md shadow-pink-500/30">
              <Grid3x3 :size="16" class="text-white" />
            </div>
            <div>
              <h3 class="font-bold text-sm text-gray-800 dark:text-white">站点导航</h3>
              <p class="text-xs text-gray-500 dark:text-slate-400">{{ totalResults }} 个结果</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-400 dark:text-slate-500">
              {{ searchStore.platformResults.size }} 站点
            </span>
            <button
              class="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-[#ff1493] hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors"
              @click="togglePlatformNav"
            >
              <X :size="16" />
            </button>
          </div>
        </div>
        
        <!-- 平台列表 -->
        <div class="flex-1 overflow-y-auto custom-scrollbar px-2 py-2">
          <button
            v-for="([platformName, platformData], index) in searchStore.platformResults"
            :key="platformName"
            v-ripple
            class="nav-item w-full px-3 py-2.5 mb-1 last:mb-0 flex items-center gap-3 rounded-xl transition-all duration-200"
            :style="{ animationDelay: `${index * 30}ms` }"
            @click="handleScrollToPlatform(platformName)"
          >
            <!-- 平台图标 -->
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md"
              :class="getPlatformIconBg(platformData.color)"
            >
              <component 
                :is="getPlatformIcon(platformData.color)" 
                :size="14"
                class="text-white"
              />
            </div>
            
            <!-- 平台名称 -->
            <span class="flex-1 text-sm font-medium text-gray-700 dark:text-slate-200 truncate text-left">
              {{ platformName }}
            </span>
            
            <!-- 结果数量 -->
            <span class="count-badge text-xs px-2 py-1">
              {{ platformData.items.length }}
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useUIStore } from '@/stores/ui'
import { playClick, playPop } from '@/composables/useSound'
import { throttle } from '@/composables/useDebounce'
import { ArrowUp, X, Grid3x3, BookOpen, MessageSquare, History, Star, Circle, DollarSign, XCircle } from 'lucide-vue-next'
import type { FunctionalComponent } from 'vue'

const searchStore = useSearchStore()
const uiStore = useUIStore()
const showScrollToTop = ref(false)
const showPlatformNav = ref(false)

// 计算总结果数
const totalResults = computed(() => {
  let total = 0
  searchStore.platformResults.forEach((data) => {
    total += data.items.length
  })
  return total
})

// 根据颜色获取对应的图标组件
function getPlatformIcon(color: string): FunctionalComponent {
  const icons: Record<string, FunctionalComponent> = {
    lime: Star,
    white: Circle,
    gold: DollarSign,
    red: XCircle,
  }
  return icons[color] || Circle
}

// 根据颜色获取图标背景类
function getPlatformIconBg(color: string): string {
  const bgs: Record<string, string> = {
    lime: 'bg-gradient-to-br from-lime-500 to-emerald-600 shadow-lime-500/30',
    white: 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-400/30',
    gold: 'bg-gradient-to-br from-yellow-500 to-amber-600 shadow-yellow-500/30',
    red: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30',
  }
  return bgs[color] || 'bg-gradient-to-br from-gray-400 to-gray-500'
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function toggleComments() {
  uiStore.isCommentsModalOpen = !uiStore.isCommentsModalOpen
}

function toggleVndbPanel() {
  uiStore.isVndbPanelOpen = !uiStore.isVndbPanelOpen
}

function toggleHistory() {
  uiStore.isHistoryModalOpen = !uiStore.isHistoryModalOpen
}

function togglePlatformNav() {
  showPlatformNav.value = !showPlatformNav.value
}

// 带音效的操作函数
function handleScrollToTop() {
  playClick()
  scrollToTop()
}

function handleToggleComments() {
  playPop()
  toggleComments()
}

function handleToggleVndbPanel() {
  playPop()
  toggleVndbPanel()
}

function handleToggleHistory() {
  playPop()
  toggleHistory()
}

function handleTogglePlatformNav() {
  playPop()
  togglePlatformNav()
}

function handleScrollToPlatform(platformName: string) {
  playClick()
  scrollToPlatform(platformName)
}

function scrollToPlatform(platformName: string) {
  const platformElements = document.querySelectorAll('[data-platform]')
  const targetElement = Array.from(platformElements).find(
    el => el.getAttribute('data-platform') === platformName,
  ) as HTMLElement

  if (targetElement) {
    const yOffset = -80
    const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
    
    // 滚动后关闭导航
    showPlatformNav.value = false
  }
}

function handleScroll() {
  showScrollToTop.value = window.scrollY > 200
}

// 节流滚动处理 - 每 100ms 最多触发一次
const throttledHandleScroll = throttle(handleScroll, 100)

onMounted(() => {
  window.addEventListener('scroll', throttledHandleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', throttledHandleScroll)
})
</script>

<style>
.fab-button {
  width: 44px;
  height: 44px;
  border-radius: 18px;
  border: 1.5px solid rgba(255, 20, 147, 0.3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  
  /* 液态玻璃效果 + 艳粉阴影 */
  backdrop-filter: blur(15px) saturate(180%);
  -webkit-backdrop-filter: blur(15px) saturate(180%);
  box-shadow: 
    0 6px 20px rgba(255, 20, 147, 0.3),
    0 3px 10px rgba(255, 105, 180, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (min-width: 640px) {
  .fab-button {
    width: 52px;
    height: 52px;
    border-radius: 22px;
    font-size: 22px;
    box-shadow: 
      0 8px 24px rgba(255, 20, 147, 0.35),
      0 4px 12px rgba(255, 105, 180, 0.25),
      0 0 0 1px rgba(255, 255, 255, 0.5) inset;
  }
}

@media (min-width: 1024px) {
  .fab-button {
    width: 56px;
    height: 56px;
    border-radius: 24px;
    font-size: 24px;
  }
}

.fab-button:hover {
  box-shadow: 
    0 12px 36px rgba(255, 20, 147, 0.45),
    0 6px 20px rgba(255, 105, 180, 0.35),
    0 0 40px rgba(255, 20, 147, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.7) inset;
  transform: translateY(-4px) scale(1.08) rotate(5deg);
  border-color: rgba(255, 20, 147, 0.5);
}

.fab-button:active {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 
    0 6px 20px rgba(255, 20, 147, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.4) inset;
}

/* 各按钮特定颜色 - 艳粉主题 */
.scroll-top-btn {
  background: linear-gradient(135deg, rgb(236, 72, 153), rgb(219, 39, 119));
  color: white;
}

.comments-btn {
  background: linear-gradient(135deg, #ff1493, #c71585);
  color: white;
}

.comments-btn.comments-open {
  background: linear-gradient(135deg, rgb(255, 105, 180), rgb(199, 21, 133));
  color: white;
  border-color: rgba(255, 105, 180, 0.5);
}

.history-btn {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.history-btn.history-open {
  background: linear-gradient(135deg, rgb(251, 191, 36), rgb(245, 158, 11));
  color: white;
  border-color: rgba(251, 191, 36, 0.5);
}

.vndb-btn {
  background: linear-gradient(135deg, #d946ef, #c026d3);
  color: white;
}

.vndb-btn.vndb-open {
  background: linear-gradient(135deg, rgb(232, 121, 249), rgb(217, 70, 239));
  color: white;
  border-color: rgba(232, 121, 249, 0.5);
}

.nav-btn {
  background: linear-gradient(135deg, rgb(255, 20, 147), rgb(217, 70, 239));
  color: white;
}

.nav-btn.nav-open {
  background: linear-gradient(135deg, rgb(255, 105, 180), rgb(232, 121, 249));
  color: white;
  border-color: rgba(255, 105, 180, 0.5);
}

.fab-button i {
  transition: transform 0.3s ease;
}

.fab-button:hover i {
  transform: scale(1.1);
}

/* 自定义滚动条 - 艳粉主题 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(255, 20, 147, 0.5), rgba(217, 70, 239, 0.5));
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(255, 20, 147, 0.7), rgba(217, 70, 239, 0.7));
}

/* ============================================
   站点导航面板样式
   ============================================ */

/* 面板容器 - 移动端全屏 / 桌面端左上角 */
/* 站点导航面板 - 右下角弹出 (亮色模式) */
.nav-panel {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 250, 252, 0.98) 100%
  );
  backdrop-filter: blur(40px) saturate(1.5);
  -webkit-backdrop-filter: blur(40px) saturate(1.5);
  border: 1px solid rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

/* 站点导航面板 - 右下角弹出 (暗色模式) */
.dark .nav-panel {
  background: linear-gradient(
    180deg,
    rgba(30, 41, 59, 0.95) 0%,
    rgba(15, 23, 42, 0.98) 100%
  );
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* 标题栏 */
.nav-header {
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.05), rgba(217, 70, 239, 0.05));
  border-bottom: 1px solid rgba(255, 20, 147, 0.1);
}

.dark .nav-header {
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.1), rgba(217, 70, 239, 0.1));
  border-bottom: 1px solid rgba(255, 105, 180, 0.15);
}

/* 导航项 */
.nav-item {
  background: transparent;
  animation: navItemSlideIn 0.3s ease-out both;
}

.nav-item:hover {
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.08), rgba(217, 70, 239, 0.05));
  transform: translateX(4px);
}

.nav-item:active {
  transform: translateX(2px) scale(0.98);
}

.dark .nav-item:hover {
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.15), rgba(217, 70, 239, 0.1));
}

@keyframes navItemSlideIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 数量徽章 */
.count-badge {
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #ff1493, #d946ef);
  border-radius: 0.5rem;
  box-shadow: 0 2px 6px rgba(255, 20, 147, 0.3);
}

.dark .count-badge {
  background: linear-gradient(135deg, #ff69b4, #e879f9);
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.4);
}

/* 底部栏 */
</style>

