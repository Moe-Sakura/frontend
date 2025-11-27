<template>
  <div class="floating-buttons fixed bottom-4 sm:bottom-6 right-4 sm:right-6 flex flex-col gap-2 sm:gap-3 z-40">
    <!-- 回到顶部按钮 -->
    <button
      v-show="showScrollToTop"
      aria-label="回到顶部"
      class="fab-button scroll-top-btn"
      @click="scrollToTop"
    >
      <ArrowUp :size="20" />
    </button>

    <!-- 站点导航按钮 -->
    <button
      v-show="searchStore.hasResults"
      :aria-label="showPlatformNav ? '关闭站点导航' : '打开站点导航'"
      class="fab-button nav-btn"
      :class="{ 'nav-open': showPlatformNav }"
      @click="togglePlatformNav"
    >
      <component :is="showPlatformNav ? X : Grid3x3" :size="20" />
    </button>

    <!-- 作品介绍按钮 -->
    <button
      v-show="searchStore.vndbInfo"
      :aria-label="uiStore.isVndbPanelOpen ? '关闭作品介绍' : '打开作品介绍'"
      class="fab-button vndb-btn"
      :class="{ 'vndb-open': uiStore.isVndbPanelOpen }"
      @click="toggleVndbPanel"
    >
      <component :is="uiStore.isVndbPanelOpen ? X : BookOpen" :size="20" />
    </button>

    <!-- 评论按钮 -->
    <button
      :aria-label="uiStore.isCommentsModalOpen ? '关闭评论' : '打开评论'"
      class="fab-button comments-btn"
      :class="{ 'comments-open': uiStore.isCommentsModalOpen }"
      @click="toggleComments"
    >
      <component :is="uiStore.isCommentsModalOpen ? X : MessageSquare" :size="20" />
    </button>

    <!-- 站点导航面板 -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-full"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-full"
    >
      <div
        v-if="showPlatformNav && searchStore.hasResults"
        class="fixed bottom-4 sm:bottom-6 right-16 sm:right-20 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/30 max-h-[70vh] flex flex-col"
        style="width: 200px"
      >
        <div class="p-3 border-b border-gray-200 bg-gradient-to-r from-theme-primary/5 to-theme-accent/5">
          <div class="flex items-center gap-2">
            <Grid3x3 :size="16" class="text-theme-primary" />
            <span class="font-bold text-sm text-gray-800">站点导航</span>
          </div>
        </div>
        
        <div class="overflow-y-auto flex-1 custom-scrollbar">
          <button
            v-for="[platformName, platformData] in searchStore.platformResults"
            :key="platformName"
            class="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 text-left"
            @click="scrollToPlatform(platformName)"
          >
            <component 
              :is="getPlatformIcon(platformData.color)" 
              :size="16"
              :class="getPlatformIconColor(platformData.color)"
            />
            <span class="platform-name flex-1 text-xs font-medium text-gray-700 truncate">{{ platformName }}</span>
            <span class="count-badge px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
              {{ platformData.items.length }}
            </span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useUIStore } from '@/stores/ui'
import { ArrowUp, X, Grid3x3, BookOpen, MessageSquare, Star, Circle, DollarSign, XCircle } from 'lucide-vue-next'
import type { FunctionalComponent } from 'vue'

const searchStore = useSearchStore()
const uiStore = useUIStore()
const showScrollToTop = ref(false)
const showPlatformNav = ref(false)

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

// 根据颜色获取对应的图标颜色类
function getPlatformIconColor(color: string): string {
  const colors: Record<string, string> = {
    lime: 'text-lime-600',
    white: 'text-gray-400',
    gold: 'text-yellow-600',
    red: 'text-red-600',
  }
  return colors[color] || 'text-gray-400'
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function toggleComments() {
  uiStore.toggleCommentsModal()
}

function toggleVndbPanel() {
  uiStore.toggleVndbPanel()
}

function togglePlatformNav() {
  showPlatformNav.value = !showPlatformNav.value
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
    
    // 滚动后关闭导航（如果不想自动关闭，可以注释掉下面这行）
    showPlatformNav.value = false
  }
}

function handleScroll() {
  showScrollToTop.value = window.scrollY > 200
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
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
</style>
