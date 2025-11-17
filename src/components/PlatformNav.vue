<template>
  <Transition name="fade">
    <div
      v-if="searchStore.hasResults"
      class="platform-nav hidden lg:block fixed left-4 top-1/2 -translate-y-1/2 z-30"
    >
      <md-elevated-card class="nav-container">
        <div class="nav-header p-4 flex items-center justify-center gap-2 border-b border-gray-200">
          <md-icon>apps</md-icon>
          <span class="font-bold text-sm">站点导航</span>
        </div>
        
        <md-list class="nav-list">
          <md-list-item
            v-for="[platformName, platformData] in searchStore.platformResults"
            :key="platformName"
            @click="scrollToPlatform(platformName)"
            type="button"
            class="nav-item"
            :class="getItemClass(platformData.color)"
          >
            <md-icon slot="start">{{ getIcon(platformData.color) }}</md-icon>
            <div slot="headline" class="platform-name">{{ platformName }}</div>
            <md-icon slot="end" class="text-xs">
              <md-assist-chip :label="platformData.items.length.toString()" class="count-badge" />
            </md-icon>
          </md-list-item>
        </md-list>
      </md-elevated-card>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch, nextTick } from 'vue'
import { useSearchStore } from '@/stores/search'
import gsap from 'gsap'

const searchStore = useSearchStore()

// 监听搜索结果变化并触发动画
watch(() => searchStore.hasResults, (hasResults: boolean) => {
  if (hasResults) {
    nextTick(() => {
      // GSAP 动画：导航从左侧滑入
      gsap.from('.platform-nav', {
        duration: 0.8,
        x: -100,
        opacity: 0,
        ease: 'back.out(1.7)',
        delay: 0.5
      })
      
      // 导航项逐个淡入
      gsap.from('.nav-item', {
        duration: 0.5,
        x: -20,
        opacity: 0,
        stagger: 0.08,
        ease: 'power2.out',
        delay: 0.8
      })
    })
  }
})

function scrollToPlatform(platformName: string) {
  const platformElements = document.querySelectorAll('[data-platform]')
  const targetElement = Array.from(platformElements).find(
    el => el.getAttribute('data-platform') === platformName
  ) as HTMLElement

  if (targetElement) {
    const yOffset = -80
    const y = targetElement.getBoundingClientRect().top + window.pageYOffset + yOffset
    
    // 使用 GSAP 实现更平滑的滚动动画
    gsap.to(window, {
      duration: 0.8,
      scrollTo: { y, offsetY: 80 },
      ease: 'power2.inOut'
    })
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
    lime: 'star',
    white: 'circle',
    gold: 'attach_money',
    red: 'cancel'
  }
  return icons[color] || 'circle'
}
</script>

<style scoped>
.nav-container {
  --md-elevated-card-container-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.nav-list {
  overflow-y: auto;
  max-height: calc(80vh - 60px);
}

.nav-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.nav-item.item-lime md-icon[slot="start"] {
  color: rgb(132, 204, 22);
}

.nav-item.item-white md-icon[slot="start"] {
  color: rgb(156, 163, 175);
}

.nav-item.item-gold md-icon[slot="start"] {
  color: rgb(234, 179, 8);
}

.nav-item.item-red md-icon[slot="start"] {
  color: rgb(239, 68, 68);
}

.count-badge {
  --md-assist-chip-container-color: rgb(243, 244, 246);
  --md-assist-chip-label-text-color: rgb(75, 85, 99);
  font-size: 0.75rem;
  height: 24px;
}

.platform-name {
  font-size: 0.875rem;
  font-weight: 500;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
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
