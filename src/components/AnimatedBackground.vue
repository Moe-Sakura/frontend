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
      class="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform gpu-layer"
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
