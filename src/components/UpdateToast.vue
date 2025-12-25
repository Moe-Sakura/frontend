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
      v-if="isVisible"
      class="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-3 rounded-2xl bg-gradient-to-r from-[#ff1493] to-[#d946ef] text-white shadow-xl shadow-pink-500/30 flex items-center gap-3 max-w-[90vw] sm:max-w-md"
    >
      <!-- 图标 -->
      <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
        <RefreshCw :size="18" class="animate-spin" />
      </div>

      <!-- 文字内容 -->
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm">发现新版本</p>
        <p class="text-xs text-white/80 truncate">
          {{ countdown > 0 ? `${countdown} 秒后自动更新...` : '正在更新...' }}
        </p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import { playNotification } from '@/composables/useSound'

const props = defineProps<{
  isVisible: boolean
  onUpdate: () => void
}>()

const countdown = ref(5)
let timer: number | null = null

function startCountdown() {
  // 先清除可能存在的旧定时器，避免创建多个并发定时器
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  
  playNotification()
  countdown.value = 5
  timer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      props.onUpdate()
    }
  }, 1000)
}

onMounted(() => {
  if (props.isVisible) {
    startCountdown()
  }
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

// 监听 isVisible 变化
watch(() => props.isVisible, (visible) => {
  if (visible) {
    startCountdown()
  } else if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

