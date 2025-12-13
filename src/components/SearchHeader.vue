<template>
  <div class="container mx-auto w-full px-4 sm:px-6 lg:px-8">
    <!-- 上半部分：标题和搜索框 - 底部对齐到视口中心 -->
    <div class="flex flex-col items-center justify-end min-h-[48vh] sm:min-h-[50vh] pb-2">
      <!-- Title with gamepad icon and status - 艳粉主题 -->
      <div
        class="header-title flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 animate-fade-in-down"
      >
        <h1
          class="text-3xl sm:text-4xl lg:text-5xl font-bold text-center 
                 text-white
                 drop-shadow-[0_2px_8px_rgba(255,20,147,0.6)]
                 dark:drop-shadow-[0_2px_12px_rgba(255,105,180,0.8)]"
          style="text-shadow: 0 0 30px rgba(255, 20, 147, 0.4), 0 0 60px rgba(255, 105, 180, 0.2);"
        >
          <span class="whitespace-nowrap">Galgame 聚合搜索</span>
        </h1>
        <a
          href="https://status.searchgal.homes"
          target="_blank"
          rel="noopener noreferrer"
          :class="[
            'status-link px-3 sm:px-4 py-1.5 sm:py-2 rounded-full backdrop-blur-md border border-white/30 dark:border-white/20 flex items-center gap-1.5 sm:gap-2 text-white text-sm sm:text-base font-bold hover:scale-105 transition-all duration-300 shadow-md',
            statusOnline === null 
              ? 'bg-gray-500 hover:bg-gray-600 shadow-gray-500/20 hover:shadow-gray-500/30 dark:bg-gray-600 dark:hover:bg-gray-700' 
              : statusOnline
                ? 'bg-green-500 hover:bg-green-600 shadow-green-500/20 hover:shadow-green-500/30 dark:bg-green-600 dark:hover:bg-green-700'
                : 'bg-red-500 hover:bg-red-600 shadow-red-500/20 hover:shadow-red-500/30 dark:bg-red-600 dark:hover:bg-red-700'
          ]"
        >
          <component
            :is="statusOnline === null ? Loader : statusOnline ? CheckCircle : AlertCircle"
            :size="18"
            :class="statusOnline === null ? 'animate-spin' : ''"
          />
          <span>{{ statusOnline === null ? '检测中' : statusOnline ? '正常' : '异常' }}</span>
        </a>
      </div>

      <!-- Search Form -->
      <form
        class="search-form w-full max-w-2xl px-2 sm:px-0 animate-fade-in-up"
        @submit.prevent="triggerSearch"
      >
        <div class="flex flex-col gap-4">
          <!-- Search Input with Button Inside - 使用 Tailwind -->
          <div class="relative">
            <!-- 搜索图标 -->
            <Search
              :size="20"
              class="absolute left-4 top-1/2 -translate-y-1/2 text-theme-primary/60 dark:text-theme-accent/70 pointer-events-none z-10"
            />
            
            <!-- 输入框 -->
            <input
              v-model="searchQuery"
              type="search"
              placeholder="游戏或补丁关键字词*"
              required
              class="w-full pl-12 pr-32 py-4 text-base rounded-2xl 
                     bg-white/70 dark:bg-slate-800/70
                     text-gray-900 dark:text-slate-100 
                     placeholder:text-gray-400 dark:placeholder:text-slate-400 
                     backdrop-blur-xl backdrop-saturate-150
                     border border-white/40 dark:border-slate-700/30
                     shadow-lg shadow-theme-primary/10 dark:shadow-theme-accent/15
                     hover:shadow-xl hover:shadow-theme-primary/15 dark:hover:shadow-theme-accent/20
                     focus:shadow-2xl focus:shadow-theme-primary/20 dark:focus:shadow-theme-accent/25
                     focus:scale-[1.01]
                     transition-all duration-300 outline-none font-medium"
              @keydown.enter.prevent="triggerSearch"
            />
            
            <!-- 搜索按钮 - 内嵌在输入框右侧 -->
            <button
              type="submit"
              :disabled="searchStore.searchDisabled"
              class="absolute right-2 top-1/2 -translate-y-1/2 
                     px-6 py-2.5 rounded-xl
                     bg-gradient-pink text-white font-bold text-sm
                     backdrop-blur-md
                     border border-white/30 dark:border-white/20
                     shadow-md shadow-theme-primary/20
                     hover:shadow-lg hover:shadow-theme-primary/30 hover:scale-105
                     active:scale-95
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-200
                     flex items-center gap-2 z-10"
              @click.prevent="triggerSearch"
            >
              <Search :size="16" />
              <span v-if="!searchStore.isSearching && !isSearchLocked" class="hidden sm:inline">搜索</span>
              <span v-else-if="isSearchLocked && !searchStore.isSearching" class="hidden sm:inline">稍候...</span>
              <span v-else class="hidden sm:inline">{{ searchStore.searchProgress.current }}/{{ searchStore.searchProgress.total }}</span>
            </button>
          </div>

          <!-- Search Mode Selector - 使用 Tailwind 胶囊开关 -->
          <div class="flex justify-center items-center gap-3">
            <div
              class="relative flex p-1.5 rounded-full
                        bg-white/60 dark:bg-slate-700/60
                        backdrop-blur-xl backdrop-saturate-150
                        border border-white/40 dark:border-slate-600/30
                        shadow-lg shadow-theme-primary/10 dark:shadow-theme-accent/15"
            >
              <!-- 滑动背景指示器 -->
              <div
                class="absolute top-1.5 bottom-1.5 rounded-full 
                       bg-gradient-pink
                       shadow-md shadow-theme-primary/30
                       transition-all duration-300 ease-out"
                :style="{
                  left: searchMode === 'game' ? '6px' : 'calc(50% + 2px)',
                  width: 'calc(50% - 8px)'
                }"
              />
              
              <!-- 游戏按钮 -->
              <button
                type="button"
                class="relative z-10 px-6 py-2 rounded-full font-semibold
                       transition-all duration-300 
                       flex items-center gap-2 text-sm whitespace-nowrap"
                :class="searchMode === 'game' 
                  ? 'text-white drop-shadow-md' 
                  : 'text-gray-700 dark:text-slate-300 hover:text-theme-primary dark:hover:text-theme-accent'"
                @click="setSearchMode('game')"
              >
                <Gamepad2 :size="18" />
                <span>游戏</span>
              </button>
              
              <!-- 补丁按钮 -->
              <button
                type="button"
                class="relative z-10 px-6 py-2 rounded-full font-semibold
                       transition-all duration-300 
                       flex items-center gap-2 text-sm whitespace-nowrap"
                :class="searchMode === 'patch' 
                  ? 'text-white drop-shadow-md' 
                  : 'text-gray-700 dark:text-slate-300 hover:text-theme-primary dark:hover:text-theme-accent'"
                @click="setSearchMode('patch')"
              >
                <Wrench :size="18" />
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
    <div class="w-full max-w-5xl mx-auto mt-8 sm:mt-12 px-2 sm:px-0 animate-fade-in animation-delay-1000">
      <div
        class="usage-notice 
               bg-white/75 dark:bg-slate-800/75
               backdrop-blur-xl backdrop-saturate-150 
               rounded-2xl sm:rounded-3xl 
               shadow-xl shadow-theme-primary/10 dark:shadow-theme-accent/20
               p-4 sm:p-6 lg:p-8 
               border border-white/50 dark:border-slate-700/30"
      >
        <h2
          class="text-xl sm:text-2xl font-bold 
                 text-theme-primary dark:text-theme-accent
                 mb-4 sm:mb-6 flex items-center gap-2"
        >
          <Info :size="20" />
          使用须知
        </h2>
        <ul class="space-y-3 sm:space-y-4 text-sm sm:text-base text-gray-700 dark:text-slate-300 leading-relaxed">
          <li>
            • 首先，衷心感谢
            <a
              href="https://saop.cc/"
              target="_blank"
              class="text-theme-primary dark:text-theme-accent hover:underline font-bold
                     hover:text-theme-primary-dark dark:hover:text-theme-accent-light
                     transition-colors duration-200"
            >Asuna</a>
            大佬提供的服务器和技术支持！没有大佬的魔法，咱可跑不起来！
          </li>
          <li>
            • 本程序纯属
            <strong class="text-theme-primary dark:text-theme-accent font-bold">爱发电</strong>，仅供绅士们交流学习使用，务必请大家
            <strong class="text-theme-primary dark:text-theme-accent font-bold">支持正版 Galgame</strong>！入正不亏哦！
          </li>
          <li>
            • 本站只做互联网内容的
            <strong class="text-theme-primary dark:text-theme-accent font-bold">聚合搬运工</strong>，搜索结果均来自第三方站点，下载前请各位自行判断
            <strong class="text-theme-primary dark:text-theme-accent font-bold">资源安全性</strong>，以免翻车。
          </li>
          <li>
            • 搜索结果会显示不同的<strong class="text-theme-primary dark:text-theme-accent font-bold">标签</strong>，帮助你快速了解资源特性：
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium ml-1">
              <CheckCircle :size="10" />直接下载
            </span>
            表示无需登录，
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
              <User :size="10" />需登录
            </span>
            表示需要账号，
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <Rocket :size="10" />不限速
            </span>
            表示高速网盘，
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium">
              <Magnet :size="10" />BT/磁力
            </span>
            表示种子下载等。
          </li>
          <li>
            • 搜索时请注意关键词长度！<strong class="text-theme-primary dark:text-theme-accent font-bold">关键词太短</strong>
            可能搜不全（部分站点只显示首批结果），<strong class="text-theme-primary dark:text-theme-accent font-bold">太长</strong>
            则可能无法精准匹配。建议尝试
            <strong class="text-theme-primary dark:text-theme-accent font-bold">适当的关键词</strong>，效果更佳~
          </li>
          <li>
            •
            本程序每次查询完毕即断开连接，<strong class="text-theme-primary dark:text-theme-accent font-bold">严禁任何形式的爆破或恶意爬取</strong>，做个文明的绅士！
          </li>
          <li>
            •
            万一某个站点搜索挂了，先看看自己的魔法是否到位，也可能是站点维护了，或者咱这边的
            <strong class="text-theme-primary dark:text-theme-accent font-bold">爬虫失效</strong> 了。
          </li>
          <li>
            • 为了支持各 Galgame 站点能长久运营，还请各位把浏览器的
            <strong class="text-theme-primary dark:text-theme-accent font-bold">广告屏蔽插件</strong>
            关掉，或将这些站点加入白名单。大家建站不易，小小的支持也是大大的动力！
          </li>
          <li>
            • 游戏介绍和人物信息数据由
            <a
              href="https://vndb.org/"
              target="_blank"
              class="text-theme-primary dark:text-theme-accent hover:underline font-bold
                     hover:text-theme-primary-dark dark:hover:text-theme-accent-light
                     transition-colors duration-200"
            >VNDB</a>
            提供，由AI大模型翻译，翻译结果不保证准确性，仅作为检索游戏时的参考！
          </li>
          <li>• 郑重呼吁：请务必<strong class="text-theme-primary dark:text-theme-accent font-bold">支持 Galgame 正版</strong>！让爱与梦想延续！</li>
          <li>
            • 如果您觉得咱这小工具好用，请移步
            <a
              href="https://github.com/Moe-Sakura"
              target="_blank"
              class="text-theme-primary dark:text-theme-accent hover:underline font-bold
                     hover:text-theme-primary-dark dark:hover:text-theme-accent-light
                     transition-colors duration-200"
            >GitHub</a>
            给本项目点个免费的
            <strong>Star</strong> 吧，秋梨膏！你的支持就是咱最大的动力，比心~
          </li>
        </ul>

        <!-- 快捷键提示 -->
        <div class="mt-6 pt-5 border-t border-gray-200/50 dark:border-slate-700/50">
          <h3 class="text-base sm:text-lg font-bold text-gray-700 dark:text-slate-200 mb-4 flex items-center gap-2">
            <Keyboard :size="18" class="text-theme-primary dark:text-theme-accent" />
            键盘快捷键
          </h3>
          
          <!-- 导航类 -->
          <div class="mb-4">
            <p class="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">导航</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <div class="shortcut-item">
                <kbd>Esc</kbd>
                <span>关闭面板</span>
              </div>
              <div class="shortcut-item">
                <kbd>H</kbd>
                <span>返回首页</span>
              </div>
              <div class="shortcut-item">
                <kbd>,</kbd>
                <span>设置</span>
              </div>
              <div class="shortcut-item">
                <kbd>C</kbd>
                <span>评论</span>
              </div>
              <div class="shortcut-item">
                <kbd>V</kbd>
                <span>作品介绍</span>
              </div>
              <div class="shortcut-item">
                <kbd>Y</kbd>
                <span>搜索历史</span>
              </div>
              <div class="shortcut-item">
                <kbd>N</kbd>
                <span>站点导航</span>
              </div>
            </div>
          </div>

          <!-- 操作类 -->
          <div class="mb-4">
            <p class="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">操作</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <div class="shortcut-item">
                <kbd>/</kbd>
                <span>聚焦搜索</span>
              </div>
            </div>
          </div>

          <!-- 滚动类 -->
          <div>
            <p class="text-xs font-semibold text-gray-500 dark:text-slate-400 mb-2 uppercase tracking-wide">滚动</p>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              <div class="shortcut-item">
                <kbd>T</kbd>
                <span>回到顶部</span>
              </div>
              <div class="shortcut-item">
                <kbd>[</kbd>
                <span>上一平台</span>
              </div>
              <div class="shortcut-item">
                <kbd>]</kbd>
                <span>下一平台</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useSearchStore } from '@/stores/search'
import { searchGameStream, fetchVndbData } from '@/api/search'
import { playWhoosh, playToggle, playSuccess, playError } from '@/composables/useSound'
import { useDebouncedClick } from '@/composables/useDebounce'
import {
  Search,
  Loader,
  CheckCircle,
  AlertCircle,
  Gamepad2,
  Wrench,
  Info,
  User,
  Rocket,
  Magnet,
  Keyboard,
  X,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  Server,
} from 'lucide-vue-next'
import { getSearchParamsFromURL, updateURLParams, onURLParamsChange } from '@/utils/urlParams'
import { saveSearchHistory } from '@/utils/persistence'

const searchStore = useSearchStore()
const searchQuery = ref('')
const customApi = ref('')
const searchMode = ref<'game' | 'patch'>('game')
const statusOnline = ref<boolean | null>(null) // null=检测中, true=在线, false=离线
let cleanupURLListener: (() => void) | null = null

// 搜索防抖 - 防止 800ms 内重复触发
const { isLocked: isSearchLocked, click: debouncedSearchTrigger } = useDebouncedClick(800)

let isUpdatingFromURL = false
let statusCheckInterval: number | null = null

// 检查状态页面是否在线
async function checkStatus() {
  try {
    const controller = new window.AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时
    
    await fetch('https://status.searchgal.homes', {
      method: 'HEAD',
      mode: 'no-cors', // 避免CORS问题
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    // no-cors模式下，只要请求不报错就认为是在线
    statusOnline.value = true
  } catch (_error) {
    statusOnline.value = false
  }
}

// 从 URL 或 store 恢复搜索参数
onMounted(() => {
  // 立即检查状态
  checkStatus()
  
  // 每30秒检查一次状态
  statusCheckInterval = window.setInterval(() => {
    checkStatus()
  }, 30000)
  
  // 优先从 URL 读取参数
  const urlParams = getSearchParamsFromURL()
  
  if (urlParams.s) {
    searchQuery.value = urlParams.s
    searchMode.value = urlParams.mode || 'game'
    customApi.value = urlParams.api || ''
  } else if (searchStore.searchQuery) {
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
  if (statusCheckInterval) {
    clearInterval(statusCheckInterval)
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

  playWhoosh() // 搜索开始音效
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
          setTimeout(() => {
            const resultsEl = document.getElementById('results')
            if (resultsEl) {
              resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          }, 100)
        }
      },
      onComplete: () => {
        searchStore.isSearching = false
        playSuccess() // 搜索完成音效
        
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
        playError() // 错误音效
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
    playError() // 错误音效
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
  setTimeout(() => {
    triggerSearch()
  }, 50)
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

/* 快捷键样式 */
.shortcut-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 20, 147, 0.05);
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.shortcut-item:hover {
  background: rgba(255, 20, 147, 0.1);
  transform: translateY(-1px);
}

.dark .shortcut-item {
  background: rgba(255, 105, 180, 0.1);
}

.dark .shortcut-item:hover {
  background: rgba(255, 105, 180, 0.15);
}

.shortcut-item kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.75rem;
  padding: 0 0.5rem;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: linear-gradient(135deg, #ff1493, #d946ef);
  border-radius: 0.5rem;
  box-shadow: 
    0 2px 4px rgba(255, 20, 147, 0.3),
    0 1px 0 rgba(255, 255, 255, 0.2) inset;
}

.dark .shortcut-item kbd {
  background: linear-gradient(135deg, #ff69b4, #e879f9);
  box-shadow: 
    0 2px 6px rgba(255, 105, 180, 0.4),
    0 1px 0 rgba(255, 255, 255, 0.15) inset;
}

.shortcut-item span {
  font-size: 0.8125rem;
  color: #6b7280;
  font-weight: 500;
}

.dark .shortcut-item span {
  color: #94a3b8;
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
</style>
