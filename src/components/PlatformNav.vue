<template>
  <Transition
    enter-active-class="transition-all duration-500 ease-out"
    enter-from-class="opacity-0 -translate-x-full"
    enter-to-class="opacity-100 translate-x-0"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 translate-x-0"
    leave-to-class="opacity-0 -translate-x-full"
  >
    <div
      v-if="searchStore.hasResults"
      class="platform-nav hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 z-30"
    >
      <div class="nav-container bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col">
        <div class="nav-header p-4 flex items-center justify-center gap-2 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
          <i class="fas fa-th text-pink-500"></i>
          <span class="font-bold text-sm text-gray-800">站点导航</span>
        </div>
        
        <div class="nav-list overflow-y-auto flex-1">
          <button
            v-for="[platformName, platformData] in searchStore.platformResults"
            :key="platformName"
            @click="scrollToPlatform(platformName)"
            class="nav-item w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 text-left"
            :class="getItemClass(platformData.color)"
          >
            <i :class="getIcon(platformData.color)" class="text-lg"></i>
            <span class="platform-name flex-1 text-sm font-medium text-gray-700">{{ platformName }}</span>
            <span class="count-badge px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
              {{ platformData.items.length }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useSearchStore } from '@/stores/search'

const searchStore = useSearchStore()

function scrollToPlatform(platformName: string) {
  const platformElements = document.querySelectorAll('[data-platform]')
  const targetElement = Array.from(platformElements).find(
    el => el.getAttribute('data-platform') === platformName
  ) as HTMLElement

  if (targetElement) {
    const yOffset = -80
    const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

function getItemClass(color: string) {
  const classes: Record<string, string> = {
    lime: 'item-lime',
    white: 'item-white',
    gold: 'item-gold',
    red: 'item-red'
  }
  return classes[color] || 'item-white'
}

function getIcon(color: string) {
  const icons: Record<string, string> = {
    lime: 'fas fa-star',
    white: 'fas fa-circle',
    gold: 'fas fa-dollar-sign',
    red: 'fas fa-times-circle'
  }
  return icons[color] || 'fas fa-circle'
}
</script>

<style scoped>
.nav-container {
  max-width: 240px;
}

.nav-list {
  max-height: calc(80vh - 60px);
}

.nav-item {
  cursor: pointer;
}

.nav-item.item-lime i {
  color: rgb(132, 204, 22);
}

.nav-item.item-white i {
  color: rgb(156, 163, 175);
}

.nav-item.item-gold i {
  color: rgb(234, 179, 8);
}

.nav-item.item-red i {
  color: rgb(239, 68, 68);
}

/* 自定义滚动条 */
.nav-list::-webkit-scrollbar {
  width: 4px;
}

.nav-list::-webkit-scrollbar-track {
  background: transparent;
}

.nav-list::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 2px;
}

.nav-list::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.7);
}
</style>
