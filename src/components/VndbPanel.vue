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
      class="glassmorphism-panel fixed inset-x-2 bottom-20 sm:inset-x-auto sm:bottom-24 sm:right-6 sm:w-96 md:w-[28rem] lg:w-[32rem] max-h-[75vh] sm:max-h-[80vh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-30"
    >
      <!-- 标题栏 -->
      <div class="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-[#d946ef] to-[#ff1493] text-white">
        <i class="fas fa-book text-lg sm:text-xl" />
        <h3 class="text-base sm:text-lg font-bold flex-1">作品介绍</h3>
        <button
          class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
          @click="closePanel"
        >
          <i class="fas fa-times" />
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="overflow-y-auto max-h-[calc(75vh-56px)] sm:max-h-[calc(80vh-64px)] p-3 sm:p-4 md:p-6 custom-scrollbar">
        <!-- 标题 -->
        <h2 class="text-xl font-bold text-gray-800 dark:text-slate-100 mb-2 flex items-center gap-2">
          <i class="fas fa-gamepad text-[#ff1493]" />
          {{ searchStore.vndbInfo.mainName }}
        </h2>

        <!-- 原名 -->
        <p v-if="searchStore.vndbInfo.originalTitle" class="text-sm text-gray-500 dark:text-slate-400 mb-4">
          原名: {{ searchStore.vndbInfo.originalTitle }}
        </p>

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

        <!-- 别名 -->
        <div v-if="searchStore.vndbInfo.names.length > 1" class="mb-4">
          <p class="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2 flex items-center gap-1">
            <i class="fas fa-tag text-[#d946ef] dark:text-[#e879f9]" />
            <span>别名</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(name, index) in searchStore.vndbInfo.names.slice(0, 5)"
              :key="index"
              class="px-2 py-1 bg-theme-accent/10 dark:bg-theme-accent/30 text-theme-accent dark:text-theme-accent/70 text-xs rounded-full"
            >
              {{ name }}
            </span>
          </div>
        </div>

        <!-- 开发商 -->
        <div v-if="searchStore.vndbInfo.developers && searchStore.vndbInfo.developers.length > 0" class="mb-4">
          <p class="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2 flex items-center gap-1">
            <i class="fas fa-building text-indigo-500 dark:text-indigo-400" />
            <span>开发商</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(dev, index) in searchStore.vndbInfo.developers"
              :key="index"
              class="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full"
            >
              {{ dev }}
            </span>
          </div>
        </div>

        <!-- 平台 -->
        <div v-if="searchStore.vndbInfo.platforms && searchStore.vndbInfo.platforms.length > 0" class="mb-4">
          <p class="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2 flex items-center gap-1">
            <i class="fas fa-desktop text-green-500 dark:text-green-400" />
            <span>平台</span>
          </p>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(platform, index) in searchStore.vndbInfo.platforms"
              :key="index"
              class="px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full"
            >
              {{ formatPlatform(platform) }}
            </span>
          </div>
        </div>

        <!-- 游戏信息卡片 -->
        <div class="mb-4 grid grid-cols-1 gap-3">
          <!-- 游戏时长 -->
          <div v-if="searchStore.vndbInfo.play_hours" class="flex items-center gap-3 p-3 bg-gradient-to-r from-theme-primary/5 to-theme-accent/5 dark:from-theme-primary/10 dark:to-theme-accent/10 rounded-xl border border-theme-primary/20 dark:border-theme-primary/30">
            <div class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-sm">
              <i class="fas fa-clock text-theme-primary dark:text-theme-primary text-lg" />
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
          <div v-if="searchStore.vndbInfo.rating" class="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800/30">
            <div class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-sm">
              <i class="fas fa-star text-yellow-500 dark:text-yellow-400 text-lg" />
            </div>
            <div class="flex-1">
              <p class="text-xs text-gray-500 dark:text-slate-400 mb-0.5">VNDB 评分</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-slate-100">
                {{ (searchStore.vndbInfo.rating / 10).toFixed(2) }} / 10
                <span class="text-xs font-normal text-gray-500 dark:text-slate-400 ml-1">
                  ({{ searchStore.vndbInfo.votecount }} 票)
                </span>
              </p>
            </div>
          </div>

          <!-- 发行日期（如果有） -->
          <div v-if="searchStore.vndbInfo.released" class="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
            <div class="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-lg shadow-sm">
              <i class="fas fa-calendar text-blue-500 dark:text-blue-400 text-lg" />
            </div>
            <div class="flex-1">
              <p class="text-xs text-gray-500 dark:text-slate-400 mb-0.5">发行日期</p>
              <p class="text-sm font-semibold text-gray-800 dark:text-slate-100">
                {{ formatDate(searchStore.vndbInfo.released) }}
              </p>
            </div>
          </div>
        </div>

        <!-- 简介 - 艳粉主题 -->
        <div v-if="searchStore.vndbInfo.description" class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-semibold text-gray-700 dark:text-slate-200">
              <i class="fas fa-align-left text-theme-primary dark:text-theme-primary mr-1" />
              简介:
            </p>
            <button
              v-if="!isTranslating && !translatedDescription"
              class="px-3 py-1.5 text-xs
                     bg-gradient-pink text-white font-bold rounded-full
                     backdrop-blur-sm
                     border border-white/30 dark:border-white/20
                     shadow-md shadow-theme-primary/20 dark:shadow-theme-accent/25
                     hover:shadow-lg hover:shadow-theme-primary/30 dark:hover:shadow-theme-accent/35
                     hover:scale-105
                     active:scale-95
                     transition-all duration-300
                     flex items-center gap-1.5"
              @click="handleTranslate"
            >
              <i class="fas fa-language" />
              <span>AI 翻译</span>
            </button>
            <button
              v-if="translatedDescription && !isTranslating"
              class="px-3 py-1.5 text-xs
                     bg-white/70 dark:bg-slate-700/70 
                     text-theme-primary dark:text-theme-accent font-bold rounded-full
                     backdrop-blur-sm
                     border border-white/40 dark:border-white/30
                     shadow-md shadow-theme-primary/10 dark:shadow-theme-accent/15
                     hover:shadow-lg hover:shadow-theme-primary/20 dark:hover:shadow-theme-accent/25
                     hover:scale-105
                     active:scale-95
                     transition-all duration-300
                     flex items-center gap-1.5"
              @click="showOriginal = !showOriginal"
            >
              <i class="fas fa-exchange-alt" />
              <span>{{ showOriginal ? '显示译文' : '显示原文' }}</span>
            </button>
          </div>
          <div class="text-sm text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-line bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 relative border border-gray-200 dark:border-slate-700">
            <!-- 翻译中 -->
            <div v-if="isTranslating" class="flex flex-col items-center justify-center gap-2 text-theme-accent dark:text-theme-accent py-4">
              <i class="fas fa-spinner fa-spin text-2xl" />
              <span>AI 翻译中，请稍候...</span>
            </div>
            <!-- 翻译失败 -->
            <div v-else-if="translateError" class="flex flex-col items-center justify-center gap-2 text-red-500 dark:text-red-400 py-4">
              <i class="fas fa-exclamation-triangle text-2xl" />
              <span>翻译服务暂时不可用</span>
              <button
                class="mt-2 px-3 py-1 text-xs bg-red-500 dark:bg-red-600 text-white rounded-full hover:bg-red-600 dark:hover:bg-red-700 transition-all"
                @click="handleTranslate"
              >
                <i class="fas fa-redo mr-1" />
                重试
              </button>
            </div>
            <!-- 显示内容 -->
            <template v-else>
              <div v-if="showOriginal || !translatedDescription">
                {{ searchStore.vndbInfo.description }}
              </div>
              <div v-else class="relative">
                <div class="absolute top-0 right-0 px-2 py-0.5 bg-gradient-to-r from-theme-accent to-theme-primary text-white text-xs rounded-bl-lg rounded-tr-lg shadow-sm">
                  <i class="fas fa-robot mr-1" />
                  AI 译文
                </div>
                <div class="pt-6">
                  {{ translatedDescription }}
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 游戏截图画廊 - 显示所有截图（排除 R18） -->
        <div v-if="searchStore.vndbInfo.screenshots && searchStore.vndbInfo.screenshots.length > 0" class="mb-4">
          <div class="grid grid-cols-2 gap-2 sm:gap-3">
            <a
              v-for="(screenshot, index) in searchStore.vndbInfo.screenshots"
              :key="index"
              :href="screenshot"
              data-fancybox="vndb-gallery"
              :data-caption="`${searchStore.vndbInfo.mainName} - 截图 ${index + 1}`"
              class="group relative block overflow-hidden rounded-lg shadow-md hover:shadow-xl transition-all bg-gray-100 dark:bg-slate-700"
            >
              <img
                :src="screenshot"
                :alt="`${searchStore.vndbInfo.mainName} 截图 ${index + 1}`"
                class="w-full h-auto cursor-pointer group-hover:scale-105 group-hover:brightness-90 transition-all duration-300"
                loading="lazy"
                @error="handleImageError"
              />
            </a>
          </div>
        </div>

        <!-- VNDB 链接 - 艳粉主题 -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
          <a
            :href="vndbUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-center gap-2 px-4 py-3
                   bg-gradient-pink text-white font-bold rounded-xl
                   backdrop-blur-md
                   border border-white/30 dark:border-white/20
                   shadow-lg shadow-theme-primary/20 dark:shadow-theme-accent/25
                   hover:shadow-xl hover:shadow-theme-primary/30 dark:hover:shadow-theme-accent/35
                   hover:scale-105
                   active:scale-95
                   transition-all duration-300"
          >
            <i class="fas fa-external-link-alt" />
            <span>在 VNDB 查看详情</span>
          </a>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { translateText } from '@/api/search'

const searchStore = useSearchStore()
const isTranslating = ref(false)
const translatedDescription = ref<string | null>(null)
const showOriginal = ref(false)
const translateError = ref(false)

// 计算 VNDB URL
const vndbUrl = computed(() => {
  if (searchStore.vndbInfo?.id) {
    return `https://vndb.org/${searchStore.vndbInfo.id}`
  }
  return 'https://vndb.org/'
})

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
  if (!dateString) {return '未知'}
  
  // VNDB 日期格式: YYYY-MM-DD
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {return dateString}
  
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
    'x68': 'X68000',
  }
  
  return platformMap[platform] || platform.toUpperCase()
}
</script>

<style scoped>
/* 自定义滚动条 - 亮色模式 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--theme-primary), var(--theme-accent));
  border-radius: 10px;
  transition: background 0.3s ease;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(219, 39, 119), rgb(124, 58, 237));
}

/* 自定义滚动条 - 暗色模式 */
:global(.dark) .custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, var(--theme-accent), var(--theme-accent-dark));
}

:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgb(124, 58, 237), rgb(79, 70, 229));
}
</style>

