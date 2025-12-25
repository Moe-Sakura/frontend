<template>
  <div class="container mx-auto w-full px-4 sm:px-6 lg:px-8">
    <!-- 上半部分：标题和搜索框 - 底部对齐到视口中心 -->
    <div class="flex flex-col items-center justify-end min-h-[48vh] sm:min-h-[50vh] pb-2">
      <!-- Title - 艳粉主题 -->
      <h1
        class="header-title text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-6 sm:mb-8 animate-fade-in-down
                 text-white
                 drop-shadow-[0_2px_8px_rgba(255,20,147,0.6)]
                 dark:drop-shadow-[0_2px_12px_rgba(255,105,180,0.8)]"
        style="text-shadow: 0 0 30px rgba(255, 20, 147, 0.4), 0 0 60px rgba(255, 105, 180, 0.2);"
      >
        <span class="whitespace-nowrap">Galgame 聚合搜索</span>
      </h1>

      <!-- Search Form -->
      <form
        class="search-form w-full max-w-2xl px-2 sm:px-0 animate-fade-in-up"
        @submit.prevent="triggerSearch"
      >
        <div class="flex flex-col gap-5">
          <!-- Search Input Container - Google 风格 -->
          <div 
            class="search-input-wrapper group relative"
            :class="{ 'is-searching': searchStore.isSearching }"
          >
            <!-- 外层发光效果 -->
            <div 
              class="absolute -inset-0.5 rounded-[1.25rem] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100
                     bg-gradient-to-r from-[#ff1493]/30 via-[#d946ef]/20 to-[#ff69b4]/30
                     blur-lg transition-opacity duration-500"
              :class="{ 'opacity-100': searchStore.isSearching }"
            />
            
            <!-- 输入框容器 -->
            <div class="search-box relative flex items-center rounded-2xl overflow-hidden">
              <!-- 进度填充层 - 输入框本身就是进度条 -->
              <div 
                v-if="searchStore.isSearching"
                class="search-progress-fill absolute inset-0 z-0 pointer-events-none
                       bg-gradient-to-r from-[#ff1493]/20 via-[#d946ef]/15 to-[#ff69b4]/20
                       dark:from-[#ff1493]/25 dark:via-[#d946ef]/20 dark:to-[#ff69b4]/25"
                :style="{ 
                  clipPath: `inset(0 ${100 - (searchStore.searchProgress.total > 0 ? (searchStore.searchProgress.current / searchStore.searchProgress.total) * 100 : 0)}% 0 0)`
                }"
              />
              
              <!-- 搜索图标 / 加载动画 -->
              <div class="absolute left-4 sm:left-5 z-20 pointer-events-none">
                <component
                  :is="searchStore.isSearching ? Loader2 : Search"
                  :size="22"
                  :class="[
                    searchStore.isSearching 
                      ? 'text-[#ff1493] dark:text-[#ff69b4] animate-spin' 
                      : 'text-[#ff1493]/50 dark:text-[#ff69b4]/60 group-hover:text-[#ff1493]/70 dark:group-hover:text-[#ff69b4]/80 group-focus-within:text-[#ff1493] dark:group-focus-within:text-[#ff69b4] group-focus-within:scale-110',
                    'transition-all duration-300'
                  ]"
                />
              </div>
            
              <!-- 输入框 -->
              <input
                v-model="searchQuery"
                type="search"
                :placeholder="searchMode === 'game' ? '搜索游戏...' : '搜索补丁...'"
                :disabled="searchStore.isSearching"
                required
                class="search-input relative z-10 w-full pl-12 sm:pl-14 pr-14 sm:pr-20 py-4 sm:py-5 
                       text-base sm:text-lg rounded-2xl 
                       text-gray-800 dark:text-slate-100 
                       placeholder:text-gray-400/80 dark:placeholder:text-slate-400/70
                     glassmorphism-input
                       transition-all duration-300 outline-none font-medium
                       tracking-wide
                       disabled:cursor-not-allowed"
                :class="{ 'bg-transparent!': searchStore.isSearching }"
                @input="handleTyping"
                @keydown.enter.prevent="triggerSearch"
              />
            
              <!-- 右侧：清除按钮 + 回车提示 / 进度指示 -->
              <div class="absolute right-3 sm:right-4 z-20 flex items-center gap-2">
                <!-- 清除按钮 - 有输入且非搜索时显示 -->
                <button
                  v-if="searchQuery && !searchStore.isSearching"
                  type="button"
                  class="w-6 h-6 flex items-center justify-center rounded-full
                         text-gray-400 hover:text-[#ff1493] dark:hover:text-[#ff69b4]
                         hover:bg-[#ff1493]/10 dark:hover:bg-[#ff69b4]/15
                         transition-all duration-200"
                  @click="clearSearch"
                >
                  <XCircle :size="18" />
                </button>
                
                <!-- 搜索时显示进度 -->
                <span 
                  v-if="searchStore.isSearching"
                  class="text-sm font-bold text-[#ff1493] dark:text-[#ff69b4] tabular-nums"
                >
                  {{ searchStore.searchProgress.current }}/{{ searchStore.searchProgress.total }}
                </span>
                
                <!-- 非搜索时显示回车提示 -->
                <kbd 
                  v-else
                  class="enter-hint inline-flex items-center gap-1 sm:gap-1.5 
                         px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-medium
                         bg-gray-100/80 dark:bg-slate-700/60
                         text-gray-500 dark:text-slate-400
                         border border-gray-200/50 dark:border-slate-600/50
                         group-focus-within:bg-[#ff1493]/10 group-focus-within:text-[#ff1493]
                         dark:group-focus-within:bg-[#ff69b4]/15 dark:group-focus-within:text-[#ff69b4]
                         group-focus-within:border-[#ff1493]/30 dark:group-focus-within:border-[#ff69b4]/30
                         transition-all duration-200"
                >
                  <CornerDownLeft :size="14" />
                  <span class="hidden sm:inline">Enter</span>
                </kbd>
              </div>
            </div>
          </div>

          <!-- Search Mode Selector - WWDC 2025 液态玻璃 -->
          <div class="flex justify-center items-center">
            <div class="mode-switch liquid-mode-switch relative flex p-1.5 rounded-2xl">
              <!-- 液态玻璃高光 -->
              <div class="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                <div class="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-transparent" />
              </div>
              
              <!-- 滑动背景指示器 -->
              <div
                class="mode-indicator absolute top-1.5 bottom-1.5 rounded-xl 
                       bg-gradient-to-r from-[#ff1493] to-[#d946ef]
                       shadow-lg shadow-[#ff1493]/40
                       transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                :style="{
                  left: searchMode === 'game' ? '6px' : 'calc(50% + 0px)',
                  width: 'calc(50% - 6px)'
                }"
              />
              
              <!-- 游戏按钮 -->
              <button
                type="button"
                class="mode-btn relative z-10 px-5 sm:px-7 py-2.5 rounded-xl font-semibold
                       transition-all duration-300 
                       flex items-center gap-2.5 text-sm whitespace-nowrap"
                :class="searchMode === 'game' 
                  ? 'text-white' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-[#ff1493] dark:hover:text-[#ff69b4]'"
                @click="setSearchMode('game')"
              >
                <Gamepad2 
                  :size="18" 
                  :class="searchMode === 'game' ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]' : ''"
                />
                <span>游戏</span>
              </button>
              
              <!-- 补丁按钮 -->
              <button
                type="button"
                class="mode-btn relative z-10 px-5 sm:px-7 py-2.5 rounded-xl font-semibold
                       transition-all duration-300 
                       flex items-center gap-2.5 text-sm whitespace-nowrap"
                :class="searchMode === 'patch' 
                  ? 'text-white' 
                  : 'text-gray-600 dark:text-slate-400 hover:text-[#ff1493] dark:hover:text-[#ff69b4]'"
                @click="setSearchMode('patch')"
              >
                <Wrench 
                  :size="18" 
                  :class="searchMode === 'patch' ? 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]' : ''"
                />
                <span>补丁</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>

    <!-- 下半部分：错误消息 -->
    <div class="flex flex-col items-center pt-3 sm:pt-4">
      <!-- Error Message - 优化的错误提示 -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-2 scale-95"
      >
        <div v-if="searchStore.errorMessage" class="w-full max-w-2xl px-2 sm:px-0 mt-4">
          <div class="error-card">
            <!-- 错误头部 -->
            <div class="flex items-start gap-3">
              <!-- 错误图标 - 根据错误类型显示不同图标 -->
              <div 
                class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                :class="getErrorIconStyle(searchStore.errorMessage).bgClass"
              >
                <component 
                  :is="getErrorIconStyle(searchStore.errorMessage).icon" 
                  :size="22" 
                  class="text-white" 
                />
              </div>
              
              <!-- 错误内容 -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                  <h4 class="text-base font-bold text-red-700 dark:text-red-300">
                    {{ getErrorTitle(searchStore.errorMessage) }}
                  </h4>
                  <!-- 错误码徽章 - 更突出 -->
                  <div class="flex items-center gap-1.5">
                    <span class="px-2 py-0.5 rounded-md text-[11px] font-bold bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-sm">
                      {{ getErrorCodeInfo(searchStore.errorMessage).code }}
                    </span>
                    <span v-if="getErrorCodeInfo(searchStore.errorMessage).httpStatus" class="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400 font-mono">
                      {{ getErrorCodeInfo(searchStore.errorMessage).description }}
                    </span>
                  </div>
                </div>
                <p class="text-sm text-red-600 dark:text-red-400 break-words leading-relaxed">
                  {{ formatErrorMessage(searchStore.errorMessage) }}
                </p>
                
                <!-- 错误详情（如果有） -->
                <div v-if="getErrorDetails(searchStore.errorMessage)" class="mt-2 p-2.5 rounded-lg bg-red-100/50 dark:bg-red-950/40 border border-red-200/50 dark:border-red-800/30">
                  <div class="flex items-start gap-2">
                    <div class="flex-shrink-0 text-[10px] font-mono font-semibold text-red-500 dark:text-red-400 bg-red-200/50 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
                      DETAIL
                    </div>
                    <code class="text-[11px] text-red-600/80 dark:text-red-400/80 font-mono break-all leading-relaxed">
                      {{ getErrorDetails(searchStore.errorMessage) }}
                    </code>
                  </div>
                </div>
              </div>
              
              <!-- 关闭按钮 -->
              <button
                class="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all hover:scale-110"
                @click="searchStore.errorMessage = ''"
              >
                <X :size="18" />
              </button>
            </div>
            
            <!-- 建议操作 -->
            <div class="mt-4 pt-3 border-t border-red-200/30 dark:border-red-800/30 flex flex-wrap items-center gap-2">
              <span class="text-xs text-red-500/80 dark:text-red-400/80 font-medium">快速操作：</span>
              <button
                v-ripple="'rgba(239, 68, 68, 0.3)'"
                class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                :disabled="isSearchLocked"
                @click="triggerSearch"
              >
                <RefreshCw :size="12" :class="{ 'animate-spin': isSearchLocked }" />
                <span>{{ isSearchLocked ? '请稍候...' : '重新搜索' }}</span>
              </button>
              <button
                class="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200/50 dark:border-red-800/30 transition-colors"
                @click="searchStore.errorMessage = ''"
              >
                关闭提示
              </button>
              <a
                href="https://status.searchgal.homes"
                target="_blank"
                rel="noopener noreferrer"
                class="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200/50 dark:border-red-800/30 transition-colors flex items-center gap-1.5"
              >
                <Wifi :size="12" />
                <span>服务状态</span>
              </a>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Usage Notice - 独立于居中区域 - 艳粉主题 -->
    <div class="-mx-4 sm:mx-auto sm:max-w-5xl mt-8 sm:mt-12 animate-fade-in animation-delay-1000">
      <div
        class="usage-notice 
               glassmorphism-card
               rounded-none sm:rounded-3xl 
               shadow-xl shadow-theme-primary/10 dark:shadow-theme-accent/20
               p-4 sm:p-6 lg:p-8"
      >
        <h2
          class="text-xl sm:text-2xl font-bold 
                 bg-gradient-to-r from-[#ff1493] to-[#d946ef] bg-clip-text text-transparent
                 mb-5 sm:mb-6 flex items-center gap-2"
        >
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff1493] to-[#d946ef] flex items-center justify-center shadow-lg shadow-pink-500/30">
            <Info :size="18" class="text-white" />
          </div>
          使用须知
        </h2>
        
        <div class="space-y-4">
          <!-- 重要提示 -->
          <div class="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/30">
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle :size="14" class="text-white" />
              </div>
              <p class="text-sm text-amber-800 dark:text-amber-200">
                如搜索异常请进右上角的<strong class="font-semibold">设置</strong>里尝试切换聚搜 API 后端试试！
              </p>
            </div>
          </div>

          <!-- 使用说明列表 -->
          <div class="grid gap-3 text-sm text-gray-600 dark:text-slate-400">
            <div class="flex items-start gap-2.5">
              <Heart :size="16" class="text-pink-500 flex-shrink-0 mt-0.5" />
              <p>
                本程序纯属<strong class="text-[#ff1493] dark:text-[#ff69b4]">用爱发电</strong>，仅供绅士们交流学习使用，务必请大家<strong class="text-[#ff1493] dark:text-[#ff69b4]">支持正版 Galgame</strong>！让爱与梦想延续！
              </p>
            </div>
            
            <div class="flex items-start gap-2.5">
              <Search :size="16" class="text-cyan-500 flex-shrink-0 mt-0.5" />
              <p>
                本站只做互联网内容的<strong class="text-cyan-600 dark:text-cyan-400">聚合搬运工</strong>，搜索结果均来自第三方站点，下载前请自行判断<strong class="text-cyan-600 dark:text-cyan-400">资源安全性</strong>。
              </p>
            </div>
            
            <div class="flex items-start gap-2.5">
              <Lightbulb :size="16" class="text-yellow-500 flex-shrink-0 mt-0.5" />
              <p>
                搜索时请注意关键词长度！<strong class="text-yellow-600 dark:text-yellow-400">太短</strong>可能搜不全，<strong class="text-yellow-600 dark:text-yellow-400">太长</strong>则可能无法精准匹配。
              </p>
            </div>
            
            <div class="flex items-start gap-2.5">
              <ShieldAlert :size="16" class="text-red-500 flex-shrink-0 mt-0.5" />
              <p>
                每次查询完毕即断开连接，<strong class="text-red-600 dark:text-red-400">严禁爆破或恶意爬取</strong>，做个文明的绅士！
              </p>
            </div>
            
            <div class="flex items-start gap-2.5">
              <Wrench :size="16" class="text-slate-500 flex-shrink-0 mt-0.5" />
              <p>
                万一某个站点挂了，先看看自己的魔法是否到位，也可能是站点维护了，或者咱的<strong class="text-slate-600 dark:text-slate-300">驱动失效</strong>了。
              </p>
            </div>
            
            <div class="flex items-start gap-2.5">
              <ShieldCheck :size="16" class="text-green-500 flex-shrink-0 mt-0.5" />
              <p>
                为了支持各站点长久运营，请关闭<strong class="text-green-600 dark:text-green-400">广告屏蔽插件</strong>或将站点加入白名单。
              </p>
            </div>
            
            <div class="flex items-start gap-2.5">
              <BookOpen :size="16" class="text-indigo-500 flex-shrink-0 mt-0.5" />
              <p>
                游戏介绍数据由
                <a href="https://vndb.org/" target="_blank" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">VNDB</a>
                提供，AI翻译仅供参考。
              </p>
            </div>
          </div>

          <!-- 支持我们 -->
          <div class="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 border border-pink-200/50 dark:border-pink-800/30">
            <div class="flex items-start gap-3">
              <div class="w-6 h-6 rounded-full bg-gradient-to-br from-[#ff1493] to-[#d946ef] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star :size="14" class="text-white" />
              </div>
              <p class="text-sm text-pink-800 dark:text-pink-200">
                如觉得本站好用，请移步
                <a href="https://github.com/Moe-Sakura" target="_blank" class="font-semibold hover:underline">GitHub</a>
                给本项目点个免费的 <strong class="font-semibold">Star</strong> 吧！你的支持就是咱最大的动力 💕
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 友情链接 -->
    <div
      v-if="friendLinks.length > 0"
      class="-mx-4 sm:mx-auto sm:max-w-5xl mt-6 sm:mt-8 animate-fade-in animation-delay-1000"
    >
      <div
        class="glassmorphism-card rounded-none sm:rounded-3xl 
               shadow-xl shadow-theme-primary/10 dark:shadow-theme-accent/20
               p-4 sm:p-6"
      >
        <div class="flex items-center justify-between mb-4">
          <h2
            class="text-lg sm:text-xl font-bold 
                   text-theme-primary dark:text-theme-accent
                   flex items-center gap-2"
          >
            <Link2 :size="18" />
            友情链接
          </h2>
          <a
            href="https://github.com/Moe-Sakura/frontend/edit/dev/src/data/friends.json"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                   text-white bg-gradient-to-r from-[#ff1493] to-[#d946ef]
                   shadow-md shadow-pink-500/20 hover:shadow-lg hover:shadow-pink-500/30
                   transition-all"
          >
            <GitPullRequestArrow :size="14" />
            <span>交换友链</span>
          </a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <a
            v-for="friend in friendLinks"
            :key="friend.url"
            :href="friend.url"
            target="_blank"
            rel="noopener noreferrer"
            class="friend-card group flex items-center gap-3 p-3 rounded-xl
                   bg-white/50 dark:bg-slate-800/50
                   border border-gray-200/50 dark:border-slate-700/50
                   hover:border-[#ff1493]/30 dark:hover:border-[#ff69b4]/30
                   hover:shadow-lg hover:shadow-pink-500/10
                   transition-all duration-300"
          >
            <img
              :src="friend.logo"
              :alt="friend.name"
              class="w-10 h-10 rounded-lg object-cover bg-gray-100 dark:bg-slate-700 flex-shrink-0"
              loading="lazy"
              @error="handleFriendLogoError"
            />
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-gray-800 dark:text-white text-sm group-hover:text-[#ff1493] dark:group-hover:text-[#ff69b4] transition-colors truncate">
                {{ friend.name }}
              </h3>
              <p class="text-xs text-gray-500 dark:text-slate-400 truncate">
                {{ friend.desc }}
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useSearchStore } from '@/stores/search'
import { searchGameStream, fetchVndbData } from '@/api/search'
import { playSwipe, playToggle, playCelebration, playCaution, playType } from '@/composables/useSound'
import { useDebouncedClick } from '@/composables/useDebounce'
import {
  Search,
  AlertCircle,
  Gamepad2,
  Wrench,
  Info,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Server,
  Loader2,
  CornerDownLeft,
  XCircle,
  Link2,
  GitPullRequestArrow,
  AlertTriangle,
  Heart,
  Lightbulb,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  Star,
} from 'lucide-vue-next'
import { getSearchParamsFromURL, updateURLParams, onURLParamsChange } from '@/utils/urlParams'
import { saveSearchHistory } from '@/utils/persistence'

const searchStore = useSearchStore()
const searchQuery = ref('')
const customApi = ref('')
const searchMode = ref<'game' | 'patch'>('game')
let cleanupURLListener: (() => void) | null = null

// 友情链接
import friendsData from '@/data/friends.json'

interface FriendLink {
  name: string
  desc: string
  url: string
  logo: string
}
const friendLinks = ref<FriendLink[]>(friendsData.friends || [])

// 友链 logo 加载失败时的处理
function handleFriendLogoError(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ff1493"><circle cx="12" cy="12" r="10"/></svg>'
}

// 搜索防抖 - 防止 800ms 内重复触发
const { isLocked: isSearchLocked, click: debouncedSearchTrigger } = useDebouncedClick(800)

let isUpdatingFromURL = false

// 从 URL 或 store 恢复搜索参数
onMounted(() => {
  // 优先从 URL 读取参数
  const urlParams = getSearchParamsFromURL()
  
  // URL 参数可以独立生效（mode 和 api 不依赖 s）
  const hasURLParams = urlParams.s || urlParams.mode || urlParams.api
  
  if (hasURLParams) {
    // 从 URL 恢复
    if (urlParams.s) {searchQuery.value = urlParams.s}
    if (urlParams.mode) {searchMode.value = urlParams.mode}
    if (urlParams.api) {customApi.value = urlParams.api}
  } else if (searchStore.searchQuery || searchStore.searchMode !== 'game') {
    // 否则从 store 恢复
    searchQuery.value = searchStore.searchQuery
    searchMode.value = searchStore.searchMode
    customApi.value = searchStore.customApi
    
    // 同步到 URL
    updateURLParams({
      s: searchQuery.value,
      mode: searchMode.value,
      api: customApi.value,
    })
  }
  
  // 监听浏览器前进/后退
  cleanupURLListener = onURLParamsChange((params) => {
    isUpdatingFromURL = true
    
    searchQuery.value = params.s || ''
    searchMode.value = params.mode || 'game'
    customApi.value = params.api || ''
    
    setTimeout(() => {
      isUpdatingFromURL = false
    }, 200)
  })
})

onUnmounted(() => {
  if (cleanupURLListener) {
    cleanupURLListener()
  }
})

// 同步到 store 和 URL
watch([searchQuery, searchMode, customApi], () => {
  searchStore.setSearchQuery(searchQuery.value)
  searchStore.setSearchMode(searchMode.value)
  searchStore.setCustomApi(customApi.value)
  
  // 更新 URL（防止循环更新）
  if (!isUpdatingFromURL) {
    updateURLParams({
      s: searchQuery.value,
      mode: searchMode.value,
      api: customApi.value,
    })
  }
})

// 监听 store 的 customApi 变化（从设置中更新）
watch(() => searchStore.customApi, (newApi) => {
  // 只在不是由本地更新触发时才同步
  if (customApi.value !== newApi) {
    customApi.value = newApi
  }
})

async function handleSearch() {
  if (!searchQuery.value.trim()) {return}

  playSwipe() // 搜索开始音效
  searchStore.clearResults()
  searchStore.isSearching = true
  searchStore.errorMessage = ''

  const searchParams = new URLSearchParams()
  searchParams.set('game', searchQuery.value.trim())
  searchParams.set('mode', searchMode.value)
  if (customApi.value.trim()) {
    searchParams.set('api', customApi.value.trim())
  }

  try {
    await searchGameStream(searchParams, {
      onTotal: (total) => {
        searchStore.searchProgress = { current: 0, total }
      },
      onProgress: (current, total) => {
        searchStore.searchProgress = { current, total }
      },
      onPlatformResult: (data) => {
        const isFirstResult = searchStore.platformResults.size === 0
        searchStore.setPlatformResult(data.name, data)
        
        // 第一个结果出现时滚动到结果区域
        if (isFirstResult) {
          // 使用 requestAnimationFrame + setTimeout 确保 DOM 已更新
          window.requestAnimationFrame(() => {
            setTimeout(() => {
              const resultsEl = document.getElementById('results')
              if (resultsEl) {
                // 计算目标位置：结果区域顶部向上偏移一些，留出空间
                const headerOffset = 80
                const elementPosition = resultsEl.getBoundingClientRect().top
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset
                
                window.scrollTo({
                  top: offsetPosition,
                  behavior: 'smooth',
                })
              }
            }, 50)
          })
        }
      },
      onComplete: () => {
        searchStore.isSearching = false
        playCelebration() // 搜索完成音效
        
        // 保存搜索历史
        const resultCount = searchStore.totalResults
        saveSearchHistory({
          query: searchQuery.value.trim(),
          mode: searchMode.value,
          timestamp: Date.now(),
          resultCount,
        })
      },
      onError: (error) => {
        searchStore.errorMessage = error
        searchStore.isSearching = false
        playCaution() // 错误音效
      },
    })

    // 获取 VNDB 数据
    if (searchMode.value === 'game') {
      const vndbData = await fetchVndbData(searchQuery.value.trim())
      if (vndbData) {
        searchStore.vndbInfo = vndbData
      }
    }
  } catch (error) {
    searchStore.errorMessage =
      error instanceof Error ? error.message : '搜索失败'
    searchStore.isSearching = false
    playCaution() // 错误音效
  }
}

// 打字音效（节流，避免过于频繁）
let lastTypingSound = 0
const TYPING_THROTTLE = 80 // 80ms 节流

function handleTyping() {
  const now = Date.now()
  if (now - lastTypingSound >= TYPING_THROTTLE) {
    playType()
    lastTypingSound = now
  }
}

// 搜索模式切换（带音效）
function setSearchMode(mode: 'game' | 'patch') {
  if (searchMode.value !== mode) {
    playToggle()
    searchMode.value = mode
  }
}

// 格式化错误消息 - 提取用户友好的消息
function formatErrorMessage(error: string): string {
  // 常见错误映射
  const errorMappings: Record<string, string> = {
    'Failed to fetch': '无法连接到服务器，请检查网络连接',
    'Network Error': '网络错误，请检查您的网络连接',
    'timeout': '请求超时，服务器响应过慢',
    'CORS': '跨域请求被阻止，请联系管理员',
    '500': '服务器内部错误，请稍后重试',
    '502': '网关错误，后端服务可能不可用',
    '503': '服务暂时不可用，请稍后重试',
    '504': '网关超时，请稍后重试',
    '404': '请求的资源不存在',
    '403': '访问被拒绝',
    '401': '未授权访问',
    '429': '请求过于频繁，请稍后重试',
  }

  // 检查是否匹配常见错误
  for (const [key, message] of Object.entries(errorMappings)) {
    if (error.toLowerCase().includes(key.toLowerCase())) {
      return message
    }
  }

  // 如果错误消息过长，截断
  if (error.length > 200) {
    return error.substring(0, 200) + '...'
  }

  return error
}

// 获取错误详情（如果有技术细节）
function getErrorDetails(error: string): string | null {
  // 如果错误消息包含技术细节（如 JSON、堆栈等），提取出来
  const technicalPatterns = [
    /\{[\s\S]*\}/,  // JSON
    /Error:[\s\S]*/,  // Error stack
    /at\s+[\w.]+\s+\(/,  // Stack trace
  ]

  for (const pattern of technicalPatterns) {
    const match = error.match(pattern)
    if (match && match[0].length > 50) {
      return match[0].substring(0, 300) + (match[0].length > 300 ? '...' : '')
    }
  }

  return null
}

// 获取错误图标样式
function getErrorIconStyle(error: string): { icon: typeof WifiOff, bgClass: string } {
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('fetch') || errorLower.includes('network') || errorLower.includes('连接')) {
    return { icon: WifiOff, bgClass: 'bg-gradient-to-br from-orange-500 to-red-500 shadow-orange-500/30' }
  }
  if (errorLower.includes('timeout') || errorLower.includes('超时')) {
    return { icon: Clock, bgClass: 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/30' }
  }
  if (errorLower.includes('500') || errorLower.includes('502') || errorLower.includes('503') || errorLower.includes('server')) {
    return { icon: Server, bgClass: 'bg-gradient-to-br from-red-600 to-rose-600 shadow-red-600/30' }
  }
  
  return { icon: AlertCircle, bgClass: 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30' }
}

// 获取错误标题
function getErrorTitle(error: string): string {
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('fetch') || errorLower.includes('network')) {
    return '网络连接失败'
  }
  if (errorLower.includes('timeout') || errorLower.includes('超时')) {
    return '请求超时'
  }
  if (errorLower.includes('500')) {
    return '服务器内部错误'
  }
  if (errorLower.includes('502') || errorLower.includes('503')) {
    return '服务暂时不可用'
  }
  if (errorLower.includes('404')) {
    return '资源不存在'
  }
  if (errorLower.includes('429')) {
    return '请求频率过高'
  }
  
  return '搜索遇到问题'
}

// 获取错误代码和描述
interface ErrorCodeInfo {
  code: string
  httpStatus?: number
  description: string
}

function getErrorCodeInfo(error: string): ErrorCodeInfo {
  const errorLower = error.toLowerCase()
  
  // 尝试提取 HTTP 状态码
  const statusMatch = error.match(/\b(4\d{2}|5\d{2})\b/)
  if (statusMatch) {
    const status = parseInt(statusMatch[1])
    const statusDescriptions: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      405: 'Method Not Allowed',
      408: 'Request Timeout',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    }
    return {
      code: `HTTP ${status}`,
      httpStatus: status,
      description: statusDescriptions[status] || 'Server Error',
    }
  }
  
  if (errorLower.includes('fetch') || errorLower.includes('network') || errorLower.includes('连接')) {
    return { code: 'ERR_NETWORK', description: 'Network Error' }
  }
  if (errorLower.includes('timeout') || errorLower.includes('超时')) {
    return { code: 'ERR_TIMEOUT', description: 'Request Timeout' }
  }
  if (errorLower.includes('cors')) {
    return { code: 'ERR_CORS', description: 'Cross-Origin Blocked' }
  }
  if (errorLower.includes('abort') || errorLower.includes('取消')) {
    return { code: 'ERR_ABORTED', description: 'Request Aborted' }
  }
  if (errorLower.includes('dns') || errorLower.includes('resolve')) {
    return { code: 'ERR_DNS', description: 'DNS Resolution Failed' }
  }
  if (errorLower.includes('ssl') || errorLower.includes('certificate') || errorLower.includes('证书')) {
    return { code: 'ERR_SSL', description: 'SSL Certificate Error' }
  }
  if (errorLower.includes('parse') || errorLower.includes('json') || errorLower.includes('解析')) {
    return { code: 'ERR_PARSE', description: 'Response Parse Error' }
  }
  if (errorLower.includes('stream') || errorLower.includes('流')) {
    return { code: 'ERR_STREAM', description: 'Stream Error' }
  }
  
  return { code: 'ERR_UNKNOWN', description: 'Unknown Error' }
}


// 清除搜索输入
function clearSearch() {
  searchQuery.value = ''
}

// 防抖搜索 - 防止快速连续触发
function triggerSearch() {
  if (isSearchLocked.value || searchStore.isSearching) {
    return
  }
  debouncedSearchTrigger(handleSearch)
}

// 导出给 refresh-search 事件使用
function handleRefreshSearch() {
  if (!searchStore.isSearching && searchQuery.value) {
    triggerSearch()
  }
}

// 监听刷新搜索事件（快捷键 R 触发）
// 处理从历史记录触发的搜索
function handleTriggerSearch(e: Event) {
  const detail = (e as globalThis.CustomEvent).detail as { query: string; mode: 'game' | 'patch' }
  if (detail) {
    searchQuery.value = detail.query
    searchMode.value = detail.mode
    // 延迟触发搜索，确保值已更新
    setTimeout(() => {
      triggerSearch()
    }, 50)
  }
}

onMounted(() => {
  window.addEventListener('refresh-search', handleRefreshSearch)
  window.addEventListener('trigger-search', handleTriggerSearch)
})

onUnmounted(() => {
  window.removeEventListener('refresh-search', handleRefreshSearch)
  window.removeEventListener('trigger-search', handleTriggerSearch)
})

// 暴露方法供父组件调用
function searchWithParams(query: string, mode: 'game' | 'patch') {
  searchQuery.value = query
  searchMode.value = mode
  
  // 手动更新 URL（确保双向绑定）
  updateURLParams({
    s: query,
    mode: mode,
    api: customApi.value,
  })
}

defineExpose({
  searchWithParams,
})
</script>

<style scoped>
/* 动画 */
.animate-fade-in-down {
  animation: fadeInDown 0.6s ease-out;
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}

.animation-delay-1000 {
  animation-delay: 1s;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-10px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(10px);
  }
}

/* 胶囊开关样式 */
.mode-switch-container {
  display: inline-flex;
  position: relative;
}

.mode-slider {
  pointer-events: none;
}

.mode-option {
  min-width: 100px;
  justify-content: center;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .mode-option {
    min-width: 80px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}

/* 错误卡片样式 */
.error-card {
  background: linear-gradient(135deg, rgba(254, 242, 242, 0.95), rgba(254, 226, 226, 0.95));
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 1rem;
  padding: 1rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
  box-shadow:
    0 4px 20px -4px rgba(239, 68, 68, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  animation: errorShake 0.5s ease-out;
}

.dark .error-card {
  background: linear-gradient(135deg, rgba(127, 29, 29, 0.4), rgba(153, 27, 27, 0.3));
  border: 1px solid rgba(239, 68, 68, 0.3);
  box-shadow:
    0 4px 20px -4px rgba(239, 68, 68, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}

.animate-pulse-slow {
  animation: pulseSlow 2s ease-in-out infinite;
}

@keyframes pulseSlow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ============================================
   搜索输入框增强样式
   ============================================ */

/* 搜索输入框 - 隐藏默认的清除按钮和搜索图标 */
.search-input::-webkit-search-cancel-button,
.search-input::-webkit-search-decoration,
.search-input::-webkit-search-results-button,
.search-input::-webkit-search-results-decoration {
  -webkit-appearance: none;
  appearance: none;
}

/* 搜索框容器 - 液态玻璃效果 */
.search-box {
  position: relative;
}

/* 搜索框液态玻璃高光 */
.search-box::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.5) 0%,
    rgba(255, 255, 255, 0.1) 30%,
    transparent 50%
  );
  pointer-events: none;
  z-index: 5;
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.search-input-wrapper:hover .search-box::after,
.search-input-wrapper:focus-within .search-box::after {
  opacity: 1;
}

.dark .search-box::after {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.03) 30%,
    transparent 50%
  );
  opacity: 0.4;
}

.dark .search-input-wrapper:hover .search-box::after,
.dark .search-input-wrapper:focus-within .search-box::after {
  opacity: 0.7;
}

/* 进度填充层 - 输入框即进度条 */
.search-progress-fill {
  transition: clip-path 0.3s ease-out;
}

/* 搜索中状态 - 输入框整体效果 */
.search-input-wrapper.is-searching .search-box {
  box-shadow: 
    0 0 0 2px rgba(255, 20, 147, 0.4),
    0 0 25px rgba(255, 20, 147, 0.2),
    0 0 50px rgba(255, 20, 147, 0.1);
}

.dark .search-input-wrapper.is-searching .search-box {
  box-shadow: 
    0 0 0 2px rgba(255, 105, 180, 0.5),
    0 0 25px rgba(255, 105, 180, 0.25),
    0 0 50px rgba(255, 105, 180, 0.15);
}

/* 搜索中输入框透明背景 */
.search-input-wrapper.is-searching .glassmorphism-input {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
}

/* 搜索框基础背景 - 搜索时显示 */
.search-input-wrapper.is-searching .search-box::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.85) 0%,
    rgba(255, 228, 242, 0.75) 100%
  );
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  z-index: -1;
}

.dark .search-input-wrapper.is-searching .search-box::before {
  background: linear-gradient(
    135deg,
    rgba(30, 41, 59, 0.9) 0%,
    rgba(51, 65, 85, 0.85) 100%
  );
}

/* 模式切换指示器动画 */
.mode-indicator {
  will-change: left, width;
}

/* 模式按钮点击反馈 */
.mode-btn:active {
  transform: scale(0.97);
}

/* 输入框聚焦时的边框动画 */
.search-input-wrapper::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  padding: 2px;
  background: linear-gradient(
    135deg,
    transparent 0%,
    rgba(255, 20, 147, 0.4) 25%,
    rgba(217, 70, 239, 0.4) 50%,
    rgba(255, 105, 180, 0.4) 75%,
    transparent 100%
  );
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.search-input-wrapper:focus-within::after {
  opacity: 1;
  animation: borderRotate 3s linear infinite;
}

@keyframes borderRotate {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 液态玻璃模式切换器 */
.liquid-mode-switch {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.12),
    0 0 20px rgba(255, 20, 147, 0.06),
    inset 0 1px 1px rgba(255, 255, 255, 0.6);
}

.dark .liquid-mode-switch {
  background: rgba(30, 30, 40, 0.4);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.2),
    0 0 20px rgba(255, 105, 180, 0.08),
    inset 0 1px 1px rgba(255, 255, 255, 0.1);
}

/* 模式切换按钮 hover 效果 */
.mode-btn {
  position: relative;
}

.mode-btn::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 0.75rem;
  background: linear-gradient(135deg, rgba(255, 20, 147, 0.1), rgba(217, 70, 239, 0.05));
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.mode-btn:not(.active):hover::after {
  opacity: 1;
}

/* 移动端优化 */
@media (max-width: 640px) {
  .search-input-wrapper {
    /* 确保触摸目标足够大 */
    min-height: 56px;
  }
  
  .mode-switch {
    width: 100%;
    max-width: 280px;
  }
  
  .mode-btn {
    flex: 1;
    justify-content: center;
  }
}

/* 减少动效模式 */
@media (prefers-reduced-motion: reduce) {
  .search-input-wrapper::after,
  .search-btn::before {
    animation: none;
    transition: none;
  }
  
  .mode-indicator {
    transition-duration: 0.1s;
  }
}
</style>
