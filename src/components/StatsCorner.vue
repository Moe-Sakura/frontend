<template>
  <!-- 只在有数据时显示 -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="hasData"
      class="fixed bottom-4 left-4 z-40"
    >
      <!-- 访问统计 -->
      <div
        class="stats-card bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 border border-white/30 dark:border-slate-700/50"
      >
        <div class="flex items-center gap-2">
          <i class="fas fa-eye text-pink-500 dark:text-purple-400" />
          <span ref="pvElement" class="font-semibold text-gray-800 dark:text-slate-100" />
        </div>
        <div class="w-px h-4 bg-gray-300 dark:bg-slate-600" />
        <div class="flex items-center gap-2">
          <i class="fas fa-user text-pink-500 dark:text-purple-400" />
          <span ref="uvElement" class="font-semibold text-gray-800 dark:text-slate-100" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const hasData = ref(false)
const pvElement = ref<HTMLElement | null>(null)
const uvElement = ref<HTMLElement | null>(null)
let checkInterval: number | null = null

// 检查不蒜子数据是否加载
function checkBusuanziData() {
  // 检查全局不蒜子对象
  const busuanzi = (window as any).busuanzi
  
  if (busuanzi && busuanzi.fetch) {
    // 不蒜子已加载，获取数据
    const pvValue = busuanzi.page_pv
    const uvValue = busuanzi.site_uv
    
    if (pvValue !== undefined && uvValue !== undefined && pvValue > 0 && uvValue > 0) {
      // 有有效数据，显示组件
      if (pvElement.value && uvElement.value) {
        pvElement.value.textContent = String(pvValue)
        uvElement.value.textContent = String(uvValue)
        hasData.value = true
        
        // 停止检查
        if (checkInterval !== null) {
          clearInterval(checkInterval)
          checkInterval = null
        }
      }
    }
  }
}

// 使用 MutationObserver 监听 DOM 变化
function setupObserver() {
  const observer = new MutationObserver(() => {
    checkBusuanziData()
  })
  
  // 监听 body 的子节点变化
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  })
  
  return observer
}

onMounted(() => {
  // 立即检查一次
  setTimeout(() => {
    checkBusuanziData()
  }, 100)
  
  // 设置定时检查（每500ms检查一次，最多检查10秒）
  let attempts = 0
  const maxAttempts = 20
  
  checkInterval = window.setInterval(() => {
    attempts++
    checkBusuanziData()
    
    if (hasData.value || attempts >= maxAttempts) {
      if (checkInterval !== null) {
        clearInterval(checkInterval)
        checkInterval = null
      }
    }
  }, 500)
  
  // 设置 MutationObserver 作为备用
  const observer = setupObserver()
  
  // 清理函数
  onUnmounted(() => {
    if (checkInterval !== null) {
      clearInterval(checkInterval)
    }
    observer.disconnect()
  })
})

onUnmounted(() => {
  if (checkInterval !== null) {
    clearInterval(checkInterval)
    checkInterval = null
  }
})
</script>

<style scoped>
/* 响应式设计 */
@media (max-width: 640px) {
  .stats-card {
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
  }
}
</style>

