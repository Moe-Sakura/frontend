<template>
  <!-- 左上角状态指示器 -->
  <div class="fixed top-4 left-4 z-40">
    <a
      href="https://status.searchgal.top"
      target="_blank"
      rel="noopener noreferrer"
      :class="[
        'status-link glassmorphism-card rounded-2xl shadow-lg px-3 py-2 flex items-center gap-2 transition-all duration-300 hover:scale-105',
        statusClass
      ]"
      :title="statusText"
    >
      <!-- 状态图标 -->
      <component
        :is="statusIcon"
        :size="16"
        :class="[
          isChecking ? 'animate-pulse' : '',
          statusIconClass
        ]"
      />
      <!-- 延迟显示 -->
      <span class="text-sm font-medium tabular-nums">
        {{ isChecking ? '...' : (responseTime ? `${responseTime}ms` : '--') }}
      </span>
    </a>
  </div>

  <!-- 左下角统计（Vue 控制显示） -->
  <div
    class="fixed bottom-4 left-4 z-40 transition-all duration-300"
    :class="showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'"
  >
    <div class="stats-card glassmorphism-card rounded-2xl shadow-lg px-4 py-3 flex flex-col gap-2">
      <!-- 访问量 -->
      <div class="flex items-center gap-2" title="总访问量 (PV)">
        <Eye :size="16" class="text-theme-primary dark:text-theme-accent" />
        <span class="font-semibold text-gray-800 dark:text-slate-100">{{ statsStore.visitorStats.pv }}</span>
      </div>
      <!-- 分隔线 -->
      <div class="h-px bg-gray-300/50 dark:bg-slate-600/50" />
      <!-- 访客数 -->
      <div class="flex items-center gap-2" title="独立访客 (UV)">
        <Users :size="16" class="text-theme-primary dark:text-theme-accent" />
        <span class="font-semibold text-gray-800 dark:text-slate-100">{{ statsStore.visitorStats.uv }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Eye, Users, Activity, Wifi, WifiOff } from 'lucide-vue-next'
import { useStatsStore } from '@/stores/stats'

const statsStore = useStatsStore()
const showStats = ref(false)

// 计算属性 - 从 statsStore 获取状态
const apiService = computed(() => statsStore.serviceStatuses.get('api'))
const isChecking = computed(() => apiService.value?.status === 'checking')
const isOnline = computed(() => apiService.value?.status === 'online')
const isOffline = computed(() => apiService.value?.status === 'offline')
const responseTime = computed(() => apiService.value?.responseTime)

// 状态文本
const statusText = computed(() => {
  if (isChecking.value) {return '检测中'}
  if (isOnline.value) {return '正常'}
  if (isOffline.value) {return '异常'}
  return '未知'
})

// 状态图标
const statusIcon = computed(() => {
  if (isChecking.value) {return Activity}
  if (isOnline.value) {return Wifi}
  return WifiOff
})

// 状态样式类
const statusClass = computed(() => {
  if (isChecking.value) {return 'text-gray-600 dark:text-gray-400'}
  if (isOnline.value) {return 'text-green-600 dark:text-green-400'}
  return 'text-red-600 dark:text-red-400'
})

const statusIconClass = computed(() => {
  if (isChecking.value) {return 'text-gray-400'}
  if (isOnline.value) {return 'text-green-500'}
  return 'text-red-500'
})

// 不蒜子 API 配置
// 文档: http://bsz.saop.cc/
const BUSUANZI_API = 'https://bsz.saop.cc/api'

// 获取统计数据（POST 方法会同时计数）
async function fetchBusuanziStats() {
  try {
    const res = await fetch(BUSUANZI_API, {
      method: 'POST',
      credentials: 'include', // 携带 Cookie（用于识别访客）
      headers: {
        'x-bsz-referer': window.location.href, // 必须：当前页面 URL
      },
    })
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    
    const json = await res.json()
    
    // 响应格式: { success: true, data: { site_pv, site_uv, page_pv } }
    if (json.success && json.data) {
      const { site_pv, site_uv } = json.data
      statsStore.updateVisitorStats(site_pv, site_uv)
      showStats.value = true
    }
  } catch (error) {
    console.warn('[Busuanzi] Failed to fetch stats:', error)
  }
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

  // 获取不蒜子统计
  void fetchBusuanziStats()
})

onUnmounted(() => {
  // 停止状态检测
  statsStore.stopStatusCheck()
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
