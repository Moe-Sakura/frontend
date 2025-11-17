<template>
  <div v-if="searchStore.hasResults" class="w-full px-4 py-8 animate__animated animate__fadeIn">
    <div id="results" class="max-w-4xl mx-auto space-y-6">
      <md-elevated-card
        v-for="[platformName, platformData] in searchStore.platformResults"
        :key="platformName"
        :data-platform="platformName"
        class="result-card"
        :class="getCardClass(platformData.color)"
      >
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold flex items-center gap-2" :class="getTextColor(platformData.color)">
              <md-icon>{{ getPlatformIcon(platformData.color) }}</md-icon>
              {{ platformData.name }}
              <md-assist-chip
                v-if="getRecommendText(platformData.color)"
                :label="getRecommendText(platformData.color)"
                class="recommend-chip"
                :class="getChipClass(platformData.color)"
              >
                <md-icon slot="icon">{{ platformData.color === 'red' ? 'cancel' : 'star' }}</md-icon>
              </md-assist-chip>
            </h3>
            <md-assist-chip :label="platformData.items.length.toString()" class="count-chip">
              <md-icon slot="icon">numbers</md-icon>
            </md-assist-chip>
          </div>
          
          <!-- 错误信息 -->
          <div v-if="platformData.error" class="error-message flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <md-icon class="text-red-700">error</md-icon>
            <span class="text-red-700">{{ platformData.error }}</span>
          </div>
          
          <!-- 搜索结果列表 -->
          <md-list v-if="paginatedResults(platformData).length > 0" class="results-list">
            <md-list-item v-for="(result, index) in paginatedResults(platformData)" :key="index" type="button" class="result-item">
              <div slot="headline" class="flex items-start gap-2">
                <span class="text-gray-400 text-sm">{{ getResultIndex(platformData, index) }}.</span>
                <a
                  :href="result.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:text-blue-800 hover:underline font-medium flex-1"
                >
                  {{ result.title }}
                </a>
              </div>
              <div v-if="result.tags && result.tags.length > 0" slot="supporting-text" class="flex flex-wrap gap-1 mt-1">
                <md-assist-chip
                  v-for="(tag, tagIndex) in result.tags"
                  :key="tagIndex"
                  :label="tag"
                  class="tag-chip"
                />
              </div>
            </md-list-item>
          </md-list>
          
          <!-- 分页控制 -->
          <div v-if="platformData.items.length > platformData.itemsPerPage" class="pagination mt-6 flex items-center justify-center gap-2">
            <md-icon-button
              @click="goToPage(platformName, platformData.currentPage - 1)"
              :disabled="platformData.currentPage === 1"
            >
              <md-icon>chevron_left</md-icon>
            </md-icon-button>
            
            <div class="flex gap-1">
              <md-filled-button
                v-for="page in getPageNumbers(platformData)"
                :key="page"
                @click="goToPage(platformName, page)"
                :class="{ 'active-page': page === platformData.currentPage }"
                size="small"
              >
                {{ page }}
              </md-filled-button>
            </div>
            
            <md-icon-button
              @click="goToPage(platformName, platformData.currentPage + 1)"
              :disabled="platformData.currentPage === getTotalPages(platformData)"
            >
              <md-icon>chevron_right</md-icon>
            </md-icon-button>
            
            <span class="ml-2 text-sm text-gray-600">
              第 {{ platformData.currentPage }} / {{ getTotalPages(platformData) }} 页
            </span>
          </div>
          
          <div v-else-if="platformData.items.length === 0" class="no-results text-gray-500 text-center py-4">
            该平台暂无搜索结果
          </div>
        </div>
      </md-elevated-card>
    </div>
    
    <!-- VNDB Info Panel -->
    <md-elevated-card
      v-if="searchStore.vndbInfo"
      class="vndb-panel mt-8 max-w-4xl mx-auto"
    >
      <div class="p-6">
        <div class="flex flex-col md:flex-row gap-6">
          <div v-if="searchStore.vndbInfo.mainImageUrl" class="flex-shrink-0">
            <img
              :src="searchStore.vndbInfo.mainImageUrl"
              :alt="searchStore.vndbInfo.mainName"
              class="w-48 h-auto rounded-lg shadow-md"
            />
          </div>
          <div class="flex-1">
            <h2 class="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              <md-icon>videogame_asset</md-icon>
              {{ searchStore.vndbInfo.mainName }}
            </h2>
            <p v-if="searchStore.vndbInfo.originalTitle" class="text-sm text-gray-500 mb-4">
              原名: {{ searchStore.vndbInfo.originalTitle }}
            </p>
            <div v-if="searchStore.vndbInfo.description" class="text-gray-700 whitespace-pre-line mb-4">
              {{ searchStore.vndbInfo.description }}
            </div>
            <div v-if="searchStore.vndbInfo.play_hours" class="flex items-center gap-2">
              <md-assist-chip :label="searchStore.vndbInfo.book_length" class="length-chip">
                <md-icon slot="icon">schedule</md-icon>
              </md-assist-chip>
              <span class="text-sm text-gray-500">
                (约 {{ searchStore.vndbInfo.play_hours }} 小时)
              </span>
            </div>
          </div>
        </div>
      </div>
    </md-elevated-card>
  </div>
</template>

<script setup lang="ts">
import { watch, nextTick } from 'vue'
import { useSearchStore } from '@/stores/search'
import type { PlatformData } from '@/stores/search'
import gsap from 'gsap'

const searchStore = useSearchStore()

function paginatedResults(platformData: PlatformData) {
  const start = (platformData.currentPage - 1) * platformData.itemsPerPage
  const end = start + platformData.itemsPerPage
  return platformData.items.slice(start, end)
}

function getTotalPages(platformData: PlatformData) {
  return Math.ceil(platformData.items.length / platformData.itemsPerPage)
}

function getPageNumbers(platformData: PlatformData) {
  const total = getTotalPages(platformData)
  const current = platformData.currentPage
  const pages: number[] = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i)
      pages.push(total)
    } else if (current >= total - 3) {
      pages.push(1)
      for (let i = total - 4; i <= total; i++) pages.push(i)
    } else {
      pages.push(1)
      for (let i = current - 1; i <= current + 1; i++) pages.push(i)
      pages.push(total)
    }
  }
  
  return pages
}

function getResultIndex(platformData: PlatformData, index: number) {
  return (platformData.currentPage - 1) * platformData.itemsPerPage + index + 1
}

function goToPage(platformName: string, page: number) {
  searchStore.setPlatformPage(platformName, page)
  
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

function getCardClass(color: string) {
  const classes: Record<string, string> = {
    lime: 'border-l-lime-500',
    white: 'border-l-gray-300',
    gold: 'border-l-yellow-500',
    red: 'border-l-red-500'
  }
  return `border-l-4 ${classes[color] || 'border-l-gray-300'}`
}

function getTextColor(color: string) {
  const classes: Record<string, string> = {
    lime: 'text-lime-600',
    white: 'text-gray-600',
    gold: 'text-yellow-600',
    red: 'text-red-600'
  }
  return classes[color] || 'text-gray-600'
}

function getPlatformIcon(color: string) {
  const icons: Record<string, string> = {
    lime: 'star',
    white: 'circle',
    gold: 'attach_money',
    red: 'cancel'
  }
  return icons[color] || 'circle'
}

function getRecommendText(color: string) {
  const texts: Record<string, string> = {
    lime: '推荐',
    gold: '付费',
    red: '不推荐'
  }
  return texts[color] || ''
}

function getChipClass(color: string) {
  const classes: Record<string, string> = {
    lime: 'chip-recommend',
    gold: 'chip-paid',
    red: 'chip-not-recommend'
  }
  return classes[color] || ''
}

// 监听搜索结果变化并触发动画
watch(() => searchStore.hasResults, (hasResults: boolean) => {
  if (hasResults) {
    nextTick(() => {
      // 创建时间线动画
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      
      // 结果卡片动画 - 3D 翻转 + 淡入
      tl.from('.result-card', {
        duration: 0.8,
        opacity: 0,
        y: 50,
        rotationX: -10,
        transformPerspective: 1000,
        stagger: {
          amount: 0.6,
          from: 'start',
          ease: 'power2.inOut'
        }
      })
      
      // 卡片内容动画
      .from('.result-card h3', {
        duration: 0.5,
        x: -20,
        opacity: 0,
        stagger: 0.1
      }, '-=0.6')
      
      .from('.result-card md-list-item', {
        duration: 0.4,
        x: -15,
        opacity: 0,
        stagger: {
          amount: 0.3,
          from: 'start'
        }
      }, '-=0.4')
      
      // VNDB 信息面板动画 - 从右侧滑入
      if (searchStore.vndbInfo) {
        tl.from('.vndb-panel', {
          duration: 1,
          opacity: 0,
          x: 50,
          scale: 0.95,
          ease: 'back.out(1.7)'
        }, '-=0.5')
        
        // VNDB 图片动画
        .from('.vndb-panel img', {
          duration: 0.8,
          scale: 0.8,
          opacity: 0,
          rotation: -5,
          ease: 'back.out(1.7)'
        }, '-=0.7')
        
        // VNDB 文字内容动画
        .from('.vndb-panel h2, .vndb-panel p, .vndb-panel div', {
          duration: 0.5,
          y: 20,
          opacity: 0,
          stagger: 0.1,
          ease: 'power2.out'
        }, '-=0.6')
      }
    })
  }
})
</script>

<style scoped>
.result-card {
  --md-elevated-card-container-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.vndb-panel {
  --md-elevated-card-container-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.recommend-chip.chip-recommend {
  --md-assist-chip-container-color: rgb(236, 253, 245);
  --md-assist-chip-label-text-color: rgb(22, 163, 74);
  --md-assist-chip-icon-color: rgb(22, 163, 74);
}

.recommend-chip.chip-paid {
  --md-assist-chip-container-color: rgb(254, 252, 232);
  --md-assist-chip-label-text-color: rgb(202, 138, 4);
  --md-assist-chip-icon-color: rgb(202, 138, 4);
}

.recommend-chip.chip-not-recommend {
  --md-assist-chip-container-color: rgb(254, 242, 242);
  --md-assist-chip-label-text-color: rgb(220, 38, 38);
  --md-assist-chip-icon-color: rgb(220, 38, 38);
}

.count-chip {
  --md-assist-chip-container-color: rgb(243, 244, 246);
  --md-assist-chip-label-text-color: rgb(75, 85, 99);
}

.tag-chip {
  --md-assist-chip-container-color: rgb(243, 244, 246);
  --md-assist-chip-label-text-color: rgb(75, 85, 99);
  font-size: 0.75rem;
}

.length-chip {
  --md-assist-chip-container-color: rgb(243, 244, 246);
  --md-assist-chip-label-text-color: rgb(75, 85, 99);
}

.results-list {
  background: transparent;
}

.result-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.result-item:last-child {
  border-bottom: none;
}

.pagination md-filled-button {
  min-width: 40px;
  --md-filled-button-container-height: 40px;
}

.pagination md-filled-button.active-page {
  --md-filled-button-container-color: var(--md-sys-color-primary);
  --md-filled-button-label-text-color: var(--md-sys-color-on-primary);
}

.pagination md-filled-button:not(.active-page) {
  --md-filled-button-container-color: var(--md-sys-color-surface-variant);
  --md-filled-button-label-text-color: var(--md-sys-color-on-surface-variant);
}
</style>
