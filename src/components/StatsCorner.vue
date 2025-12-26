<template>
  <!-- 左上角品牌标识和状态 -->
  <div class="fixed top-4 left-4 z-40 flex items-center gap-2">
    <!-- Gamepad 图标 - 品牌标识 -->
    <div class="glassmorphism-card rounded-2xl shadow-lg p-2.5 flex items-center justify-center">
      <Gamepad2 
        :size="22" 
        class="text-theme-primary dark:text-theme-accent"
      />
    </div>
    
    <!-- 状态指示器 -->
    <a
      href="https://status.searchgal.homes"
      target="_blank"
      rel="noopener noreferrer"
      :class="[
        'status-link glassmorphism-card rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:scale-105',
        statusClass
      ]"
    >
      <!-- 状态图标 -->
      <component
        :is="statusIcon"
        :size="14"
        :class="[
          isChecking ? 'animate-pulse' : '',
          statusIconClass
        ]"
      />
      <span 
        class="w-2 h-2 rounded-full"
        :class="statusDotClass"
      />
      <span>{{ statusText }}</span>
      
      <!-- 响应时间（可选显示） -->
      <span 
        v-if="responseTime && isOnline" 
        class="text-[10px] opacity-60 ml-1"
      >
        {{ responseTime }}ms
      </span>
    </a>
  </div>

  <!-- 左下角统计 -->
  <div
    id="busuanzi_container_site_pv"
    class="fixed bottom-4 left-4 z-40 transition-all duration-300"
    :class="showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'"
  >
    <div class="stats-card glassmorphism-card rounded-2xl shadow-lg px-4 py-3 flex flex-col gap-2">
      <!-- 访问量 -->
      <div class="flex items-center gap-2" title="总访问量">
        <Eye :size="16" class="text-theme-primary dark:text-theme-accent" />
        <span class="text-xs text-gray-500 dark:text-slate-400">PV</span>
        <span id="busuanzi_value_site_pv" class="font-semibold text-gray-800 dark:text-slate-100">{{ statsStore.formattedPV }}</span>
      </div>
      <!-- 分隔线 -->
      <div class="h-px bg-gray-300/50 dark:bg-slate-600/50" />
      <!-- 访客数 -->
      <div class="flex items-center gap-2" title="独立访客">
        <Users :size="16" class="text-theme-primary dark:text-theme-accent" />
        <span class="text-xs text-gray-500 dark:text-slate-400">UV</span>
        <span id="busuanzi_value_site_uv" class="font-semibold text-gray-800 dark:text-slate-100">{{ statsStore.formattedUV }}</span>
      </div>
      
      <!-- 搜索统计（有搜索记录时显示） -->
      <template v-if="statsStore.appStats.totalSearches > 0">
        <div class="h-px bg-gray-300/50 dark:bg-slate-600/50" />
        <div class="flex items-center gap-2" title="本次会话搜索次数">
          <Search :size="16" class="text-theme-primary dark:text-theme-accent" />
          <span class="text-xs text-gray-500 dark:text-slate-400">搜索</span>
          <span class="font-semibold text-gray-800 dark:text-slate-100">{{ statsStore.appStats.totalSearches }}</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Gamepad2, Eye, Users, Activity, Wifi, WifiOff, Search } from 'lucide-vue-next'
import { useStatsStore } from '@/stores/stats'

const statsStore = useStatsStore()
const showStats = ref(false)
let checkInterval: number | null = null
let observer: MutationObserver | null = null

// 计算属性 - 从 statsStore 获取状态
const apiService = computed(() => statsStore.serviceStatuses.get('api'))
const isChecking = computed(() => apiService.value?.status === 'checking')
const isOnline = computed(() => apiService.value?.status === 'online')
const isOffline = computed(() => apiService.value?.status === 'offline')
const responseTime = computed(() => apiService.value?.responseTime)

// 状态文本
const statusText = computed(() => {
  if (isChecking.value) return '检测中'
  if (isOnline.value) return '正常'
  if (isOffline.value) return '异常'
  return '未知'
})

// 状态图标
const statusIcon = computed(() => {
  if (isChecking.value) return Activity
  if (isOnline.value) return Wifi
  return WifiOff
})

// 状态样式类
const statusClass = computed(() => {
  if (isChecking.value) return 'text-gray-600 dark:text-gray-400'
  if (isOnline.value) return 'text-green-600 dark:text-green-400'
  return 'text-red-600 dark:text-red-400'
})

const statusIconClass = computed(() => {
  if (isChecking.value) return 'text-gray-400'
  if (isOnline.value) return 'text-green-500'
  return 'text-red-500'
})

const statusDotClass = computed(() => {
  if (isChecking.value) return 'bg-gray-400 animate-pulse'
  if (isOnline.value) return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
  return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
})

// 检查不蒜子数据是否加载
function checkBusuanziData() {
  const pvElement = document.getElementById('busuanzi_value_site_pv')
  const uvElement = document.getElementById('busuanzi_value_site_uv')
  
  if (pvElement && uvElement) {
    const pvValue = parseInt(pvElement.textContent || '0', 10)
    const uvValue = parseInt(uvElement.textContent || '0', 10)
    
    if (pvValue > 0 && uvValue > 0) {
      // 更新 statsStore
      statsStore.updateVisitorStats(pvValue, uvValue)
      showStats.value = true
      
      if (checkInterval !== null) {
        clearInterval(checkInterval)
        checkInterval = null
      }
      
      if (observer) {
        observer.disconnect()
        observer = null
      }
    }
  }
}

// 使用 MutationObserver 监听不蒜子元素的变化
function setupObserver() {
  const pvElement = document.getElementById('busuanzi_value_site_pv')
  const uvElement = document.getElementById('busuanzi_value_site_uv')
  
  if (!pvElement || !uvElement) return
  
  observer = new MutationObserver(() => {
    checkBusuanziData()
  })
  
  observer.observe(pvElement, { childList: true, characterData: true, subtree: true })
  observer.observe(uvElement, { childList: true, characterData: true, subtree: true })
}

// 监听 visitorStats 变化，自动显示统计
watch(() => statsStore.visitorStats.pv, (pv) => {
  if (pv > 0) {
    showStats.value = true
  }
})

onMounted(() => {
  // 使用 statsStore 进行状态检测
  statsStore.startStatusCheck(30000)

  // 不蒜子统计
  setupObserver()
  checkBusuanziData()
  
  let attempts = 0
  const maxAttempts = 40
  
  checkInterval = window.setInterval(() => {
    attempts++
    checkBusuanziData()
    
    if (showStats.value || attempts >= maxAttempts) {
      if (checkInterval !== null) {
        clearInterval(checkInterval)
        checkInterval = null
      }
    }
  }, 500)
})

onUnmounted(() => {
  // 停止状态检测
  statsStore.stopStatusCheck()
  
  if (checkInterval !== null) {
    clearInterval(checkInterval)
    checkInterval = null
  }
  
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<style scoped>
/* 响应式设计 */
@media (max-width: 640px) {
  .status-link {
    font-size: 0.75rem;
    padding: 0.375rem 0.625rem;
  }
  
  .stats-card {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>
