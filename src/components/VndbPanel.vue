<template>
  <!-- VNDB 信息面板 - macOS 风格 -->
  <!-- 背景遮罩 -->
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-200"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="uiStore.isVndbPanelOpen && searchStore.vndbInfo"
      class="fixed inset-0 z-40 bg-black/30"
      @click="closePanel"
    />
  </Transition>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-10 scale-[0.98]"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-10 scale-[0.98]"
  >
    <div
      v-if="uiStore.isVndbPanelOpen && searchStore.vndbInfo"
      class="fixed z-50 flex flex-col vndb-page
             top-3 left-2 right-2 bottom-0
             sm:top-6 sm:left-4 sm:right-4 sm:bottom-0
             rounded-t-2xl sm:rounded-t-3xl
             shadow-2xl shadow-black/20"
    >
      <!-- 顶部导航栏 -->
      <div class="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/50 rounded-t-2xl sm:rounded-t-3xl glassmorphism-navbar">
        <!-- 返回按钮 -->
        <button
          class="flex items-center gap-1 text-[#ff1493] dark:text-[#ff69b4] font-medium transition-colors hover:opacity-80"
          @click="closePanel"
        >
          <ChevronLeft :size="24" />
          <span class="text-base">返回</span>
        </button>

        <!-- 标题 -->
        <div class="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <BookOpen :size="20" class="text-[#ff1493] dark:text-[#ff69b4]" />
          <h1 class="text-lg font-bold text-gray-800 dark:text-white">作品介绍</h1>
        </div>

        <!-- VNDB 链接按钮 -->
        <a
          :href="vndbUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-[#ff1493] to-[#d946ef] shadow-lg shadow-pink-500/25 hover:shadow-xl transition-shadow"
        >
          <ExternalLink :size="14" />
          <span class="hidden sm:inline">VNDB</span>
        </a>
      </div>

      <!-- 内容区域 -->
      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <!-- 封面和标题卡片 -->
          <div class="vndb-card">
            <!-- 封面图 -->
            <div v-if="searchStore.vndbInfo.mainImageUrl" class="mb-4">
              <a
                :href="searchStore.vndbInfo.mainImageUrl"
                data-fancybox="vndb-gallery"
                :data-caption="searchStore.vndbInfo.mainName + ' - 游戏封面'"
              >
                <img
                  :src="searchStore.vndbInfo.mainImageUrl"
                  :alt="searchStore.vndbInfo.mainName"
                  class="w-full max-w-sm mx-auto h-auto rounded-2xl shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                  loading="lazy"
                  @error="handleImageError"
                />
              </a>
            </div>

            <!-- 标题 -->
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white text-center mb-2">
              {{ searchStore.vndbInfo.mainName }}
            </h2>

            <!-- 原名 -->
            <p v-if="searchStore.vndbInfo.originalTitle" class="text-sm text-gray-500 dark:text-slate-400 text-center mb-4">
              {{ searchStore.vndbInfo.originalTitle }}
            </p>

            <!-- 别名标签 -->
            <div v-if="searchStore.vndbInfo.names.length > 1" class="flex flex-wrap justify-center gap-2">
              <span
                v-for="(name, index) in searchStore.vndbInfo.names.slice(0, 5)"
                :key="index"
                class="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-[#ff1493] dark:text-[#ff69b4] text-xs rounded-full"
              >
                {{ name }}
              </span>
            </div>
          </div>

          <!-- 信息卡片网格 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- 评分 -->
            <div v-if="searchStore.vndbInfo.rating" class="vndb-card flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Star :size="24" class="text-white" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-slate-400">VNDB 评分</p>
                <p class="text-xl font-bold text-gray-800 dark:text-white">
                  {{ (searchStore.vndbInfo.rating / 10).toFixed(1) }}
                  <span class="text-sm font-normal text-gray-500 dark:text-slate-400">/ 10</span>
                </p>
                <p class="text-xs text-gray-400 dark:text-slate-500">{{ searchStore.vndbInfo.votecount }} 票</p>
              </div>
            </div>

            <!-- 游戏时长 -->
            <div v-if="searchStore.vndbInfo.play_hours" class="vndb-card flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Clock :size="24" class="text-white" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-slate-400">游戏时长</p>
                <p class="text-xl font-bold text-gray-800 dark:text-white">
                  {{ searchStore.vndbInfo.play_hours }}
                  <span class="text-sm font-normal text-gray-500 dark:text-slate-400">小时</span>
                </p>
                <p class="text-xs text-gray-400 dark:text-slate-500">{{ searchStore.vndbInfo.book_length }}</p>
              </div>
            </div>

            <!-- 发行日期 -->
            <div v-if="searchStore.vndbInfo.released" class="vndb-card flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Calendar :size="24" class="text-white" />
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-slate-400">发行日期</p>
                <p class="text-lg font-bold text-gray-800 dark:text-white">
                  {{ formatDate(searchStore.vndbInfo.released) }}
                </p>
              </div>
            </div>

            <!-- 开发商 -->
            <div v-if="searchStore.vndbInfo.developers && searchStore.vndbInfo.developers.length > 0" class="vndb-card flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Building :size="24" class="text-white" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-gray-500 dark:text-slate-400">开发商</p>
                <p class="text-base font-bold text-gray-800 dark:text-white truncate">
                  {{ searchStore.vndbInfo.developers.join(', ') }}
                </p>
              </div>
            </div>
          </div>

          <!-- 平台 -->
          <div v-if="searchStore.vndbInfo.platforms && searchStore.vndbInfo.platforms.length > 0" class="vndb-card">
            <div class="flex items-center gap-2 mb-3">
              <Monitor :size="18" class="text-green-500" />
              <h3 class="font-bold text-gray-800 dark:text-white">支持平台</h3>
            </div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(platform, index) in searchStore.vndbInfo.platforms"
                :key="index"
                class="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-xl"
              >
                {{ formatPlatform(platform) }}
              </span>
            </div>
          </div>

          <!-- 简介 -->
          <div v-if="searchStore.vndbInfo.description" class="vndb-card">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <AlignLeft :size="18" class="text-[#ff1493]" />
                <h3 class="font-bold text-gray-800 dark:text-white">简介</h3>
              </div>
              <!-- 翻译按钮 -->
              <button
                v-if="!isTranslating && !translatedDescription"
                class="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-[#ff1493] to-[#d946ef] rounded-full shadow-md hover:shadow-lg transition-all flex items-center gap-1"
                @click="handleTranslate"
              >
                <Languages :size="14" />
                <span>AI 翻译</span>
              </button>
              <button
                v-if="translatedDescription && !isTranslating"
                class="px-3 py-1.5 text-xs font-medium text-[#ff1493] dark:text-[#ff69b4] bg-pink-100 dark:bg-pink-900/30 rounded-full hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors flex items-center gap-1"
                @click="showOriginal = !showOriginal; playToggle()"
              >
                <ArrowLeftRight :size="14" />
                <span>{{ showOriginal ? '显示译文' : '显示原文' }}</span>
              </button>
            </div>

            <!-- 翻译中 -->
            <div v-if="isTranslating" class="flex flex-col items-center justify-center gap-2 text-[#ff1493] py-8">
              <Loader :size="24" class="animate-spin" />
              <span>AI 翻译中，请稍候...</span>
            </div>
            <!-- 翻译失败 -->
            <div v-else-if="translateError" class="flex flex-col items-center justify-center gap-2 text-red-500 py-8">
              <AlertTriangle :size="24" />
              <span>翻译服务暂时不可用</span>
              <button
                class="mt-2 px-3 py-1 text-xs bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-1"
                @click="handleTranslate"
              >
                <RotateCcw :size="12" />
                <span>重试</span>
              </button>
            </div>
            <!-- 显示内容 -->
            <div v-else class="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              <template v-if="showOriginal || !translatedDescription">
                {{ searchStore.vndbInfo.description }}
              </template>
              <template v-else>
                <div class="inline-flex items-center gap-1 px-2 py-0.5 mb-2 bg-gradient-to-r from-[#ff1493] to-[#d946ef] text-white text-xs rounded-full">
                  <Bot :size="12" />
                  <span>AI 译文</span>
                </div>
                <div>{{ translatedDescription }}</div>
              </template>
            </div>
          </div>

          <!-- 游戏截图 -->
          <div v-if="searchStore.vndbInfo.screenshots && searchStore.vndbInfo.screenshots.length > 0" class="vndb-card">
            <div class="flex items-center gap-2 mb-4">
              <Image :size="18" class="text-[#d946ef]" />
              <h3 class="font-bold text-gray-800 dark:text-white">游戏截图</h3>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <a
                v-for="(screenshot, index) in searchStore.vndbInfo.screenshots"
                :key="index"
                :href="screenshot"
                data-fancybox="vndb-gallery"
                :data-caption="`${searchStore.vndbInfo.mainName} - 截图 ${index + 1}`"
                class="group relative block overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all bg-gray-100 dark:bg-slate-700"
              >
                <img
                  :src="screenshot"
                  :alt="`${searchStore.vndbInfo.mainName} 截图 ${index + 1}`"
                  class="w-full h-auto cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  @error="handleImageError"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useUIStore } from '@/stores/ui'
import { translateText } from '@/api/search'
import { lockScroll, unlockScroll } from '@/composables/useScrollLock'
import { playPop, playClick, playSuccess, playError, playToggle } from '@/composables/useSound'
import {
  BookOpen,
  ChevronLeft,
  ExternalLink,
  Star,
  Clock,
  Calendar,
  Building,
  Monitor,
  AlignLeft,
  Languages,
  ArrowLeftRight,
  Loader,
  AlertTriangle,
  RotateCcw,
  Bot,
  Image,
} from 'lucide-vue-next'

const searchStore = useSearchStore()
const uiStore = useUIStore()
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

// 监听打开状态
watch(() => uiStore.isVndbPanelOpen, (isOpen) => {
  if (isOpen) {
    playPop()
    lockScroll()
  } else {
    unlockScroll()
  }
})

async function handleTranslate() {
  if (!searchStore.vndbInfo?.description || isTranslating.value) {
    return
  }

  playClick()
  isTranslating.value = true
  translateError.value = false

  try {
    const translated = await translateText(searchStore.vndbInfo.description)
    if (translated) {
      translatedDescription.value = translated
      showOriginal.value = false
      translateError.value = false
      playSuccess()
    } else {
      translateError.value = true
      playError()
    }
  } catch {
    translateError.value = true
    playError()
  } finally {
    isTranslating.value = false
  }
}

function closePanel() {
  playPop()
  unlockScroll()
  // 关闭面板
  uiStore.isVndbPanelOpen = false
}

// 处理图片加载失败
function handleImageError(event: Event) {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// 格式化日期
function formatDate(dateString: string): string {
  if (!dateString) {return '未知'}
  
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

<style>
/* VNDB 面板 - macOS 风格 (亮色模式) */
.vndb-page {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.92) 0%,
    rgba(248, 250, 252, 0.96) 100%
  );
  backdrop-filter: blur(40px) saturate(1.5);
  -webkit-backdrop-filter: blur(40px) saturate(1.5);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-bottom: none;
}

/* VNDB 面板 - macOS 风格 (暗色模式) */
.dark .vndb-page {
  background: linear-gradient(
    180deg,
    rgba(30, 41, 59, 0.92) 0%,
    rgba(15, 23, 42, 0.96) 100%
  ) !important;
  backdrop-filter: blur(40px) saturate(1.5) !important;
  -webkit-backdrop-filter: blur(40px) saturate(1.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-bottom: none !important;
}

/* VNDB 卡片 - 亮色模式 */
.vndb-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1.25rem;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow:
    0 4px 24px -4px rgba(0, 0, 0, 0.08),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
}

/* VNDB 卡片 - 暗色模式 */
.dark .vndb-card {
  background: rgba(30, 41, 59, 0.8) !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  box-shadow:
    0 4px 24px -4px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset !important;
}

/* 自定义滚动条 */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #ff1493, #d946ef);
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #c71585, #c026d3);
}
</style>
