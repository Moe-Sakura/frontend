<template>
  <div class="container mx-auto w-full px-8 py-6">
    <div class="flex flex-col items-center gap-6">
      <!-- Title with gamepad icon and status -->
      <div class="header-title flex items-center gap-4 my-12">
        <h1 class="text-5xl font-bold text-center text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)] flex items-center gap-3">
          <i class="fas fa-gamepad text-pink-400" style="font-size: 48px;"></i>
          Galgame 聚合搜索
        </h1>
        <a 
          href="https://status.searchgal.homes" 
          target="_blank"
          class="status-chip px-4 py-2 rounded-full bg-white/90 backdrop-blur-md flex items-center gap-2 text-green-600 font-semibold hover:scale-105 transition-transform"
        >
          <i class="fas fa-check-circle"></i>
          <span>服务正常</span>
        </a>
      </div>
      
      <!-- Search Form -->
      <form @submit.prevent="handleSearch" class="search-form w-full max-w-2xl">
        <div class="flex flex-col gap-4">
          <!-- Search Input -->
          <div class="relative">
            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"></i>
            <input
              v-model="searchQuery"
              type="search"
              placeholder="游戏或补丁关键字词*"
              required
              class="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/98 backdrop-blur-md shadow-lg focus:shadow-2xl focus:scale-[1.01] transition-all outline-none border-2 border-transparent focus:border-pink-500"
            />
          </div>
          
          <!-- Custom API Input -->
          <div class="relative">
            <i class="fas fa-link absolute left-4 top-5 text-gray-400 text-xl"></i>
            <input
              v-model="customApi"
              type="url"
              placeholder="自定义 API 地址 (可选)"
              class="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/98 backdrop-blur-md shadow-lg focus:shadow-2xl focus:scale-[1.01] transition-all outline-none border-2 border-transparent focus:border-pink-500"
            />
            <p class="text-xs text-white/90 drop-shadow-md mt-2 font-medium">
              例如: https://api.searchgal.homes 或 http://127.0.0.1:8898
            </p>
          </div>
          
          <!-- Search Button and Mode Selector -->
          <div class="flex flex-col gap-3">
            <button
              type="submit"
              :disabled="searchStore.searchDisabled"
              class="search-button w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-pink-600 text-white font-semibold text-lg shadow-lg hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <i class="fas fa-search"></i>
              <span v-if="!searchStore.isSearching">开始搜索</span>
              <span v-else>进度: {{ searchStore.searchProgress.current }} / {{ searchStore.searchProgress.total }}</span>
            </button>
            
            <!-- Search Mode Selector -->
            <div class="flex justify-center gap-3">
              <button
                @click="searchMode = 'game'"
                :class="['mode-chip px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2', 
                  searchMode === 'game' ? 'bg-pink-500 text-white shadow-lg scale-105' : 'bg-white/90 text-gray-700 hover:bg-white']"
              >
                <i class="fas fa-gamepad"></i>
                <span>游戏</span>
              </button>
              <button
                @click="searchMode = 'patch'"
                :class="['mode-chip px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2',
                  searchMode === 'patch' ? 'bg-pink-500 text-white shadow-lg scale-105' : 'bg-white/90 text-gray-700 hover:bg-white']"
              >
                <i class="fas fa-tools"></i>
                <span>补丁</span>
              </button>
            </div>
            
            <!-- Busuanzi Statistics -->
            <div class="flex justify-center gap-4 text-sm text-white/90 drop-shadow-md font-medium mt-2">
              <span>访问：<span id="busuanzi_value_page_pv" class="font-semibold">-</span></span>
              <span>访客：<span id="busuanzi_value_site_uv" class="font-semibold">-</span></span>
            </div>
          </div>
        </div>
      </form>
      
      <!-- Error Message -->
      <div v-if="searchStore.errorMessage" class="w-full max-w-2xl">
        <md-elevated-card class="error-card">
          <div class="flex items-center gap-2 p-4 text-red-700">
            <md-icon class="text-red-700">error</md-icon>
            <div>
              <strong class="font-bold">错误: </strong>{{ searchStore.errorMessage }}
            </div>
          </div>
        </md-elevated-card>
      </div>
      
      <!-- Usage Notice -->
      <div class="w-full max-w-4xl mt-8">
        <md-elevated-card class="usage-notice">
          <div class="p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">咱家的使用须知</h2>
            <ul class="space-y-2 text-gray-800">
              <li>• 首先，衷心感谢 <a href="https://saop.cc/" target="_blank" class="text-indigo-600 hover:underline font-semibold">@Asuna</a> 大佬提供的服务器和技术支持！没有大佬的魔法，咱可跑不起来！</li>
              <li>• 本程序纯属 <strong>爱发电</strong>，仅供绅士们交流学习使用，务必请大家 <strong>支持正版 Galgame</strong>！入正不亏哦！</li>
              <li>• 本站只做互联网内容的 <strong>聚合搬运工</strong>，搜索结果均来自第三方站点，下载前请各位自行判断 <strong>资源安全性</strong>，以免翻车。</li>
              <li>• 搜索时请注意关键词长度！<strong>关键词太短</strong> 可能搜不全（部分站点只显示首批结果），<strong>太长</strong> 则可能无法精准匹配。建议尝试 <strong>适当的关键词</strong>，效果更佳~</li>
              <li>• 本程序每次查询完毕即断开连接，<strong>严禁任何形式的爆破或恶意爬取</strong>，做个文明的绅士！</li>
              <li>• 万一某个站点搜索挂了，先看看自己的魔法是否到位，也可能是站点维护了，或者咱这边的 <strong>爬虫失效</strong> 了。</li>
              <li>• 为了支持各 Galgame 站点能长久运营，还请各位把浏览器的 <strong>广告屏蔽插件</strong> 关掉，或将这些站点加入白名单。大家建站不易，小小的支持也是大大的动力！</li>
              <li>• 游戏介绍和人物信息数据由 <a href="https://vndb.org/" target="_blank" class="text-indigo-600 hover:underline font-semibold">VNDB</a> 提供，由AI大模型翻译，翻译结果不保证准确性，仅作为检索游戏时的参考！</li>
              <li>• 郑重呼吁：请务必支持 Galgame 正版！让爱与梦想延续！</li>
              <li>• 如果您觉得咱这小工具好用，请移步 <a href="https://github.com/Moe-Sakura/SearchGal" target="_blank" class="text-indigo-600 hover:underline font-semibold">GitHub</a> 给本项目点个免费的 <strong>Star</strong> 吧，秋梨膏！你的支持就是咱最大的动力，比心~</li>
            </ul>
          </div>
        </md-elevated-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useSearchStore } from '@/stores/search'
import { searchGameStream, fetchVndbData } from '@/api/search'
import gsap from 'gsap'

const searchStore = useSearchStore()
const searchQuery = ref('')
const customApi = ref('')
const searchMode = ref<'game' | 'patch'>('game')

const progressWidth = computed(() => {
  if (searchStore.searchProgress.total === 0) return '0'
  return ((searchStore.searchProgress.current / searchStore.searchProgress.total) * 100).toString()
})

async function handleSearch() {
  if (!searchQuery.value.trim()) return
  
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
      }
    })
    
    // 获取 VNDB 数据
    if (searchMode.value === 'game') {
      const vndbData = await fetchVndbData(searchQuery.value.trim())
      if (vndbData) {
        searchStore.vndbInfo = vndbData
      }
    }
  } catch (error) {
    console.error('Search error:', error)
    searchStore.errorMessage = error instanceof Error ? error.message : '搜索失败'
    searchStore.isSearching = false
  }
}

onMounted(() => {
  // 移除 GSAP 动画，直接显示所有元素
  // GSAP 动画在某些情况下会导致元素保持不可见状态
})
</script>

<style scoped>
.status-chip {
  --md-assist-chip-container-color: rgba(255, 255, 255, 0.9);
  --md-assist-chip-label-text-color: rgb(22, 163, 74);
  --md-assist-chip-icon-color: rgb(22, 163, 74);
  font-weight: 600;
}

.error-card {
  --md-elevated-card-container-color: rgb(254, 242, 242);
  border: 1px solid rgb(254, 202, 202);
}

.usage-notice {
  --md-elevated-card-container-color: rgba(255, 255, 255, 0.75);
  width: 100%;
  display: block;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

md-chip-set {
  justify-content: center;
}

md-filter-chip {
  --md-filter-chip-selected-container-color: var(--md-sys-color-primary);
  --md-filter-chip-selected-label-text-color: var(--md-sys-color-on-primary);
}

/* 确保 Material 3 组件正确显示 */
md-elevated-card {
  display: block;
  width: 100%;
}

md-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
