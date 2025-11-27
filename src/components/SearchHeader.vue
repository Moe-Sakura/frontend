<template>
  <div class="container mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
    <!-- 主内容区域 - 垂直居中布局 -->
    <div class="flex flex-col items-center justify-center min-h-[65vh] sm:min-h-[70vh]">
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
          <i :class="statusOnline === null ? 'fas fa-spinner fa-spin' : statusOnline ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'" />
          <span>{{ statusOnline === null ? '检测中' : statusOnline ? '正常' : '异常' }}</span>
        </a>
      </div>

      <!-- 搜索历史 -->
      <SearchHistory
        ref="searchHistoryRef"
        class="w-full max-w-2xl px-2 sm:px-0 mb-3 sm:mb-4"
        @select="handleHistorySelect"
      />

      <!-- Search Form -->
      <form
        class="search-form w-full max-w-2xl px-2 sm:px-0 animate-fade-in-up"
        @submit.prevent="handleSearch"
      >
        <div class="flex flex-col gap-4">
          <!-- Search Input with Button Inside - 使用 Tailwind -->
          <div class="relative">
            <!-- 搜索图标 -->
            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-theme-primary/60 dark:text-theme-accent/70 text-xl pointer-events-none z-10" />
            
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
              @keydown.enter.prevent="handleSearch"
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
              @click.prevent="handleSearch"
            >
              <i class="fas fa-search text-sm" />
              <span v-if="!searchStore.isSearching" class="hidden sm:inline">搜索</span>
              <span v-else class="hidden sm:inline">{{ searchStore.searchProgress.current }}/{{ searchStore.searchProgress.total }}</span>
            </button>
          </div>

          <!-- Search Mode Selector - 使用 Tailwind 胶囊开关 -->
          <div class="flex justify-center">
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
                @click="searchMode = 'game'"
              >
                <i class="fas fa-gamepad" />
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
                @click="searchMode = 'patch'"
              >
                <i class="fas fa-tools" />
                <span>补丁</span>
              </button>
            </div>
          </div>
        </div>
      </form>

      <!-- Error Message -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out animate-shake"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="searchStore.errorMessage" class="w-full max-w-2xl px-2 sm:px-0 mt-4">
          <div
            class="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800/50 rounded-2xl p-4 shadow-lg"
          >
            <div class="flex items-center gap-3 text-red-700 dark:text-red-300">
              <i class="fas fa-exclamation-circle text-2xl" />
              <div>
                <strong class="font-bold">错误: </strong>{{ searchStore.errorMessage }}
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Usage Notice - 独立于居中区域 - 艳粉主题 -->
    <div class="w-full max-w-4xl mx-auto mt-8 sm:mt-12 px-2 sm:px-0 animate-fade-in animation-delay-1000">
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
          <i class="fas fa-info-circle" />
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
              <i class="fas fa-check-circle text-[10px]" />直接下载
            </span>
            表示无需登录，
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium">
              <i class="fas fa-user text-[10px]" />需登录
            </span>
            表示需要账号，
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
              <i class="fas fa-rocket text-[10px]" />不限速
            </span>
            表示高速网盘，
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium">
              <i class="fas fa-magnet text-[10px]" />BT/磁力
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useSearchStore } from '@/stores/search'
import { searchGameStream, fetchVndbData } from '@/api/search'
import SearchHistory from './SearchHistory.vue'
import type { SearchHistory as SearchHistoryType } from '@/utils/persistence'
import { getSearchParamsFromURL, updateURLParams, onURLParamsChange } from '@/utils/urlParams'

const searchStore = useSearchStore()
const searchQuery = ref('')
const customApi = ref('')
const searchMode = ref<'game' | 'patch'>('game')
const searchHistoryRef = ref<InstanceType<typeof SearchHistory> | null>(null)
const statusOnline = ref<boolean | null>(null) // null=检测中, true=在线, false=离线
let cleanupURLListener: (() => void) | null = null
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

// 处理历史记录选择
function handleHistorySelect(history: SearchHistoryType) {
  searchQuery.value = history.query
  searchMode.value = history.mode
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {return}

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
        searchStore.setPlatformResult(data.name, data)
      },
      onComplete: () => {
        searchStore.isSearching = false
      },
      onError: (error) => {
        searchStore.errorMessage = error
        searchStore.isSearching = false
      },
    })

    // 获取 VNDB 数据
    if (searchMode.value === 'game') {
      const vndbData = await fetchVndbData(searchQuery.value.trim())
      if (vndbData) {
        searchStore.vndbInfo = vndbData
      }
    }
    
    // 刷新搜索历史
    searchHistoryRef.value?.loadHistory()
  } catch (error) {
    searchStore.errorMessage =
      error instanceof Error ? error.message : '搜索失败'
    searchStore.isSearching = false
  }
}
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
</style>
