<template>
  <!-- 左上角品牌标识和状态 -->
  <div class="fixed top-4 left-4 z-40 flex items-center gap-2">
    <!-- Gamepad 图标 - 品牌标识 -->
    <div class="glassmorphism-card rounded-2xl shadow-lg p-2.5 flex items-center justify-center">
      <GamepadDirectional 
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
        statusOnline === null 
          ? 'text-gray-600 dark:text-gray-400' 
          : statusOnline
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
      ]"
    >
      <span 
        class="w-2 h-2 rounded-full"
        :class="[
          statusOnline === null 
            ? 'bg-gray-400 animate-pulse' 
            : statusOnline
              ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
              : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
        ]"
      />
      <span>{{ statusOnline === null ? '检测中' : statusOnline ? '正常' : '异常' }}</span>
    </a>
  </div>

  <!-- 左下角不蒜子统计 -->
  <div
    id="busuanzi_container_site_pv"
    class="fixed bottom-4 left-4 z-40 transition-all duration-300"
    :class="showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'"
  >
    <div class="stats-card glassmorphism-card rounded-2xl shadow-lg px-4 py-3 flex flex-col gap-2">
      <!-- 访问量 -->
      <div class="flex items-center gap-2">
        <Eye :size="16" class="text-theme-primary dark:text-theme-accent" />
        <span id="busuanzi_value_site_pv" class="font-semibold text-gray-800 dark:text-slate-100">0</span>
      </div>
      <!-- 分隔线 -->
      <div class="h-px bg-gray-300 dark:bg-slate-600" />
      <!-- 访客数 -->
      <div class="flex items-center gap-2">
        <Users :size="16" class="text-theme-primary dark:text-theme-accent" />
        <span id="busuanzi_value_site_uv" class="font-semibold text-gray-800 dark:text-slate-100">0</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { GamepadDirectional, Eye, Users } from 'lucide-vue-next'

const statusOnline = ref<boolean | null>(null)
const showStats = ref(false)
let statusCheckInterval: number | null = null
let checkInterval: number | null = null
let observer: MutationObserver | null = null

// 检查状态页面是否在线
async function checkStatus() {
  try {
    const controller = new window.AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    await fetch('https://status.searchgal.homes', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    })
    
    clearTimeout(timeoutId)
    statusOnline.value = true
  } catch (_error) {
    statusOnline.value = false
  }
}

// 检查不蒜子数据是否加载
function checkBusuanziData() {
  const pvElement = document.getElementById('busuanzi_value_site_pv')
  const uvElement = document.getElementById('busuanzi_value_site_uv')
  
  if (pvElement && uvElement) {
    const pvValue = parseInt(pvElement.textContent || '0', 10)
    const uvValue = parseInt(uvElement.textContent || '0', 10)
    
    if (pvValue > 0 && uvValue > 0) {
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
  
  if (!pvElement || !uvElement) {return}
  
  observer = new MutationObserver(() => {
    checkBusuanziData()
  })
  
  observer.observe(pvElement, { childList: true, characterData: true, subtree: true })
  observer.observe(uvElement, { childList: true, characterData: true, subtree: true })
}

onMounted(() => {
  // 状态检测
  checkStatus()
  statusCheckInterval = window.setInterval(() => {
    checkStatus()
  }, 30000)

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
  if (statusCheckInterval !== null) {
    clearInterval(statusCheckInterval)
    statusCheckInterval = null
  }
  
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
