<template>
  <!-- 
    #app 样式说明：
    - min-h-screen: 最小高度 100vh
    - relative: 相对定位
    - 字体、行高、换行等样式由 Tailwind 的 @layer base 处理
  -->
  <div 
    id="app" 
    class="min-h-screen relative"
  >
    <!-- 背景层容器 - GPU 加速 -->
    <div
      id="background-container" 
      class="fixed inset-0 z-[-2] overflow-hidden gpu-layer"
    >
      <!-- 默认背景纹理（无图片时显示） -->
      <div
        id="background-pattern"
        class="absolute inset-0 transition-opacity duration-800"
        :class="{ 'opacity-0': hasBackgroundImage }"
      />
      
      <!-- 动画背景图层 - 使用 anime.js + CSS Ken Burns 效果 -->
      <AnimatedBackground
        :image-url="backgroundImageUrl"
        :image-key="currentBgKey"
        :ken-burns-class="kenBurnsClass"
      />
      
      <!-- 半透明遮罩层（提升内容可读性） -->
      <div class="absolute inset-0 bg-white/15 dark:bg-slate-900/30 z-[1]" />
    </div>

    <main class="flex-1 flex flex-col min-h-screen">
      <StatsCorner />
      <TopToolbar :current-background-url="randomImageUrl" @open-settings="openSettings" />
      <SearchHeader ref="searchHeaderRef" />
      <SearchResults />
      <FloatingButtons />
      <CommentsModal />
      <VndbPanel />
      <SearchHistoryModal @select="handleHistorySelect" />
      <SettingsModal
        :is-open="uiStore.isSettingsModalOpen"
        :custom-api="searchStore.customApi"
        :custom-c-s-s="uiStore.customCSS"
        @close="uiStore.isSettingsModalOpen = false"
        @save="saveSettings"
      />

      <!-- 键盘快捷键帮助 -->
      <KeyboardHelpPanel />

      <!-- SW 更新提示 -->
      <UpdateToast
        :is-visible="uiStore.showUpdateToast"
        :on-update="handleSwUpdate"
      />

      <!-- 图片预览器 -->
      <ImageViewer />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, shallowRef } from 'vue'
import AnimatedBackground from '@/components/AnimatedBackground.vue'
import { imageDB } from '@/utils/imageDB'
import { useSearchStore } from '@/stores/search'
import { useUIStore } from '@/stores/ui'
import { 
  saveCustomCSS,
  applyCustomCSS,
} from '@/utils/theme'

// 关键组件 - 同步加载
import StatsCorner from '@/components/StatsCorner.vue'
import TopToolbar from '@/components/TopToolbar.vue'
import SearchHeader from '@/components/SearchHeader.vue'
import SearchResults from '@/components/SearchResults.vue'
import FloatingButtons from '@/components/FloatingButtons.vue'

// 非关键组件 - 异步懒加载（用户交互时才加载）
const CommentsModal = defineAsyncComponent(() => import('@/components/CommentsModal.vue'))
const VndbPanel = defineAsyncComponent(() => import('@/components/VndbPanel.vue'))
const SettingsModal = defineAsyncComponent(() => import('@/components/SettingsModal.vue'))
const SearchHistoryModal = defineAsyncComponent(() => import('@/components/SearchHistoryModal.vue'))
const KeyboardHelpPanel = defineAsyncComponent(() => import('@/components/KeyboardHelpPanel.vue'))
const UpdateToast = defineAsyncComponent(() => import('@/components/UpdateToast.vue'))
const ImageViewer = defineAsyncComponent(() => import('@/components/ImageViewer.vue'))

import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { useClickEffect } from '@/composables/useClickEffect'

// 启用全局快捷键
useKeyboardShortcuts()

// 启用全局点击特效
useClickEffect({
  color: 'rgba(255, 20, 147, 0.35)',
  size: 80,
  duration: 500,
})

const searchStore = useSearchStore()
const uiStore = useUIStore()
const searchHeaderRef = ref<InstanceType<typeof SearchHeader> | null>(null)

// 切换设置面板
function openSettings() {
  uiStore.isSettingsModalOpen = !uiStore.isSettingsModalOpen
}

// 处理历史记录选择
function handleHistorySelect(item: { query: string; mode: 'game' | 'patch' }) {
  // 同步设置 store（用于其他地方读取）
  searchStore.setSearchQuery(item.query)
  searchStore.setSearchMode(item.mode)
  
  // 直接调用 SearchHeader 的搜索方法（会更新 URL 参数）
  searchHeaderRef.value?.searchWithParams(item.query, item.mode)
  
  // 关闭历史模态框
  uiStore.isHistoryModalOpen = false
}

// SW 更新相关
let swRegistration: globalThis.ServiceWorkerRegistration | null = null

function handleSwUpdate() {
  if (swRegistration) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const triggerUpdate = (window as any).triggerSwUpdate
    if (triggerUpdate) {
      triggerUpdate(swRegistration)
    } else {
      window.location.reload()
    }
  } else {
    window.location.reload()
  }
}
const randomImageUrl = ref('')
// 使用 shallowRef 优化大型数据结构的响应式性能
const imageCache = shallowRef<string[]>([])
const imageCacheSet = shallowRef<Set<string>>(new Set()) // 用于快速查重
const imageBlobUrls = shallowRef<Map<string, string>>(new Map()) // URL -> Blob URL 映射
const shuffledQueue = shallowRef<string[]>([])
let fetchInterval: number | null = null
let displayInterval: number | null = null

const MAX_CACHE_SIZE = 10000 // 最大缓存 10000 张图片
const CLEANUP_BATCH_SIZE = 2000 // 每次清理 2000 张
const FETCH_INTERVAL = 5000 // 5秒获取一次
const DISPLAY_INTERVAL = 10000 // 10秒切换一次
const MAX_BLOB_URLS = 20 // 最大同时保持的 Blob URL 数量（内存优化）

// 导入性能优化工具
import { scheduleIdleTask } from '@/composables/usePerformance'

// 背景动画相关
const currentBgKey = ref(0) // 用于触发背景切换动画

// Ken Burns 动画变体（使用 CSS 动画实现更流畅的效果）
type KenBurnsType = 'kb-zoom-in' | 'kb-zoom-out' | 'kb-pan-left' | 'kb-pan-right' | 'kb-pan-up' | 'kb-pan-down'
const currentKenBurns = ref<KenBurnsType>('kb-zoom-in')

// Ken Burns CSS 类
const kenBurnsClass = computed(() => currentKenBurns.value)

// 随机选择 Ken Burns 效果
function selectRandomKenBurns() {
  const effects: KenBurnsType[] = [
    'kb-zoom-in',
    'kb-zoom-out', 
    'kb-pan-left',
    'kb-pan-right',
    'kb-pan-up',
    'kb-pan-down',
  ]
  currentKenBurns.value = effects[Math.floor(Math.random() * effects.length)]
}

const hasBackgroundImage = computed(
  () => !!randomImageUrl.value,
)

const backgroundImageUrl = computed(() => {
  if (randomImageUrl.value) {
    // 优先使用 Blob URL
    return imageBlobUrls.value.get(randomImageUrl.value) || randomImageUrl.value
  }
  return ''
})

// 从 IndexedDB 加载缓存
async function loadCacheFromDB() {
  try {
    await imageDB.init()
    const urls = await imageDB.getAllUrls()
    
    if (urls.length > 0) {
      // 去重处理 - shallowRef 需要重新赋值
      const uniqueUrls = [...new Set(urls)]
      imageCache.value = uniqueUrls
      imageCacheSet.value = new Set(uniqueUrls)
      
      // 预加载部分图片的 Blob URL（前10张）- 使用新 Map 触发更新
      const preloadCount = Math.min(10, uniqueUrls.length)
      const newBlobUrls = new Map(imageBlobUrls.value)
      for (let i = 0; i < preloadCount; i++) {
        const url = uniqueUrls[i]
        const blob = await imageDB.getImageByUrl(url)
        if (blob) {
          const blobUrl = URL.createObjectURL(blob)
          newBlobUrls.set(url, blobUrl)
        }
      }
      imageBlobUrls.value = newBlobUrls
      
      return true
    }
  } catch (error) {
    // 静默处理错误
  }
  return false
}

// Fisher-Yates 洗牌算法
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// 重新洗牌队列
function reshuffleQueue() {
  if (imageCache.value.length > 0) {
    // shallowRef 需要重新赋值才能触发更新
    shuffledQueue.value = shuffleArray([...imageCache.value])
  }
}

// 从 API 获取图片并添加到缓存
async function fetchAndCacheImage() {
  try {
    const timestamp = Date.now()
    const apiUrl = `https://api.illlights.com/v1/img?t=${timestamp}`
    
    // 先通过 fetch 获取最终的图片 URL（处理重定向）
    const response = await fetch(apiUrl)
    if (!response.ok) {return}
    
    const finalUrl = response.url // 获取重定向后的最终 URL
    
    // 使用 Set 快速检查是否已存在
    if (imageCacheSet.value.has(finalUrl)) {
      return // 已存在，跳过
    }
    
    // 检查 IndexedDB 中是否已存在
    const existsInDB = await imageDB.hasUrl(finalUrl)
    if (existsInDB) {
      return // 已存在，跳过
    }
    
    // 获取图片 Blob
    const blob = await response.blob()
    
    // 验证是否为有效图片
    const img = new Image()
    const blobUrl = URL.createObjectURL(blob)
    
    img.onload = async () => {
      // 再次检查是否重复（防止并发请求）
      if (!imageCacheSet.value.has(finalUrl)) {
        try {
          // 保存到 IndexedDB
          await imageDB.addImage(finalUrl, blob)
          
          // 添加到内存缓存 - shallowRef 需要重新赋值触发更新
          const newCache = [...imageCache.value, finalUrl]
          const newCacheSet = new Set(imageCacheSet.value)
          newCacheSet.add(finalUrl)
          const newBlobUrls = new Map(imageBlobUrls.value)
          newBlobUrls.set(finalUrl, blobUrl)
          
          imageCache.value = newCache
          imageCacheSet.value = newCacheSet
          imageBlobUrls.value = newBlobUrls
          
          // 限制缓存大小 - 大于 10000 张即清理最早的 2000 张
          const count = await imageDB.getCount()
          if (count > MAX_CACHE_SIZE) {
            // 批量删除最旧的 2000 张图片
            const deletedCount = await imageDB.deleteOldestBatch(CLEANUP_BATCH_SIZE)
            
            // 同步更新内存缓存 - 移除前 deletedCount 张
            const cleanedCache = imageCache.value.slice(deletedCount)
            const cleanedSet = new Set(cleanedCache)
            const cleanedBlobUrls = new Map<string, string>()
            
            // 清理被删除图片的 Blob URL
            for (let i = 0; i < deletedCount; i++) {
              const removed = imageCache.value[i]
              if (removed) {
                const oldBlobUrl = imageBlobUrls.value.get(removed)
                if (oldBlobUrl) {
                  URL.revokeObjectURL(oldBlobUrl)
                }
              }
            }
            
            // 保留剩余的 Blob URL
            imageBlobUrls.value.forEach((url, key) => {
              if (cleanedSet.has(key)) {
                cleanedBlobUrls.set(key, url)
                }
            })
            
            imageCache.value = cleanedCache
            imageCacheSet.value = cleanedSet
            imageBlobUrls.value = cleanedBlobUrls
          }
          
          // 如果队列为空，重新洗牌
          if (shuffledQueue.value.length === 0) {
            reshuffleQueue()
          }
        } catch (error) {
          // IndexedDB 操作失败，清理 Blob URL
          URL.revokeObjectURL(blobUrl)
        }
      } else {
        // 已存在，清理 Blob URL
        URL.revokeObjectURL(blobUrl)
      }
    }
    
    img.onerror = () => {
      // 图片加载失败，清理 Blob URL
      URL.revokeObjectURL(blobUrl)
    }
    
    img.src = blobUrl
  } catch (error) {
    // 静默处理错误
  }
}

// 清理过多的 Blob URL 以释放内存
function cleanupBlobUrls(currentUrl: string) {
  const blobUrls = imageBlobUrls.value
  if (blobUrls.size <= MAX_BLOB_URLS) { return }
  
  // 创建新 Map，保留当前使用的 URL
  const newBlobUrls = new Map<string, string>()
  newBlobUrls.set(currentUrl, blobUrls.get(currentUrl)!)
  
  // 保留最近添加的 URL（Map 保持插入顺序）
  const entries = Array.from(blobUrls.entries())
  const toKeep = entries.slice(-MAX_BLOB_URLS + 1) // 保留最后 N-1 个
  
  // 释放旧的 Blob URL
  for (const [url, blobUrl] of entries) {
    if (url !== currentUrl && !toKeep.some(([u]) => u === url)) {
      URL.revokeObjectURL(blobUrl)
    } else if (url !== currentUrl) {
      newBlobUrls.set(url, blobUrl)
    }
  }
  
  imageBlobUrls.value = newBlobUrls
}

// 从洗牌队列中取出下一张图片（预加载后再切换）
async function displayNextImage() {
  // 如果队列为空，重新洗牌
  if (shuffledQueue.value.length === 0) {
    if (imageCache.value.length === 0) {
      return // 没有可用图片
    }
    reshuffleQueue()
  }
  
  // 从队列中取出第一张图片 - shallowRef 需要重新赋值
  const queue = [...shuffledQueue.value]
  const nextImageUrl = queue.shift()
  shuffledQueue.value = queue
  
  if (!nextImageUrl) {return}
  
  try {
    // 检查是否已有 Blob URL
    let blobUrl = imageBlobUrls.value.get(nextImageUrl)
    
    // 如果没有，从 IndexedDB 加载
    if (!blobUrl) {
      const blob = await imageDB.getImageByUrl(nextImageUrl)
      if (blob) {
        blobUrl = URL.createObjectURL(blob)
        // shallowRef 需要重新赋值
        const newBlobUrls = new Map(imageBlobUrls.value)
        newBlobUrls.set(nextImageUrl, blobUrl)
        imageBlobUrls.value = newBlobUrls
      }
    }
    
    // 预加载图片，确保加载完成后再切换
    const preloadImg = new Image()
    preloadImg.onload = () => {
      // 选择随机 Ken Burns 效果
      selectRandomKenBurns()
      
      // 图片加载完成，更新 key 触发动画
      randomImageUrl.value = nextImageUrl
      currentBgKey.value++
      
      // 清理过多的 Blob URL 以释放内存
      cleanupBlobUrls(nextImageUrl)
    }
    preloadImg.onerror = () => {
      // 加载失败，尝试下一张
      displayNextImage()
    }
    preloadImg.src = blobUrl || nextImageUrl
  } catch (error) {
    // 加载失败，尝试下一张
    displayNextImage()
  }
}

// 启动图片获取定时器
function startFetchInterval() {
  if (fetchInterval) {
    clearInterval(fetchInterval)
  }
  
  // 立即获取第一张
  fetchAndCacheImage()
  
  fetchInterval = window.setInterval(() => {
    fetchAndCacheImage()
  }, FETCH_INTERVAL)
}

// 启动图片显示定时器
function startDisplayInterval() {
  if (displayInterval) {
    clearInterval(displayInterval)
  }
  
  // 立即显示第一张
  displayNextImage()
  
  displayInterval = window.setInterval(() => {
    displayNextImage()
  }, DISPLAY_INTERVAL)
}

// 停止所有定时器
function stopAllIntervals() {
  if (fetchInterval) {
    clearInterval(fetchInterval)
    fetchInterval = null
  }
  if (displayInterval) {
    clearInterval(displayInterval)
    displayInterval = null
  }
}

onMounted(async () => {
  // === 关键任务：立即执行 ===
  
  // 初始化 UI Store（恢复持久化状态 + 会话状态）
  uiStore.init()
  
  // URL hash 优先级最高 - 覆盖会话状态
  const hash = window.location.hash
  if (hash.startsWith('#atk-comment-')) {
    // 评论链接：打开评论面板
    uiStore.isCommentsModalOpen = true
  }

  // 恢复保存的搜索状态
  searchStore.restoreState()
  
  // === 非关键任务：空闲时执行 ===
  
  scheduleIdleTask(() => {
  // 应用自定义 CSS
  if (uiStore.customCSS) {
    applyCustomCSS(uiStore.customCSS)
  }

  // 监听 SW 更新事件
  window.addEventListener('sw-update-available', (event) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const customEvent = event as any
    swRegistration = customEvent.detail?.registration || null
    uiStore.setShowUpdateToast(true)
  })
  }, { timeout: 2000 })
  
  // === 背景图片初始化：稍后执行 ===
  
  // 初始化 IndexedDB
  await imageDB.init()
  
  // 加载缓存
  const hasCachedImages = await loadCacheFromDB()
  
  // 如果有缓存，初始化洗牌队列
  if (hasCachedImages) {
    reshuffleQueue()
  }
  
  // 启动定时器
  startFetchInterval()
  startDisplayInterval()
})

onUnmounted(() => {
  stopAllIntervals()
  
  // 清理所有 Blob URL
  imageBlobUrls.value.forEach(blobUrl => {
    URL.revokeObjectURL(blobUrl)
  })
  imageBlobUrls.value.clear()
  
  // 关闭数据库连接
  imageDB.close()
})

// 设置相关函数
function saveSettings(customApi: string, newCustomCSS: string) {
  // 保存自定义 API 到 search store
  searchStore.setCustomApi(customApi)
  // 保存自定义 CSS 到 UI store（会自动持久化）
  uiStore.setCustomCSS(newCustomCSS)
  // 同时保存到旧的 localStorage key（兼容性）
  saveCustomCSS(newCustomCSS)
  // 应用到页面
  applyCustomCSS(newCustomCSS)
}
</script>

<style>
@import "tailwindcss";

/* Ken Burns 动画效果 - 使用 CSS 动画实现更流畅的背景切换 */
.ken-burns {
  /* 初始状态 - 稍微放大以便动画有空间 */
  transform-origin: center center;
}

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
    animation: none !important;
    transform: scale(1.05) !important;
  }
}
</style>
