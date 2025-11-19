<template>
  <!-- VNDB 作品介绍面板 -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-x-full"
    enter-to-class="opacity-100 translate-x-0"
    leave-active-class="transition-all duration-300 ease-in"
    leave-from-class="opacity-100 translate-x-0"
    leave-to-class="opacity-0 translate-x-full"
  >
    <div
      v-if="searchStore.isVndbPanelOpen && searchStore.vndbInfo"
      class="fixed inset-x-2 bottom-20 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-96 md:w-[28rem] lg:w-[32rem] max-h-[75vh] sm:max-h-[80vh] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-30 border border-white/30 dark:border-slate-700/50"
    >
      <!-- 标题栏 -->
      <div class="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <i class="fas fa-book text-lg sm:text-xl"></i>
        <h3 class="text-base sm:text-lg font-bold flex-1">作品介绍</h3>
        <button
          @click="closePanel"
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="overflow-y-auto max-h-[calc(75vh-56px)] sm:max-h-[calc(80vh-64px)] p-3 sm:p-4 md:p-6 custom-scrollbar">
        <!-- 游戏截图 - 使用 Fancybox 支持点击放大 -->
        <div v-if="searchStore.vndbInfo.screenshotUrl" class="mb-4">
          <a
            :href="searchStore.vndbInfo.screenshotUrl"
            data-fancybox="vndb-gallery"
            :data-caption="searchStore.vndbInfo.mainName + ' - 游戏截图'"
          >
            <img
              :src="searchStore.vndbInfo.screenshotUrl"
              :alt="searchStore.vndbInfo.mainName + ' 截图'"
              class="w-full h-auto rounded-xl shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              @error="handleImageError"
            />
          </a>
        </div>
        
        <!-- 封面图 - 使用 Fancybox 支持点击放大 -->
        <div v-if="searchStore.vndbInfo.mainImageUrl" class="mb-4">
          <a
            :href="searchStore.vndbInfo.mainImageUrl"
            data-fancybox="vndb-gallery"
            :data-caption="searchStore.vndbInfo.mainName + ' - 游戏封面'"
          >
            <img
              :src="searchStore.vndbInfo.mainImageUrl"
              :alt="searchStore.vndbInfo.mainName"
              class="w-full h-auto rounded-xl shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
              loading="lazy"
              @error="handleImageError"
            />
          </a>
        </div>

        <!-- 无图片占位符 -->
        <div v-if="!searchStore.vndbInfo.screenshotUrl && !searchStore.vndbInfo.mainImageUrl" class="mb-4 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-12">
          <div class="text-center text-gray-400">
            <i class="fas fa-image text-4xl mb-2"></i>
            <p class="text-sm">暂无游戏图片</p>
          </div>
        </div>

        <!-- 标题 -->
        <h2 class="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2 flex items-center gap-2">
          <i class="fas fa-gamepad text-pink-500"></i>
          {{ searchStore.vndbInfo.mainName }}
        </h2>

        <!-- 原名 -->
        <p v-if="searchStore.vndbInfo.originalTitle" class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          原名: {{ searchStore.vndbInfo.originalTitle }}
        </p>

        <!-- 别名 -->
        <div v-if="searchStore.vndbInfo.names.length > 1" class="mb-4">
          <p class="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2 flex items-center gap-1">
            <i class="fas fa-tag text-purple-500"></i>
            <span>别名</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(name, index) in searchStore.vndbInfo.names.slice(0, 5)"
              :key="index"
              class="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
            >
              {{ name }}
            </span>
          </div>
        </div>

        <!-- 开发商 -->
        <div v-if="searchStore.vndbInfo.developers && searchStore.vndbInfo.developers.length > 0" class="mb-4">
          <p class="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2 flex items-center gap-1">
            <i class="fas fa-building text-indigo-500"></i>
            <span>开发商</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(dev, index) in searchStore.vndbInfo.developers"
              :key="index"
              class="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full"
            >
              {{ dev }}
            </span>
          </div>
        </div>

        <!-- 平台 -->
        <div v-if="searchStore.vndbInfo.platforms && searchStore.vndbInfo.platforms.length > 0" class="mb-4">
          <p class="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2 flex items-center gap-1">
            <i class="fas fa-desktop text-green-500"></i>
            <span>平台</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(platform, index) in searchStore.vndbInfo.platforms"
              :key="index"
              class="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full"
            >
              {{ formatPlatform(platform) }}
            </span>
          </div>
        </div>

        <!-- 游戏信息卡片 -->
        <div class="mb-4 grid grid-cols-1 gap-3">
          <!-- 游戏时长 -->
          <div v-if="searchStore.vndbInfo.play_hours" class="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl">
            <div class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-sm">
              <i class="fas fa-clock text-pink-500 text-lg"></i>
            </div>
            <div class="flex-1">
              <p class="text-xs text-gray-500 dark:text-slate-400 mb-0.5">游戏时长</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-slate-100">
                {{ searchStore.vndbInfo.book_length }}
                <span class="text-xs font-normal text-gray-500 dark:text-slate-400 ml-1">
                  (约 {{ searchStore.vndbInfo.play_hours }} 小时)
                </span>
              </p>
            </div>
          </div>

          <!-- 评分信息（如果有） -->
          <div v-if="searchStore.vndbInfo.rating" class="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
            <div class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-sm">
              <i class="fas fa-star text-yellow-500 text-lg"></i>
            </div>
            <div class="flex-1">
              <p class="text-xs text-gray-500 dark:text-slate-400 mb-0.5">VNDB 评分</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-slate-100">
                {{ searchStore.vndbInfo.rating.toFixed(2) }} / 10
                <span class="text-xs font-normal text-gray-500 dark:text-slate-400 ml-1">
                  ({{ searchStore.vndbInfo.votecount }} 票)
                </span>
              </p>
            </div>
          </div>

          <!-- 发行日期（如果有） -->
          <div v-if="searchStore.vndbInfo.released" class="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
            <div class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-sm">
              <i class="fas fa-calendar text-blue-500 text-lg"></i>
            </div>
            <div class="flex-1">
              <p class="text-xs text-gray-500 dark:text-slate-400 mb-0.5">发行日期</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-slate-100">
                {{ formatDate(searchStore.vndbInfo.released) }}
              </p>
            </div>
          </div>
        </div>

        <!-- 简介 -->
        <div v-if="searchStore.vndbInfo.description" class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-semibold text-gray-700 dark:text-slate-200">
              <i class="fas fa-align-left text-pink-500 mr-1"></i>
              简介:
            </p>
            <button
              v-if="!isTranslating && !translatedDescription"
              @click="handleTranslate"
              class="px-3 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm hover:shadow-md flex items-center gap-1"
            >
              <i class="fas fa-language"></i>
              <span>AI 翻译</span>
            </button>
            <button
              v-if="translatedDescription && !isTranslating"
              @click="showOriginal = !showOriginal"
              class="px-3 py-1 text-xs bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full hover:from-gray-600 hover:to-gray-700 transition-all shadow-sm hover:shadow-md flex items-center gap-1"
            >
              <i class="fas fa-exchange-alt"></i>
              <span>{{ showOriginal ? '显示译文' : '显示原文' }}</span>
            </button>
          </div>
          <div class="text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-gray-50 rounded-xl p-4 relative">
            <!-- 翻译中 -->
            <div v-if="isTranslating" class="flex flex-col items-center justify-center gap-2 text-purple-500 py-4">
              <i class="fas fa-spinner fa-spin text-2xl"></i>
              <span>AI 翻译中，请稍候...</span>
            </div>
            <!-- 翻译失败 -->
            <div v-else-if="translateError" class="flex flex-col items-center justify-center gap-2 text-red-500 py-4">
              <i class="fas fa-exclamation-triangle text-2xl"></i>
              <span>翻译服务暂时不可用</span>
              <button
                @click="handleTranslate"
                class="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
              >
                <i class="fas fa-redo mr-1"></i>
                重试
              </button>
            </div>
            <!-- 显示内容 -->
            <template v-else>
              <div v-if="showOriginal || !translatedDescription">
                {{ searchStore.vndbInfo.description }}
              </div>
              <div v-else class="relative">
                <div class="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-bl-lg rounded-tr-lg shadow-sm">
                  <i class="fas fa-robot mr-1"></i>
                  AI 译文
                </div>
                <div class="pt-6">
                  {{ translatedDescription }}
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- VNDB 链接 -->
        <div class="mt-6 pt-4 border-t border-gray-200">
          <a
            href="https://vndb.org/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
          >
            <i class="fas fa-external-link-alt"></i>
            <span>访问 VNDB 查看更多</span>
          </a>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSearchStore } from '@/stores/search'
import { translateText } from '@/api/search'

const searchStore = useSearchStore()
const isTranslating = ref(false)
const translatedDescription = ref<string | null>(null)
const showOriginal = ref(false)
const translateError = ref(false)

// 监听 vndbInfo 变化，重置翻译状态
watch(() => searchStore.vndbInfo, () => {
  translatedDescription.value = null
  showOriginal.value = false
  isTranslating.value = false
  translateError.value = false
})

async function handleTranslate() {
  if (!searchStore.vndbInfo?.description || isTranslating.value) {
    return
  }

  isTranslating.value = true
  translateError.value = false

  try {
    const translated = await translateText(searchStore.vndbInfo.description)
    if (translated) {
      translatedDescription.value = translated
      showOriginal.value = false
      translateError.value = false
    } else {
      translateError.value = true
    }
  } catch (error) {
    translateError.value = true
  } finally {
    isTranslating.value = false
  }
}

function closePanel() {
  searchStore.toggleVndbPanel()
}

// 处理图片加载失败
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  // 隐藏加载失败的图片
  img.style.display = 'none'
  // 可以选择显示占位符或错误提示
}

// 格式化日期
function formatDate(dateString: string): string {
  if (!dateString) return '未知'
  
  // VNDB 日期格式: YYYY-MM-DD
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  return `${year}年${month}月${day}日`
}

// 格式化平台名称
function formatPlatform(platform: string): string {
  const platformMap: Record<string, string> = {
    'win': 'Windows',
    'lin': 'Linux',
    'mac': 'macOS',
    'web': '网页',
    'and': 'Android',
    'ios': 'iOS',
    'dvd': 'DVD',
    'bdp': 'Blu-ray',
    'dos': 'DOS',
    'ps1': 'PlayStation',
    'ps2': 'PlayStation 2',
    'ps3': 'PlayStation 3',
    'ps4': 'PlayStation 4',
    'ps5': 'PlayStation 5',
    'psp': 'PSP',
    'psv': 'PS Vita',
    'xb1': 'Xbox One',
    'xb3': 'Xbox 360',
    'xbs': 'Xbox Series X/S',
    'swi': 'Nintendo Switch',
    'wii': 'Wii',
    'wiu': 'Wii U',
    'n3d': 'Nintendo 3DS',
    'drc': 'Dreamcast',
    'sfc': 'Super Famicom',
    'fm7': 'FM-7',
    'fm8': 'FM-8',
    'msx': 'MSX',
    'nec': 'PC-98',
    'x68': 'X68000'
  }
  
  return platformMap[platform] || platform.toUpperCase()
}
</script>

<style scoped>
/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgb(236, 72, 153), rgb(139, 92, 246));
  border-radius: 10px;
  transition: background 0.3s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(219, 39, 119), rgb(124, 58, 237));
}
</style>

