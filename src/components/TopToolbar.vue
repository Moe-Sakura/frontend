<template>
  <div class="top-toolbar fixed top-4 right-4 z-50 flex items-center gap-2 sm:gap-3">
    <!-- 保存背景图按钮 -->
    <button
      v-show="hasBackgroundImage"
      :aria-label="showSaveTip ? '保存成功' : '保存背景图'"
      class="toolbar-button"
      :class="{ 'save-success': showSaveTip }"
      @click="saveBackgroundImage"
    >
      <component :is="showSaveTip ? Check : Download" :size="20" />
    </button>

    <!-- 分享搜索按钮 -->
    <button
      v-show="hasSearchResults"
      :aria-label="showCopiedTip ? '已复制' : '分享搜索'"
      class="toolbar-button"
      :class="{ 'share-copied': showCopiedTip }"
      @click="shareSearch"
    >
      <component :is="showCopiedTip ? Check : Share2" :size="20" />
    </button>

    <!-- GitHub 按钮 -->
    <a
      href="https://github.com/Moe-Sakura"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="访问 GitHub 仓库"
      class="toolbar-button github-button"
    >
      <Github :size="20" />
    </a>

    <!-- 设置按钮 -->
    <button
      aria-label="设置"
      class="toolbar-button settings-button"
      @click="openSettings"
    >
      <Settings :size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { generateShareURL } from '@/utils/urlParams'
import { Check, Download, Share2, Github, Settings } from 'lucide-vue-next'
import { playClick, playSuccess } from '@/composables/useSound'

const searchStore = useSearchStore()

// Props
const props = defineProps<{
  currentBackgroundUrl?: string
}>()

// Emits
const emit = defineEmits<{
  openSettings: []
}>()

// 状态
const showSaveTip = ref(false)
const showCopiedTip = ref(false)

// 计算属性
const hasBackgroundImage = computed(() => !!props.currentBackgroundUrl)
const hasSearchResults = computed(() => searchStore.hasResults)

// 分享搜索
async function shareSearch() {
  playClick()
  const shareURL = generateShareURL({
    s: searchStore.searchQuery,
    mode: searchStore.searchMode,
    api: searchStore.customApi,
  })
  
  try {
    await navigator.clipboard.writeText(shareURL)
    playSuccess()
    showCopiedTip.value = true
    
    setTimeout(() => {
      showCopiedTip.value = false
    }, 2000)
  } catch (error) {
    const textarea = document.createElement('textarea')
    textarea.value = shareURL
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    
    try {
      document.execCommand('copy')
      showCopiedTip.value = true
      
      setTimeout(() => {
        showCopiedTip.value = false
      }, 2000)
    } catch (err) {
      // 静默处理
    }
    
    document.body.removeChild(textarea)
  }
}

// 打开设置
function openSettings() {
  playClick()
  emit('openSettings')
}

// 保存背景图（使用源格式和文件名）
async function saveBackgroundImage() {
  if (!props.currentBackgroundUrl) {return}
  playClick()
  
  try {
    const response = await fetch(props.currentBackgroundUrl)
    const blob = await response.blob()
    
    // 从 URL 中提取文件名和扩展名
    let filename = 'searchgal-background'
    let extension = 'jpg'
    
    try {
      const url = new URL(props.currentBackgroundUrl)
      const pathname = url.pathname
      const parts = pathname.split('/')
      const lastPart = parts[parts.length - 1]
      
      if (lastPart && lastPart.includes('.')) {
        // 有文件名和扩展名
        const nameParts = lastPart.split('.')
        extension = nameParts.pop() || 'jpg'
        filename = nameParts.join('.')
      } else if (lastPart) {
        // 只有文件名，没有扩展名
        filename = lastPart
      }
      
      // 根据 MIME 类型确定扩展名
      if (blob.type) {
        const mimeToExt: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/gif': 'gif',
          'image/webp': 'webp',
          'image/bmp': 'bmp',
          'image/svg+xml': 'svg',
        }
        extension = mimeToExt[blob.type] || extension
      }
    } catch (e) {
      // URL 解析失败，使用默认值
    }
    
    // 如果文件名太长，截断
    if (filename.length > 50) {
      filename = filename.substring(0, 50)
    }
    
    // 创建下载链接
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}.${extension}`
    link.style.display = 'none'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 100)
    
    playSuccess()
    showSaveTip.value = true
    setTimeout(() => {
      showSaveTip.value = false
    }, 2000)
  } catch (error) {
    // 静默处理
  }
}
</script>

<style scoped>
.toolbar-button {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  position: relative;
  overflow: hidden;
  
  /* WWDC 2025 液态玻璃效果 */
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.15),
    0 0 20px rgba(255, 20, 147, 0.1),
    inset 0 1px 1px rgba(255, 255, 255, 0.6),
    inset 0 -1px 1px rgba(0, 0, 0, 0.05);
  
  color: rgb(199, 21, 133);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  
  /* 性能优化 */
  transform: translate3d(0, 0, 0);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 2.2);
}

/* 液态玻璃高光 */
.toolbar-button::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0.1) 40%,
    transparent 60%
  );
  pointer-events: none;
  opacity: 0.8;
  transition: opacity 0.3s ease;
}

.toolbar-button:hover::before {
  opacity: 1;
}

@media (min-width: 640px) {
  .toolbar-button {
    width: 44px;
    height: 44px;
  }
}

@media (min-width: 768px) {
  .toolbar-button {
    width: 48px;
    height: 48px;
  }
}

/* 暗色主题 */
.dark .toolbar-button {
  background: rgba(30, 30, 40, 0.4);
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 
    0 6px 12px rgba(0, 0, 0, 0.25),
    0 0 20px rgba(255, 105, 180, 0.12),
    inset 0 1px 1px rgba(255, 255, 255, 0.1),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
  color: rgb(255, 179, 217);
}

.dark .toolbar-button::before {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.15) 0%,
    rgba(255, 255, 255, 0.03) 40%,
    transparent 60%
  );
}

.toolbar-button:hover {
  transform: translate3d(0, -3px, 0) scale(1.08);
  box-shadow: 
    0 16px 40px rgba(255, 20, 147, 0.3),
    0 8px 20px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.5);
}

.dark .toolbar-button:hover {
  box-shadow: 
    0 16px 40px rgba(255, 105, 180, 0.35),
    0 8px 20px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.toolbar-button:active {
  transform: translate3d(0, 0, 0) scale(0.95);
}

/* GitHub 按钮特殊样式 */
.github-button {
  text-decoration: none;
}

/* 保存成功状态 - 艳粉渐变 */
.save-success {
  background: linear-gradient(135deg, rgb(236, 72, 153), rgb(219, 39, 119)) !important;
  color: white !important;
  border-color: rgba(236, 72, 153, 0.5) !important;
  box-shadow: 
    0 8px 20px rgba(236, 72, 153, 0.4),
    0 0 30px rgba(236, 72, 153, 0.3) !important;
}

.save-success i {
  color: white !important;
}

/* 分享已复制状态 - 艳粉渐变 */
.share-copied {
  background: linear-gradient(135deg, rgb(236, 72, 153), rgb(219, 39, 119)) !important;
  color: white !important;
  border-color: rgba(236, 72, 153, 0.5) !important;
  box-shadow: 
    0 8px 20px rgba(236, 72, 153, 0.4),
    0 0 30px rgba(236, 72, 153, 0.3) !important;
}

.share-copied i {
  color: white !important;
}
</style>

