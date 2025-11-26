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
      <i :class="showSaveTip ? 'fas fa-check' : 'fas fa-download'" class="text-lg sm:text-xl" />
    </button>

    <!-- 分享搜索按钮 -->
    <button
      v-show="hasSearchResults"
      :aria-label="showCopiedTip ? '已复制' : '分享搜索'"
      class="toolbar-button"
      :class="{ 'share-copied': showCopiedTip }"
      @click="shareSearch"
    >
      <i :class="showCopiedTip ? 'fas fa-check' : 'fas fa-share-alt'" class="text-lg sm:text-xl" />
    </button>

    <!-- GitHub 按钮 -->
    <a
      href="https://github.com/Moe-Sakura"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="访问 GitHub 仓库"
      class="toolbar-button github-button"
    >
      <i class="fab fa-github text-lg sm:text-xl" />
    </a>

    <!-- 设置按钮 -->
    <button
      aria-label="设置"
      class="toolbar-button settings-button"
      @click="openSettings"
    >
      <i class="fas fa-cog text-lg sm:text-xl" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSearchStore } from '@/stores/search'
import { generateShareURL } from '@/utils/urlParams'

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
  const shareURL = generateShareURL({
    s: searchStore.searchQuery,
    mode: searchStore.searchMode,
    api: searchStore.customApi,
  })
  
  try {
    await navigator.clipboard.writeText(shareURL)
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
  emit('openSettings')
}

// 保存背景图（使用源格式和文件名）
async function saveBackgroundImage() {
  if (!props.currentBackgroundUrl) {return}
  
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
  background: white;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
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
  background: rgba(31, 41, 55, 0.9);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.toolbar-button:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  border-color: rgba(236, 72, 153, 0.5);
}

.dark .toolbar-button:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
  border-color: rgba(168, 85, 247, 0.5);
}

.toolbar-button:active {
  transform: scale(0.95);
}

/* GitHub 按钮特殊样式 */
.github-button {
  color: rgb(31, 41, 55);
  text-decoration: none;
}

.dark .github-button {
  color: rgb(226, 232, 240);
}

.github-button:hover {
  border-color: rgba(31, 41, 55, 0.5);
}

.dark .github-button:hover {
  border-color: rgba(226, 232, 240, 0.5);
}

/* 主题按钮特殊样式 */
.theme-button:hover {
  border-color: rgba(245, 158, 11, 0.5);
}

/* 保存成功状态 */
.save-success {
  background: linear-gradient(135deg, rgb(16, 185, 129), rgb(5, 150, 105)) !important;
  color: white !important;
}

.save-success i {
  color: white !important;
}

/* 分享已复制状态 */
.share-copied {
  background: linear-gradient(135deg, rgb(16, 185, 129), rgb(5, 150, 105)) !important;
  color: white !important;
}

.share-copied i {
  color: white !important;
}
</style>

