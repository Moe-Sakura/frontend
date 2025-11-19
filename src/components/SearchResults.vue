<template>
  <div v-if="searchStore.hasResults" class="w-full px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 animate-fade-in">
    <div id="results" class="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <div
        v-for="[platformName, platformData] in searchStore.platformResults"
        :key="platformName"
        :data-platform="platformName"
        class="result-card bg-white/90 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all animate-fade-in-up"
        :class="getCardClass(platformData.color)"
      >
        <div class="p-3 sm:p-4 md:p-6">
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
            <h3 class="text-lg sm:text-xl font-bold flex items-center gap-2 flex-wrap" :class="getTextColor(platformData.color)">
              <i :class="getPlatformIcon(platformData.color)"></i>
              {{ platformData.name }}
              <span
                v-if="getRecommendText(platformData.color)"
                class="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1"
                :class="getChipClass(platformData.color)"
              >
                <i :class="platformData.color === 'red' ? 'fas fa-times-circle' : 'fas fa-star'"></i>
                {{ getRecommendText(platformData.color) }}
              </span>
            </h3>
            <span class="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium flex items-center gap-1 shrink-0">
              <i class="fas fa-hashtag text-xs"></i>
              {{ platformData.items.length }}
            </span>
          </div>
          
          <!-- 错误信息 -->
          <div v-if="platformData.error" class="flex items-center gap-2 p-4 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <i class="fas fa-exclamation-circle text-red-700"></i>
            <span class="text-red-700">{{ platformData.error }}</span>
          </div>
          
          <!-- 搜索结果列表 -->
          <div v-if="paginatedResults(platformData).length > 0" class="results-list space-y-1 sm:space-y-2">
            <div
              v-for="(result, index) in paginatedResults(platformData)"
              :key="index"
              class="result-item p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
            >
              <div class="flex items-start gap-1.5 sm:gap-2">
                <span class="text-gray-400 text-xs sm:text-sm mt-0.5 shrink-0">{{ getResultIndex(platformData, index) }}.</span>
                <a
                  :href="result.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-600 hover:text-blue-800 hover:underline font-medium flex-1 text-sm sm:text-base break-words"
                >
                  {{ result.title }}
                </a>
              </div>
              <div v-if="result.tags && result.tags.length > 0" class="flex flex-wrap gap-1 mt-1.5 sm:mt-2 ml-4 sm:ml-6">
                <span
                  v-for="(tag, tagIndex) in result.tags"
                  :key="tagIndex"
                  :class="getTagClass(tag)"
                  class="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                >
                  <i :class="getTagIcon(tag)" class="text-[10px]"></i>
                  <span>{{ getTagLabel(tag) }}</span>
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

// 标签样式映射（根据 Cloudflare Workers API 文档）
function getTagClass(tag: string) {
  const classes: Record<string, string> = {
    'NoReq': 'bg-green-100 text-green-700',           // 无需登录/回复
    'Login': 'bg-blue-100 text-blue-700',             // 需登录
    'LoginPay': 'bg-yellow-100 text-yellow-700',      // 需登录且支付
    'LoginRep': 'bg-purple-100 text-purple-700',      // 需登录并回复
    'Rep': 'bg-indigo-100 text-indigo-700',           // 需回复
    'SuDrive': 'bg-pink-100 text-pink-700',           // 自建网盘
    'NoSplDrive': 'bg-emerald-100 text-emerald-700',  // 不限速网盘
    'SplDrive': 'bg-orange-100 text-orange-700',      // 限速网盘
    'MixDrive': 'bg-cyan-100 text-cyan-700',          // 混合网盘
    'BTmag': 'bg-violet-100 text-violet-700',         // BT/磁力
    'magic': 'bg-red-100 text-red-700'                // 需代理
  }
  return classes[tag] || 'bg-gray-100 text-gray-600'
}

// 标签图标映射
function getTagIcon(tag: string) {
  const icons: Record<string, string> = {
    'NoReq': 'fas fa-check-circle',
    'Login': 'fas fa-user',
    'LoginPay': 'fas fa-coins',
    'LoginRep': 'fas fa-comment',
    'Rep': 'fas fa-reply',
    'SuDrive': 'fas fa-server',
    'NoSplDrive': 'fas fa-rocket',
    'SplDrive': 'fas fa-turtle',
    'MixDrive': 'fas fa-layer-group',
    'BTmag': 'fas fa-magnet',
    'magic': 'fas fa-magic'
  }
  return icons[tag] || 'fas fa-tag'
}

// 标签文本映射
function getTagLabel(tag: string) {
  const labels: Record<string, string> = {
    'NoReq': '直接下载',
    'Login': '需登录',
    'LoginPay': '需付费',
    'LoginRep': '登录+回复',
    'Rep': '需回复',
    'SuDrive': '自建盘',
    'NoSplDrive': '不限速',
    'SplDrive': '限速盘',
    'MixDrive': '混合盘',
    'BTmag': 'BT/磁力',
    'magic': '需代理'
  }
  return labels[tag] || tag
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
