<template>
  <Transition
    :css="false"
    @enter="onEnter"
    @leave="onLeave"
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
import { computed } from 'vue'
import { animate } from '@/composables/useAnime'

const props = defineProps<{
  imageUrl: string
  imageKey: string | number
  kenBurnsClass: string
}>()

function onEnter(el: Element, done: () => void) {
  animate(el as HTMLElement, {
    opacity: [0, 1],
    duration: 1500,
    ease: 'inOutQuad',
    complete: done,
  })
}

function onLeave(el: Element, done: () => void) {
  animate(el as HTMLElement, {
    opacity: [1, 0],
    duration: 1500,
    ease: 'inOutQuad',
    complete: done,
  })
}
</script>
