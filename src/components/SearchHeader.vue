<template>
  <div class="container mx-auto w-full px-8 py-6">
    <div class="flex flex-col items-center gap-6">
      <!-- Logo with backdrop -->
      <div class="w-20 h-20 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow-2xl backdrop-blur-sm border-4 border-white/50">
        SG
      </div>
      
      <!-- Title with text shadow -->
      <h1 class="text-5xl font-bold text-center text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
        Galgame 聚合搜索
      </h1>
      
      <!-- Search Form -->
      <form @submit.prevent="handleSearch" class="w-full max-w-2xl">
        <div class="flex flex-col gap-4">
          <!-- Search Input -->
          <input
            v-model="searchQuery"
            type="text"
            name="game"
            placeholder="游戏或补丁关键字词"
            class="w-full px-4 py-3 bg-white/90 backdrop-blur-sm border-2 border-white/50 rounded-[8px] focus:outline-none focus:border-indigo-400 focus:bg-white/95 transition-all shadow-lg"
            required
          />
          
          <!-- Custom API Input -->
          <div class="relative">
            <input
              v-model="customApi"
              type="url"
              placeholder="自定义 API 地址 (可选)"
              class="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-[8px] text-sm focus:outline-none focus:border-indigo-500"
            />
            <p class="text-xs text-gray-500 mt-1">例如: https://api.searchgal.homes 或 http://127.0.0.1:8898</p>
          </div>
          
          <!-- Search Button and Mode Selector -->
          <div class="flex flex-col gap-3">
            <button
              type="submit"
              :disabled="searchStore.searchDisabled"
              class="py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-[8px] disabled:opacity-50 transition-all relative overflow-hidden"
            >
              <span 
                v-if="searchStore.isSearching"
                class="absolute left-0 top-0 h-full bg-pink-400/80 transition-all duration-300"
                :style="{ width: progressWidth + '%' }"
              />
              <span class="relative z-10">
                <span v-if="!searchStore.isSearching">开始搜索</span>
                <span v-else>进度: {{ searchStore.searchProgress.current }} / {{ searchStore.searchProgress.total }}</span>
              </span>
            </button>
            
            <!-- Search Mode Selector -->
            <div class="flex gap-0 rounded-[8px] overflow-hidden shadow-sm">
              <label
                class="flex-1 px-4 py-2 text-center cursor-pointer transition-all"
                :class="searchMode === 'game' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700'"
              >
                <input type="radio" value="game" v-model="searchMode" class="hidden" />
                <i class="fas fa-gamepad mr-1"></i>游戏
              </label>
              <label
                class="flex-1 px-4 py-2 text-center cursor-pointer transition-all border-l border-gray-200"
                :class="searchMode === 'patch' ? 'bg-pink-500 text-white' : 'bg-white text-pink-700'"
              >
                <input type="radio" value="patch" v-model="searchMode" class="hidden" />
                <i class="fas fa-wrench mr-1"></i>补丁
              </label>
              <a
                href="https://status.searchgal.homes"
                target="_blank"
                class="px-4 py-2 bg-white text-green-600 border-l border-gray-200 flex items-center gap-1"
              >
                <i class="fas fa-circle text-xs"></i>正常
              </a>
            </div>
          </div>
        </div>
      </form>
      
      <!-- Error Message -->
      <div v-if="searchStore.errorMessage" class="w-full max-w-2xl bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {{ searchStore.errorMessage }}
      </div>
      
      <!-- Usage Notice -->
      <div class="w-full max-w-4xl mt-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">咱家的使用须知</h2>
        <ul class="space-y-2 text-gray-700">
          <li>• 首先，衷心感谢 <a href="https://saop.cc/" target="_blank" class="text-indigo-600 hover:underline">@Asuna</a> 大佬提供的服务器和技术支持！</li>
          <li>• 本程序纯属 <strong>爱发电</strong>，仅供绅士们交流学习使用，务必请大家 <strong>支持正版 Galgame</strong>！</li>
          <li>• 本站只做互联网内容的 <strong>聚合搬运工</strong>，搜索结果均来自第三方站点。</li>
          <li>• 游戏介绍和人物信息数据由 <a href="https://vndb.org/" target="_blank" class="text-indigo-600 hover:underline">VNDB</a> 提供，由AI大模型翻译。</li>
          <li>• 郑重呼吁：请务必支持 Galgame 正版！让爱与梦想延续！</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { searchGameStream, fetchVndbData } from '@/api/search'

const searchStore = useSearchStore()
const searchQuery = ref('')
const customApi = ref('')
const searchMode = ref<'game' | 'patch'>('game')

const progressWidth = computed(() => {
  if (searchStore.searchProgress.total === 0) return 0
  return (searchStore.searchProgress.current / searchStore.searchProgress.total) * 100
})

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchStore.errorMessage = '游戏名称不能为空'
    return
  }

  // 检查冷却时间
  const now = Date.now()
  const COOLDOWN_MS = 30 * 1000
  if (now - searchStore.lastSearchTime < COOLDOWN_MS) {
    const timeLeft = Math.ceil((COOLDOWN_MS - (now - searchStore.lastSearchTime)) / 1000)
    searchStore.errorMessage = `请等待 ${timeLeft} 秒后再搜索。`
    return
  }

  // 重置状态
  searchStore.clearResults()
  searchStore.isSearching = true
  searchStore.lastSearchTime = now
  searchStore.searchProgress = { current: 0, total: 0 }

  // 构建搜索参数
  const searchParams = new URLSearchParams({
    game: searchQuery.value.trim(),
    mode: searchMode.value,
  })

  if (customApi.value.trim()) {
    searchParams.set('api', customApi.value.trim())
  }

  // 开始搜索
  try {
    // 并行获取 VNDB 数据
    const vndbPromise = fetchVndbData(searchQuery.value.trim())

    // 流式搜索
    await searchGameStream(searchParams, {
      onTotal: (total) => {
        searchStore.searchProgress.total = total
      },
      onProgress: (current, total) => {
        searchStore.searchProgress.current = current
        searchStore.searchProgress.total = total
      },
      onPlatformResult: (platformData) => {
        // 保存完整的平台数据（包含颜色、错误等信息）
        searchStore.setPlatformResult(platformData.name, platformData)
      },
      onComplete: async () => {
        // 等待 VNDB 数据
        const vndbData = await vndbPromise
        if (vndbData) {
          searchStore.vndbInfo = vndbData
        }
        searchStore.isSearching = false
        searchStore.isFirstSearch = false
      },
      onError: (error) => {
        searchStore.errorMessage = error
        searchStore.isSearching = false
      }
    })
  } catch (error) {
    searchStore.errorMessage = error instanceof Error ? error.message : '搜索失败'
    searchStore.isSearching = false
  }
}
</script>
