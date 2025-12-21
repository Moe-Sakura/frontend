<template>
  <Teleport to="body">
    <!-- VNDB 信息面板 - macOS 风格浮动窗口 -->
    <Transition
      :css="false"
      @enter="onEnter"
      @leave="onLeave"
    >
      <div
        v-if="uiStore.isVndbPanelOpen && searchStore.vndbInfo"
        ref="modalRef"
        :class="[
          'fixed z-50 flex flex-col vndb-page shadow-2xl shadow-black/20',
          isFullscreen 
            ? 'inset-0' 
            : 'inset-0 md:inset-6 md:m-auto md:w-[600px] md:min-w-[400px] md:max-w-[800px] md:h-[500px] md:max-h-[calc(100%-3rem)] md:rounded-3xl'
        ]"
        :style="windowStyle"
      >
        <!-- 调整大小手柄 -->
        <WindowResizeHandles 
          :is-fullscreen="isFullscreen" 
          @resize="handleResize" 
        />
      
        <!-- 顶部导航栏 - 可拖动 -->
        <div 
          :class="[
            'flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 dark:border-slate-700/50 glassmorphism-navbar select-none',
            isFullscreen ? '' : 'md:rounded-t-3xl md:cursor-move'
          ]"
          @mousedown="handleDragStart"
          @touchstart="handleDragStart"
        >
          <!-- 返回按钮 - 移动端 -->
          <button
            class="flex items-center gap-1 text-[#ff1493] dark:text-[#ff69b4] font-medium transition-colors hover:opacity-80 md:hidden"
            @click="closePanel"
          >
            <ChevronLeft :size="24" />
            <span class="text-base">返回</span>
          </button>

          <!-- 标题 -->
          <div class="flex items-center gap-2 md:ml-0">
            <BookOpen :size="20" class="text-[#ff1493] dark:text-[#ff69b4]" />
            <h1 class="text-lg font-bold text-gray-800 dark:text-white">作品介绍</h1>
          </div>

          <!-- 右侧按钮组 -->
          <div class="flex items-center gap-2">
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
          
            <!-- 全屏按钮 - 仅桌面端 -->
            <button
              class="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
              title="全屏"
              @click="handleToggleFullscreen"
            >
              <Maximize2 v-if="!isFullscreen" :size="16" />
              <Minimize2 v-else :size="16" />
            </button>
          
            <!-- 关闭按钮 - 仅桌面端 -->
            <button
              class="hidden md:flex w-8 h-8 rounded-lg items-center justify-center text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              title="关闭"
              @click="closePanel"
            >
              <X :size="16" />
            </button>
          </div>
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
                  <p 
                    v-text-scroll 
                    class="text-base font-bold text-gray-800 dark:text-white"
                  >
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
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { useUIStore } from '@/stores/ui'
import { translateText } from '@/api/search'
import { playClick, playSuccess, playError, playToggle, playTransitionUp, playTransitionDown, playSwipe } from '@/composables/useSound'
import { animate } from '@/composables/useAnime'
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
  Maximize2,
  Minimize2,
  X,
} from 'lucide-vue-next'
import { useWindowManager, type ResizeDirection } from '@/composables/useWindowManager'
import WindowResizeHandles from '@/components/WindowResizeHandles.vue'

// 进入/离开动画
function onEnter(el: Element, done: () => void) {
  animate(el as HTMLElement, {
    opacity: [0, 1],
    scale: [0.98, 1],
    translateY: [40, 0],
    duration: 300,
    ease: 'outCubic',
    complete: done,
  })
}

function onLeave(el: Element, done: () => void) {
  animate(el as HTMLElement, {
    opacity: [1, 0],
    scale: [1, 0.98],
    translateY: [0, 40],
    duration: 200,
    ease: 'inCubic',
    complete: done,
  })
}

const searchStore = useSearchStore()
const uiStore = useUIStore()
const isTranslating = ref(false)
const translatedDescription = ref<string | null>(null)
const showOriginal = ref(false)
const translateError = ref(false)

// 窗口管理
const modalRef = ref<HTMLElement | null>(null)
const { isFullscreen, windowStyle, startDrag, startResize, toggleFullscreen, reset } = useWindowManager({
  minWidth: 400,
  minHeight: 300,
})

function handleDragStart(e: MouseEvent | TouchEvent) {
  if ((e.target as HTMLElement).closest('button, a')) {return}
  if (modalRef.value) {
    startDrag(e, modalRef.value)
  }
}

function handleResize(e: MouseEvent | TouchEvent, direction: ResizeDirection) {
  if (modalRef.value) {
    startResize(e, direction, modalRef.value)
  }
}

// 切换全屏（带音效）
function handleToggleFullscreen() {
  playSwipe()
  toggleFullscreen()
}

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
    playTransitionUp()
  } else {
    reset()
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
  playTransitionDown()
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
/* VNDB 面板 - WWDC 2025 液态玻璃效果 */
.vndb-page {
  background: rgba(255, 255, 255, 0.35);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 0 20px rgba(255, 20, 147, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
  /* 窗口/全屏切换动画 */
  transition: 
    inset 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    min-width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    max-width 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    border-radius 0.35s cubic-bezier(0.4, 0, 0.2, 1),
    margin 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 移动端无底部边框 */
@media (max-width: 767px) {
  .vndb-page {
    border-bottom: none;
  }
}

/* 液态玻璃高光 */
.vndb-page::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 30%,
    transparent 50%
  );
  pointer-events: none;
  z-index: 100;
}

/* VNDB 面板 - 暗色模式 */
.dark .vndb-page {
  background: rgba(30, 30, 40, 0.5);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 -8px 24px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(255, 105, 180, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.1) !important;
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
