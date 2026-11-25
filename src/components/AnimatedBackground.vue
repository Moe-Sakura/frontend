<template>
  <Transition
    enter-active-class="duration-[1500ms] ease-in-out"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="duration-[1500ms] ease-in-out"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="imageUrl"
      :key="imageKey"
      class="ken-burns absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform gpu-layer"
      :class="kenBurnsClass"
      :style="{ backgroundImage: `url(${imageUrl})` }"
    />
  </Transition>
</template>

<script setup lang="ts">
defineProps<{
  imageUrl: string
  imageKey: string | number
  kenBurnsClass: string
}>()
</script>

<style scoped>
/* 缩放进入 - 从 100% 缓慢放大到 115% */
.kb-zoom-in {
  animation: kb-zoom-in 12s ease-out forwards;
}

@keyframes kb-zoom-in {
  0% { transform: scale(1); }
  100% { transform: scale(1.15); }
}

/* 缩放退出 - 从 115% 缓慢缩小到 100% */
.kb-zoom-out {
  animation: kb-zoom-out 12s ease-out forwards;
}

@keyframes kb-zoom-out {
  0% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

/* 向左平移 */
.kb-pan-left {
  animation: kb-pan-left 12s ease-out forwards;
}

@keyframes kb-pan-left {
  0% { transform: scale(1.1) translateX(3%); }
  100% { transform: scale(1.1) translateX(-3%); }
}

/* 向右平移 */
.kb-pan-right {
  animation: kb-pan-right 12s ease-out forwards;
}

@keyframes kb-pan-right {
  0% { transform: scale(1.1) translateX(-3%); }
  100% { transform: scale(1.1) translateX(3%); }
}

/* 向上平移 */
.kb-pan-up {
  animation: kb-pan-up 12s ease-out forwards;
}

@keyframes kb-pan-up {
  0% { transform: scale(1.1) translateY(3%); }
  100% { transform: scale(1.1) translateY(-3%); }
}

/* 向下平移 */
.kb-pan-down {
  animation: kb-pan-down 12s ease-out forwards;
}

@keyframes kb-pan-down {
  0% { transform: scale(1.1) translateY(-3%); }
  100% { transform: scale(1.1) translateY(3%); }
}

/* 减少动画偏好 - 禁用 Ken Burns 效果 */
@media (prefers-reduced-motion: reduce) {
  .ken-burns {
    animation: none;
    transform: scale(1.05);
  }
}
</style>
