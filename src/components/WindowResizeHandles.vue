<template>
  <!-- 调整大小的手柄 - 仅桌面端且非全屏时显示 -->
  <template v-if="!isFullscreen">
    <!-- 边缘手柄 - 在内部但靠近边缘 -->
    <div 
      class="hidden md:block absolute top-0 left-6 right-6 h-1.5 cursor-n-resize hover:bg-pink-500/50 transition-colors z-[60]"
      @mousedown.stop.prevent="(e) => $emit('resize', e, 'n')"
      @touchstart.stop.prevent="(e) => $emit('resize', e, 'n')"
    />
    <div 
      class="hidden md:block absolute bottom-0 left-6 right-6 h-1.5 cursor-s-resize hover:bg-pink-500/50 transition-colors z-[60]"
      @mousedown.stop.prevent="(e) => $emit('resize', e, 's')"
      @touchstart.stop.prevent="(e) => $emit('resize', e, 's')"
    />
    <div 
      class="hidden md:block absolute left-0 top-6 bottom-6 w-1.5 cursor-w-resize hover:bg-pink-500/50 transition-colors z-[60]"
      @mousedown.stop.prevent="(e) => $emit('resize', e, 'w')"
      @touchstart.stop.prevent="(e) => $emit('resize', e, 'w')"
    />
    <div 
      class="hidden md:block absolute right-0 top-6 bottom-6 w-1.5 cursor-e-resize hover:bg-pink-500/50 transition-colors z-[60]"
      @mousedown.stop.prevent="(e) => $emit('resize', e, 'e')"
      @touchstart.stop.prevent="(e) => $emit('resize', e, 'e')"
    />
    
    <!-- 角落手柄 - 更大更明显 -->
    <div 
      class="hidden md:block absolute top-0 left-0 w-6 h-6 cursor-nw-resize hover:bg-pink-500/50 transition-colors z-[60] rounded-tl-3xl"
      @mousedown.stop.prevent="(e) => $emit('resize', e, 'nw')"
      @touchstart.stop.prevent="(e) => $emit('resize', e, 'nw')"
    />
    <div 
      class="hidden md:block absolute top-0 right-0 w-6 h-6 cursor-ne-resize hover:bg-pink-500/50 transition-colors z-[60] rounded-tr-3xl"
      @mousedown.stop.prevent="(e) => $emit('resize', e, 'ne')"
      @touchstart.stop.prevent="(e) => $emit('resize', e, 'ne')"
    />
    <div 
      class="hidden md:block absolute bottom-0 left-0 w-6 h-6 cursor-sw-resize hover:bg-pink-500/50 transition-colors z-[60] rounded-bl-3xl"
      @mousedown.stop.prevent="(e) => $emit('resize', e, 'sw')"
      @touchstart.stop.prevent="(e) => $emit('resize', e, 'sw')"
    />
    <div 
      class="hidden md:block absolute bottom-0 right-0 w-6 h-6 cursor-se-resize hover:bg-pink-500/50 transition-colors z-[60] rounded-br-3xl"
      @mousedown.stop.prevent="(e) => $emit('resize', e, 'se')"
      @touchstart.stop.prevent="(e) => $emit('resize', e, 'se')"
    />
  </template>
</template>

<script setup lang="ts">
import type { ResizeDirection } from '@/composables/useWindowManager'

defineProps<{
  isFullscreen: boolean
}>()

defineEmits<{
  resize: [e: MouseEvent | TouchEvent, direction: ResizeDirection]
}>()
</script>
