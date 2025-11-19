<template>
  <div class="floating-buttons fixed bottom-4 sm:bottom-6 right-4 sm:right-6 flex flex-col gap-2 sm:gap-3 z-40">
    <!-- 回到顶部按钮 -->
    <button
      v-show="showScrollToTop"
      @click="scrollToTop"
      aria-label="回到顶部"
      class="fab-button scroll-top-btn"
    >
      <i class="fas fa-arrow-up"></i>
    </button>

    <!-- 站点导航按钮 -->
    <button
      v-show="searchStore.hasResults"
      @click="togglePlatformNav"
      :aria-label="showPlatformNav ? '关闭站点导航' : '打开站点导航'"
      class="fab-button nav-btn"
      :class="{ 'nav-open': showPlatformNav }"
    >
      <i
        :class="
          showPlatformNav ? 'fas fa-times' : 'fas fa-th'
        "
      ></i>
    </button>

    <!-- 作品介绍按钮 -->
    <button
      v-show="searchStore.vndbInfo"
      @click="toggleVndbPanel"
      :aria-label="searchStore.isVndbPanelOpen ? '关闭作品介绍' : '打开作品介绍'"
      class="fab-button vndb-btn"
      :class="{ 'vndb-open': searchStore.isVndbPanelOpen }"
    >
      <i
        :class="
          searchStore.isVndbPanelOpen ? 'fas fa-times' : 'fas fa-book'
        "
      ></i>
    </button>

    <!-- 评论按钮 -->
    <button
      @click="toggleComments"
      :aria-label="searchStore.isCommentsModalOpen ? '关闭评论' : '打开评论'"
      class="fab-button comments-btn"
      :class="{ 'comments-open': searchStore.isCommentsModalOpen }"
    >
      <i
        :class="
          searchStore.isCommentsModalOpen ? 'fas fa-times' : 'fas fa-comment'
        "
      ></i>
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
        <div class="p-3 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
          <div class="flex items-center gap-2">
            <i class="fas fa-th text-pink-500 text-sm"></i>
            <span class="font-bold text-sm text-gray-800">站点导航</span>
          </div>
        </div>
        
        <div class="overflow-y-auto flex-1 custom-scrollbar">
          <button
            v-for="[platformName, platformData] in searchStore.platformResults"
            :key="platformName"
            @click="scrollToPlatform(platformName)"
            class="w-full px-3 py-2.5 flex items-center gap-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 text-left"
            :class="getItemClass(platformData.color)"
          >
            <i :class="getIcon(platformData.color)" class="text-base"></i>
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
import { ref, onMounted, onUnmounted } from "vue";
import { useSearchStore } from "@/stores/search";

const searchStore = useSearchStore();
const showScrollToTop = ref(false);
const showPlatformNav = ref(false);

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleComments() {
  searchStore.toggleCommentsModal();
}

function toggleVndbPanel() {
  searchStore.toggleVndbPanel();
}

function togglePlatformNav() {
  showPlatformNav.value = !showPlatformNav.value;
}

function scrollToPlatform(platformName: string) {
  const platformElements = document.querySelectorAll('[data-platform]');
  const targetElement = Array.from(platformElements).find(
    el => el.getAttribute('data-platform') === platformName
  ) as HTMLElement;

  if (targetElement) {
    const yOffset = -80;
    const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
    window.scrollTo({ top: y, behavior: 'smooth' });
    // 滚动后关闭导航
    showPlatformNav.value = false;
  }
}

function getItemClass(color: string) {
  const classes: Record<string, string> = {
    lime: 'item-lime',
    white: 'item-white',
    gold: 'item-gold',
    red: 'item-red'
  };
  return classes[color] || 'item-white';
}

function getIcon(color: string) {
  const icons: Record<string, string> = {
    lime: 'fas fa-star',
    white: 'fas fa-circle',
    gold: 'fas fa-dollar-sign',
    red: 'fas fa-times-circle'
  };
  return icons[color] || 'fas fa-circle';
}

function handleScroll() {
  showScrollToTop.value = window.scrollY > 200;
}

onMounted(() => {
  window.addEventListener("scroll", handleScroll);
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener("scroll", handleScroll);
});
</script>

<style scoped>
.fab-button {
  width: 44px;
  height: 44px;
  border-radius: 18px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4), 0 3px 10px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (min-width: 640px) {
  .fab-button {
    width: 52px;
    height: 52px;
    border-radius: 22px;
    font-size: 22px;
    box-shadow: 0 8px 24px rgba(236, 72, 153, 0.4), 0 4px 12px rgba(0, 0, 0, 0.15);
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
  box-shadow: 0 12px 36px rgba(236, 72, 153, 0.5), 0 6px 20px rgba(0, 0, 0, 0.2);
  transform: translateY(-4px) scale(1.08) rotate(5deg);
}

.fab-button:active {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.4);
}

.scroll-top-btn {
  background: linear-gradient(135deg, rgb(99, 102, 241), rgb(79, 70, 229));
  color: white;
}

.comments-btn {
  background: linear-gradient(135deg, rgb(236, 72, 153), rgb(219, 39, 119));
  color: white;
}

.comments-btn.comments-open {
  background: linear-gradient(135deg, rgb(156, 163, 175), rgb(107, 114, 128));
  color: white;
}

.vndb-btn {
  background: linear-gradient(135deg, rgb(139, 92, 246), rgb(124, 58, 237));
  color: white;
}

.vndb-btn.vndb-open {
  background: linear-gradient(135deg, rgb(156, 163, 175), rgb(107, 114, 128));
  color: white;
}

.fab-button i {
  transition: transform 0.3s ease;
}

.fab-button:hover i {
  transform: scale(1.1);
}

.nav-btn {
  background: linear-gradient(135deg, rgb(16, 185, 129), rgb(5, 150, 105));
  color: white;
}

.nav-btn.nav-open {
  background: linear-gradient(135deg, rgb(156, 163, 175), rgb(107, 114, 128));
  color: white;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}

.item-lime i {
  color: rgb(132, 204, 22);
}

.item-white i {
  color: rgb(156, 163, 175);
}

.item-gold i {
  color: rgb(234, 179, 8);
}

.item-red i {
  color: rgb(239, 68, 68);
}
</style>
