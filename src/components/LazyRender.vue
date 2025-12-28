<script setup lang="ts">
import { ref, onMounted, onUnmounted, useAttrs } from 'vue'

// 禁用自动继承属性，手动绑定到容器
defineOptions({
  inheritAttrs: false,
})

const attrs = useAttrs()

const props = defineProps<{
  /** 距离可视区多少像素时开始渲染 */
  rootMargin?: string
  /** 是否只渲染一次（进入后不再隐藏） */
  once?: boolean
  /** 占位高度 */
  minHeight?: string
}>()

const isVisible = ref(false)
const containerRef = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!containerRef.value) {return}
  
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          isVisible.value = true
          // 如果是一次性渲染，观察到后就停止
          if (props.once && observer && containerRef.value) {
            observer.unobserve(containerRef.value)
          }
        } else if (!props.once) {
          isVisible.value = false
        }
      })
    },
    {
      rootMargin: props.rootMargin || '200px 0px', // 提前 200px 开始渲染
      threshold: 0,
    },
  )
  
  observer.observe(containerRef.value)
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <div 
    ref="containerRef" 
    v-bind="attrs"
    :style="{ 
      minHeight: !isVisible ? (minHeight || '60px') : undefined,
      scrollMarginTop: '80px'
    }"
  >
    <slot v-if="isVisible" />
    <!-- 占位符 -->
    <div 
      v-else 
      class="animate-pulse bg-gray-200/50 dark:bg-slate-700/50 rounded-xl"
      :style="{ height: minHeight || '60px' }"
    />
  </div>
</template>

