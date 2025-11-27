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
    <!-- 背景层 -->
    <div
      id="background-layer"
      :class="{ 'has-image': hasBackgroundImage }"
      :style="backgroundStyle"
    />

    <main class="flex-1 flex flex-col min-h-screen">
      <StatsCorner />
      <TopToolbar :current-background-url="randomImageUrl" @open-settings="openSettings" />
      <SearchHeader ref="searchHeaderRef" />
      <SearchResults />
      <FloatingButtons />
      <CommentsModal />
      <VndbPanel />
      <SettingsModal
        :is-open="isSettingsOpen"
        :custom-api="searchStore.customApi"
        :custom-c-s-s="customCSS"
        @close="closeSettings"
        @save="saveSettings"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { imageDB } from '@/utils/imageDB'
import { useSearchStore } from '@/stores/search'
import { 
  getSystemTheme,
  applyTheme, 
  watchSystemTheme,
  loadCustomCSS,
  saveCustomCSS,
  applyCustomCSS,
} from '@/utils/theme'
import StatsCorner from '@/components/StatsCorner.vue'
import TopToolbar from '@/components/TopToolbar.vue'
import SearchHeader from '@/components/SearchHeader.vue'
import SearchResults from '@/components/SearchResults.vue'
import FloatingButtons from '@/components/FloatingButtons.vue'
import CommentsModal from '@/components/CommentsModal.vue'
import VndbPanel from '@/components/VndbPanel.vue'
import SettingsModal from '@/components/SettingsModal.vue'

const searchStore = useSearchStore()
const randomImageUrl = ref('')
const imageCache = ref<string[]>([])
const imageCacheSet = ref<Set<string>>(new Set()) // 用于快速查重
const imageBlobUrls = ref<Map<string, string>>(new Map()) // URL -> Blob URL 映射
const shuffledQueue = ref<string[]>([])
let fetchInterval: number | null = null
let displayInterval: number | null = null
let systemThemeCleanup: (() => void) | null = null

// 设置模态框
const isSettingsOpen = ref(false)
const customCSS = ref('')

const MAX_CACHE_SIZE = 10000 // 最大缓存 10000 张图片
const CLEANUP_BATCH_SIZE = 2000 // 每次清理 2000 张
const FETCH_INTERVAL = 5000 // 5秒获取一次
const DISPLAY_INTERVAL = 10000 // 10秒切换一次

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

const backgroundStyle = computed(() => {
  const url = backgroundImageUrl.value
  if (url) {
    return {
      backgroundImage: `url(${url})`,
      // 平滑过渡，与 CSS 保持一致
      transition: 'background-image 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
    }
  }
  return {}
})

// 从 IndexedDB 加载缓存
async function loadCacheFromDB() {
  try {
    await imageDB.init()
    const urls = await imageDB.getAllUrls()
    
    if (urls.length > 0) {
      // 去重处理
      const uniqueUrls = [...new Set(urls)]
      imageCache.value = uniqueUrls
      imageCacheSet.value = new Set(uniqueUrls)
      
      // 预加载部分图片的 Blob URL（前10张）
      const preloadCount = Math.min(10, uniqueUrls.length)
      for (let i = 0; i < preloadCount; i++) {
        const url = uniqueUrls[i]
        const blob = await imageDB.getImageByUrl(url)
        if (blob) {
          const blobUrl = URL.createObjectURL(blob)
          imageBlobUrls.value.set(url, blobUrl)
        }
      }
      
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
    shuffledQueue.value = shuffleArray(imageCache.value)
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
          
          // 添加到内存缓存
          imageCache.value.push(finalUrl)
          imageCacheSet.value.add(finalUrl)
          imageBlobUrls.value.set(finalUrl, blobUrl)
          
          // 限制缓存大小 - 大于 10000 张即清理最早的 2000 张
          const count = await imageDB.getCount()
          if (count > MAX_CACHE_SIZE) {
            // 批量删除最旧的 2000 张图片
            const deletedCount = await imageDB.deleteOldestBatch(CLEANUP_BATCH_SIZE)
            
            // 同步更新内存缓存 - 移除前 deletedCount 张
            for (let i = 0; i < deletedCount; i++) {
              const removed = imageCache.value.shift()
              if (removed) {
                imageCacheSet.value.delete(removed)
                const oldBlobUrl = imageBlobUrls.value.get(removed)
                if (oldBlobUrl) {
                  URL.revokeObjectURL(oldBlobUrl)
                  imageBlobUrls.value.delete(removed)
                }
              }
            }
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

// 转场动画类型
const transitionTypes = [
  'transition-fade',
  'transition-zoom',
  'transition-slide-left',
  'transition-slide-right',
  'transition-blur',
  'transition-rotate',
]

// 随机选择转场动画
function getRandomTransition(): string {
  return transitionTypes[Math.floor(Math.random() * transitionTypes.length)]
}

// 应用转场动画
function applyTransition() {
  const bgLayer = document.getElementById('background-layer')
  if (!bgLayer) {return}
  
  const transitionClass = getRandomTransition()
  bgLayer.classList.add(transitionClass)
  
  // 动画结束后移除类
  setTimeout(() => {
    bgLayer.classList.remove(transitionClass)
  }, 1500) // 最长动画时间
}

// 重启慢慢放大动画
function restartSlowZoom() {
  const bgLayer = document.getElementById('background-layer')
  if (!bgLayer) {return}
  
  // 移除动画，触发重排
  bgLayer.style.animation = 'none'
  // 强制重排
  void bgLayer.offsetHeight
  // 重新应用动画
  bgLayer.style.animation = 'slowZoom 10s ease-out forwards'
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
  
  // 从队列中取出第一张图片
  const nextImageUrl = shuffledQueue.value.shift()
  if (!nextImageUrl) {return}
  
  try {
    // 检查是否已有 Blob URL
    let blobUrl = imageBlobUrls.value.get(nextImageUrl)
    
    // 如果没有，从 IndexedDB 加载
    if (!blobUrl) {
      const blob = await imageDB.getImageByUrl(nextImageUrl)
      if (blob) {
        blobUrl = URL.createObjectURL(blob)
        imageBlobUrls.value.set(nextImageUrl, blobUrl)
      }
    }
    
    // 预加载图片，确保加载完成后再切换
    const preloadImg = new Image()
    preloadImg.onload = () => {
      // 应用随机转场动画
      applyTransition()
      
      // 图片加载完成，平滑切换
      randomImageUrl.value = nextImageUrl
      
      // 重启慢慢放大动画
      setTimeout(() => {
        restartSlowZoom()
      }, 100) // 等待图片切换完成
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
  // 初始化主题 - 跟随系统
  const systemTheme = getSystemTheme()
  applyTheme(systemTheme)
  
  // 加载并应用自定义CSS
  customCSS.value = loadCustomCSS()
  applyCustomCSS(customCSS.value)
  
  // 监听系统主题变化
  systemThemeCleanup = watchSystemTheme((theme) => {
    applyTheme(theme)
  })
  
  // 恢复保存的搜索状态
  searchStore.restoreState()
  
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
  
  // 清理系统主题监听
  if (systemThemeCleanup) {
    systemThemeCleanup()
    systemThemeCleanup = null
  }
  
  // 清理所有 Blob URL
  imageBlobUrls.value.forEach(blobUrl => {
    URL.revokeObjectURL(blobUrl)
  })
  imageBlobUrls.value.clear()
  
  // 关闭数据库连接
  imageDB.close()
})

// 设置相关函数
function openSettings() {
  isSettingsOpen.value = true
}

function closeSettings() {
  isSettingsOpen.value = false
}

function saveSettings(customApi: string, newCustomCSS: string) {
  // 保存自定义 API 到 store
  searchStore.setCustomApi(customApi)
  // 保存并应用自定义CSS
  customCSS.value = newCustomCSS
  saveCustomCSS(newCustomCSS) // 保存到 localStorage
  applyCustomCSS(newCustomCSS) // 应用到页面
}
</script>

<style>
@import "tailwindcss";
</style>
