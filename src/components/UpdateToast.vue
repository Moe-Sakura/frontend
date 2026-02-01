<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-4 scale-95"
  >
    <div
      v-if="needRefresh"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-2xl bg-gradient-to-r from-[#ff1493] to-[#d946ef] text-white shadow-xl shadow-pink-500/30 flex items-center gap-3 max-w-[90vw] sm:max-w-md"
    >
      <!-- 图标 -->
      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        <RefreshCw :size="18" class="animate-spin" />
      </div>

      <!-- 文字内容 -->
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm">发现新版本</p>
        <p class="text-xs text-white/80 truncate">正在更新...</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { playNotification } from '@/composables/useSound'

const {
  needRefresh,
  updateServiceWorker,
} = useRegisterSW({
  immediate: true,
  onRegisteredSW(swUrl, r) {
    console.info(`[SW] Registered: ${swUrl}`)
    // 定期检查更新
    if (r) {
      setInterval(() => {
        void r.update()
      }, 5 * 60 * 1000) // 每 5 分钟检查一次
    }
  },
  onRegisterError(error) {
    console.error('[SW] Registration error:', error)
  },
})

// 当有更新时立即更新
watch(needRefresh, (need) => {
  if (need) {
    playNotification()
    // 立即更新 SW 并刷新页面
    void updateServiceWorker(true)
  }
})
</script>
