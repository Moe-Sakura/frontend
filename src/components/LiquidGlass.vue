<template>
  <component 
    :is="tag" 
    class="liquid-glass liquid-glass-shadow"
    :class="[sizeClass, { 'liquid-glass-interactive': interactive }]"
  >
    <!-- 液态扭曲效果层 -->
    <div class="liquid-glass-effect" />
    
    <!-- 着色层 -->
    <div class="liquid-glass-tint" />
    
    <!-- 高光层 -->
    <div class="liquid-glass-shine" />
    
    <!-- 边框层 -->
    <div class="liquid-glass-border" />
    
    <!-- 内容层 -->
    <div class="liquid-glass-content">
      <slot />
    </div>
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  /** 渲染的 HTML 标签 */
  tag?: string
  /** 是否有交互效果（hover 缩放） */
  interactive?: boolean
  /** 圆角大小 */
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

const props = withDefaults(defineProps<Props>(), {
  tag: 'div',
  interactive: false,
  rounded: 'xl',
})

const sizeClass = computed(() => {
  const roundedMap: Record<string, string> = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    '2xl': 'rounded-[2rem]',
    full: 'rounded-full',
  }
  return roundedMap[props.rounded] || 'rounded-xl'
})
</script>

<style scoped>
/* 交互式液态玻璃 */
.liquid-glass-interactive {
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}

.liquid-glass-interactive:hover {
  transform: translateY(-4px) scale(1.02);
}

.liquid-glass-interactive:active {
  transform: translateY(-2px) scale(1);
}

/* 圆角继承 */
.liquid-glass-effect,
.liquid-glass-tint,
.liquid-glass-shine,
.liquid-glass-border {
  border-radius: inherit;
}
</style>
