<template>
  <div v-if="searchStore.hasResults" class="w-full px-4 py-8 animate-fade-in">
    <div id="results" class="max-w-4xl mx-auto space-y-6">
      <div
        v-for="[platformName, platformData] in searchStore.platformResults"
        :key="platformName"
        :data-platform="platformName"
        class="result-card bg-white/90 backdrop-blur-md rounded-2xl shadow-lg hover:shadow-2xl transition-all animate-fade-in-up"
        :class="getCardClass(platformData.color)"
      >
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-bold flex items-center gap-2" :class="getTextColor(platformData.color)">
              <i :class="getPlatformIcon(platformData.color)"></i>
              {{ platformData.name }}
              <span
                v-if="getRecommendText(platformData.color)"
                class="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                :class="getChipClass(platformData.color)"
              >
                <i :class="platformData.color === 'red' ? 'fas fa-times-circle' : 'fas fa-star'"></i>
                {{ getRecommendText(platformData.color) }}
              </span>
            </h3>
            <span class="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium flex items-center gap-1">
              <i class="fas fa-hashtag"></i>
              {{ platformData.items.length }}
            </span>
          </div>
          
          <!-- 错误信息 -->
          <div v-if="platformData.error" class="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <i class="fas fa-exclamation-circle text-red-700"></i>
            <span class="text-red-700">{{ platformData.error }}</span>
          </div>
          
          <!-- 搜索结果列表 -->
          <div v-if="paginatedResults(platformData).length > 0" class="results-list space-y-2">
            <div
              v-for="(result, index) in paginatedResults(platformData)"
              :key="index"
              class="result-item p-3 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <div class="flex items-start gap-2">
                <span class="text-gray-400 text-sm mt-0.5">{{ getResultIndex(platformData, index) }}.</span>
                <a
                  :href="result.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:text-blue-800 hover:underline font-medium flex-1"
                >
                  {{ result.title }}
                </a>
              </div>
              <div v-if="result.tags && result.tags.length > 0" class="flex flex-wrap gap-1 mt-2 ml-6">
                <span
                  v-for="(tag, tagIndex) in result.tags"
                  :key="tagIndex"
                  class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- 分页控制 -->
          <div v-if="platformData.items.length > platformData.itemsPerPage" class="pagination mt-6 flex items-center justify-center gap-2">
            <button
              @click="goToPage(platformName, platformData.currentPage - 1)"
              :disabled="platformData.currentPage === 1"
              class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <i class="fas fa-chevron-left"></i>
            </button>
            
            <div class="flex gap-1">
              <button
                v-for="page in getPageNumbers(platformData)"
                :key="page"
                @click="goToPage(platformName, page)"
                :class="[
                  'min-w-10 h-10 px-3 rounded-lg font-medium transition-all',
                  page === platformData.currentPage
                    ? 'bg-pink-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ page }}
              </button>
            </div>
            
            <button
              @click="goToPage(platformName, platformData.currentPage + 1)"
              :disabled="platformData.currentPage === getTotalPages(platformData)"
              class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <i class="fas fa-chevron-right"></i>
            </button>
            
            <span class="ml-2 text-sm text-gray-600">
              第 {{ platformData.currentPage }} / {{ getTotalPages(platformData) }} 页
            </span>
          </div>
          
          <div v-else-if="platformData.items.length === 0" class="no-results text-gray-500 text-center py-4">
            该平台暂无搜索结果
          </div>
        </div>
      </div>
    </div>
    
    <!-- VNDB Info Panel -->
    <div
      v-if="searchStore.vndbInfo"
      class="vndb-panel mt-8 max-w-4xl mx-auto bg-white/90 backdrop-blur-md rounded-2xl shadow-lg p-6 animate-fade-in-up animation-delay-1000"
    >
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
            <i class="fas fa-gamepad text-pink-500"></i>
            {{ searchStore.vndbInfo.mainName }}
          </h2>
          <p v-if="searchStore.vndbInfo.originalTitle" class="text-sm text-gray-500 mb-4">
            原名: {{ searchStore.vndbInfo.originalTitle }}
          </p>
          <div v-if="searchStore.vndbInfo.description" class="text-gray-700 whitespace-pre-line mb-4">
            {{ searchStore.vndbInfo.description }}
          </div>
          <div v-if="searchStore.vndbInfo.play_hours" class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-medium flex items-center gap-1">
              <i class="fas fa-clock"></i>
              {{ searchStore.vndbInfo.book_length }}
            </span>
            <span class="text-sm text-gray-500">
              (约 {{ searchStore.vndbInfo.play_hours }} 小时)
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSearchStore } from '@/stores/search'
import type { PlatformData } from '@/stores/search'

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
    lime: 'border-l-4 border-l-lime-500',
    white: 'border-l-4 border-l-gray-300',
    gold: 'border-l-4 border-l-yellow-500',
    red: 'border-l-4 border-l-red-500'
  }
  return classes[color] || 'border-l-4 border-l-gray-300'
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
    lime: 'fas fa-star',
    white: 'fas fa-circle',
    gold: 'fas fa-dollar-sign',
    red: 'fas fa-times-circle'
  }
  return icons[color] || 'fas fa-circle'
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
    lime: 'bg-green-100 text-green-700',
    gold: 'bg-yellow-100 text-yellow-700',
    red: 'bg-red-100 text-red-700'
  }
  return classes[color] || ''
}
</script>

<style scoped>
.result-card {
  animation-delay: calc(var(--index, 0) * 0.1s);
}

.result-item {
  transition: all 0.2s ease;
}

.result-item:hover {
  transform: translateX(4px);
}

/* Tailwind 动画 */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
