<script setup lang="ts">
/**
 * 全屏图片灯箱
 * 点任意位置关闭；左右方向键 / 触摸滑动切换
 */

import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight, X } from '@lucide/vue'
import { useImageViewer } from '@/composables/useImageViewer'
import { playSwipe, playTransitionUp, playTransitionDown } from '@/composables/useSound'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'

const {
  isOpen,
  images,
  currentIndex,
  currentImage,
  hasMultiple,
  close,
  prev,
  next,
} = useImageViewer()

// 图片加载状态
const isLoading = ref(true)

/**
 * 关闭音效必须挂在 setter 上：Reka 处理 Esc、点遮罩、点关闭按钮时只会把 open
 * 置为 false，不会调用组件里的任何函数，挂在 close() 里会让这几条路径静音。
 * 打开则相反 —— 灯箱是外部调 composable 的 open() 打开的，setter 的 true 分支
 * 永远走不到，开场音效只能放在下面的 watch 里。
 */
const open = computed({
  get: () => isOpen.value,
  set: (value: boolean) => {
    if (value) {
      isOpen.value = true
    } else {
      playTransitionDown()
      close()
    }
  },
})

/**
 * body.overflow 的所有权：useImageViewer 自带一套「open 时写 hidden、close 时
 * 清空」的土办法，跟 Reka 的滚动锁叠在一起会互相踩 ——
 *   1. open() 写的 hidden 会被 Reka 挂载时当成「原始值」记下来，关闭还原后
 *      body 就永远锁死；
 *   2. close() 的清空会顺手把外层 VndbPanel 那层 Dialog 的锁也解掉，
 *      背后的页面在灯箱关掉后能滚。
 * 这里把这两笔写入原样撤销，滚动锁全权交给 Reka。等 useImageViewer 里那两行
 * 删掉之后，紧跟着的两个 watch 也可以一并删除。
 */
let overflowBeforeOpen = ''

// sync 抢在 open() 写 body 之前落地（composable 是先置 isOpen、再写 body 的）
watch(isOpen, (value) => {
  if (value) {overflowBeforeOpen = document.body.style.overflow}
}, { flush: 'sync' })

// pre 在 Reka 挂载 / 卸载 DialogContent 之前把值还原回去
watch(isOpen, (value) => {
  // 关闭这一刻内容还在做退场动画、锁仍然生效，所以按 hidden 还原，
  // 真正的解锁交给 Reka 在卸载时做
  document.body.style.overflow = value ? overflowBeforeOpen : 'hidden'
})

// 开场音效
watch(isOpen, (value) => {
  if (value) {playTransitionUp()}
})

// 监听图片切换，重置加载状态
watch(currentIndex, () => {
  isLoading.value = true
})

// 灯箱没有可见标题，给读屏软件补一份描述
const a11yDescription = computed(() =>
  hasMultiple.value
    ? `第 ${currentIndex.value + 1} 张，共 ${images.value.length} 张，可用左右方向键切换`
    : '按 Esc 键或点击任意位置关闭',
)

// 图片加载完成
function handleImageLoad() {
  isLoading.value = false
}

// 上一张
function goPrev() {
  playSwipe()
  prev()
}

// 下一张
function goNext() {
  playSwipe()
  next()
}

/**
 * Escape 已经由 Dialog 接管，这里只剩方向键。Dialog 的焦点锁不拦 keydown 冒泡，
 * 挂在 window 上照样收得到。
 */
function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value) {return}

  switch (e.key) {
    case 'ArrowLeft':
      goPrev()
      break
    case 'ArrowRight':
      goNext()
      break
  }
}

// 触摸滑动切换
let touchStartX = 0

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (!touch) {return}
  touchStartX = touch.clientX
}

function handleTouchEnd(e: TouchEvent) {
  const touch = e.changedTouches[0]
  if (!touch) {return}
  const deltaX = touch.clientX - touchStartX

  if (Math.abs(deltaX) > 80) {
    if (deltaX > 0) {
      goPrev()
    } else {
      goNext()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Dialog v-model:open="open">
    <!--
      灯箱要的是「整块黑幕就是内容」的观感，所以直接把 DialogContent 铺满全屏、
      涂上纯黑，Reka 自带的 overlay 藏在它底下。点击关闭也就落在这一层，
      不再依赖 pointerDownOutside（全屏内容压根没有 outside）。

      两处刻意的取值：

      bg-black 而不是原来的 bg-black/95 —— 灯箱只从 VndbPanel 里打开，而那个
      面板是 rgba(255,255,255,.85) 的白底，5% 的透光会让面板的矩形轮廓像鬼影
      一样浮在黑幕上。原设计背后只有照片背景，5% 看不出来，套进 Dialog 之后
      就露馅了。

      z-[60] 而不是继承基类的 z-50 —— 项目里所有 Dialog / Popover / Tooltip
      的内容与遮罩全是 z-50，同层级时纯靠挂载先后决定压盖。灯箱在语义上就是
      「压在所有面板之上」的东西，把它显式抬到 60，就不必赌 portal 的挂载顺序。
    -->
    <DialogContent
      :show-close-button="false"
      class="inset-0 z-[60] flex max-w-none translate-x-0 translate-y-0 cursor-pointer items-center justify-center gap-0 rounded-none border-0 bg-black p-0 shadow-none select-none sm:max-w-none"
      @click="open = false"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <DialogTitle class="sr-only">
        图片预览
      </DialogTitle>
      <DialogDescription class="sr-only">
        {{ a11yDescription }}
      </DialogDescription>

      <!-- 关闭按钮：安全区偏移走 top 而不是 padding-top，否则会把定高的方形按钮撑歪 -->
      <Button
        type="button"
        variant="ghost"
        size="icon-lg"
        aria-label="关闭图片预览"
        class="absolute right-4 z-20 rounded-full bg-white/10 text-white hover:bg-white/20 hover:text-white dark:hover:bg-white/20"
        style="top: max(1rem, env(safe-area-inset-top))"
        @click.stop="open = false"
      >
        <X class="size-6" />
      </Button>

      <!-- 图片计数 -->
      <Badge
        v-if="hasMultiple"
        variant="secondary"
        class="absolute left-4 z-20 bg-white/10 px-3 py-1.5 text-sm text-white"
        style="top: max(1rem, env(safe-area-inset-top))"
      >
        {{ currentIndex + 1 }} / {{ images.length }}
      </Badge>

      <!-- 加载指示器 -->
      <div v-if="isLoading" class="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div class="size-10 animate-spin rounded-full border-3 border-white/20 border-t-theme-primary" />
      </div>

      <!-- 图片 -->
      <img
        v-show="currentImage"
        :src="currentImage?.src"
        :alt="currentImage?.caption || ''"
        class="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl transition-[transform,opacity] duration-200"
        :class="isLoading ? 'scale-95 opacity-0' : 'scale-100 opacity-100'"
        draggable="false"
        @click.stop
        @load="handleImageLoad"
      />

      <!-- 图片标题 -->
      <div
        v-if="currentImage?.caption && !isLoading"
        class="absolute left-1/2 z-20 max-w-[80%] -translate-x-1/2 rounded-lg bg-black/60 px-4 py-2 text-center text-sm text-white"
        style="bottom: max(1.5rem, env(safe-area-inset-bottom))"
      >
        {{ currentImage.caption }}
      </div>

      <!-- 左右切换按钮：移动端靠滑动切换，这里直接隐藏（原来是靠 .absolute.left-2 选择器做的） -->
      <template v-if="hasMultiple">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="上一张"
          class="absolute top-1/2 left-2 z-20 hidden size-11 -translate-y-1/2 rounded-full bg-white/10 text-white hover:scale-110 hover:bg-white/25 hover:text-white md:flex dark:hover:bg-white/25"
          @click.stop="goPrev"
        >
          <ChevronLeft class="size-7" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="下一张"
          class="absolute top-1/2 right-2 z-20 hidden size-11 -translate-y-1/2 rounded-full bg-white/10 text-white hover:scale-110 hover:bg-white/25 hover:text-white md:flex dark:hover:bg-white/25"
          @click.stop="goNext"
        >
          <ChevronRight class="size-7" />
        </Button>
      </template>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* 项目没装 shadcn spinner，转圈仍用自己的 keyframes（比 Tailwind 默认的 1s 快一点） */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 0.8s linear infinite;
}
</style>
