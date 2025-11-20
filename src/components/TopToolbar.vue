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
      href="https://github.com/Moe-Sakura/SearchGal"
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

    <!-- 主题切换按钮 -->
    <button
      :aria-label="`切换主题: ${getThemeLabel(themeMode)}`"
      class="toolbar-button theme-button"
      @click="cycleTheme"
    >
      <Transition
        mode="out-in"
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 scale-50 rotate-90"
        enter-to-class="opacity-100 scale-100 rotate-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 scale-100 rotate-0"
        leave-to-class="opacity-0 scale-50 -rotate-90"
      >
        <i
          v-if="themeMode === 'light'"
          key="light"
          class="fas fa-sun text-yellow-500 text-lg sm:text-xl"
        />
        <i
          v-else-if="themeMode === 'dark'"
          key="dark"
          class="fas fa-moon text-indigo-500 text-lg sm:text-xl"
        />
        <i
          v-else
          key="auto"
          class="fas fa-circle-half-stroke text-gray-600 dark:text-gray-400 text-lg sm:text-xl"
        />
      </Transition>
    </button>
    
    <!-- 主题提示 -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 translate-x-2"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-2"
    >
      <div
        v-if="showThemeTip"
        class="absolute top-1/2 -translate-y-1/2 right-full mr-3 px-3 py-1.5 rounded-lg bg-white/75 dark:bg-gray-800/75 backdrop-blur-xl shadow-lg border border-gray-200 dark:border-gray-700 whitespace-nowrap"
      >
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ getThemeLabel(themeMode) }}
        </span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useSearchStore } from '@/stores/search'
import { generateShareURL } from '@/utils/urlParams'
import {
  type ThemeMode,
  loadThemePreference,
  saveThemePreference,
  getEffectiveTheme,
  applyTheme,
  watchSystemTheme,
} from '@/utils/theme'

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
const showThemeTip = ref(false)
const themeMode = ref<ThemeMode>('auto')

let systemThemeCleanup: (() => void) | null = null
let tipTimeout: number | null = null

// 计算属性
const hasBackgroundImage = computed(() => !!props.currentBackgroundUrl)
const hasSearchResults = computed(() => searchStore.hasResults)

// 主题相关函数
function getThemeLabel(mode: ThemeMode): string {
  const labels = {
    light: '白天模式',
    dark: '黑夜模式',
    auto: '跟随系统',
  }
  return labels[mode]
}

function cycleTheme() {
  const modes: ThemeMode[] = ['light', 'dark', 'auto']
  const currentIndex = modes.indexOf(themeMode.value)
  const nextIndex = (currentIndex + 1) % modes.length
  themeMode.value = modes[nextIndex]
  
  showThemeTip.value = true
  if (tipTimeout) {
    clearTimeout(tipTimeout)
  }
  tipTimeout = window.setTimeout(() => {
    showThemeTip.value = false
  }, 1500)
}

function updateTheme() {
  const effectiveTheme = getEffectiveTheme(themeMode.value)
  applyTheme(effectiveTheme)
  saveThemePreference(themeMode.value)
}

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

// 生命周期
onMounted(() => {
  themeMode.value = loadThemePreference()
  updateTheme()
  
  systemThemeCleanup = watchSystemTheme(() => {
    if (themeMode.value === 'auto') {
      updateTheme()
    }
  })
})

onUnmounted(() => {
  if (systemThemeCleanup) {
    systemThemeCleanup()
  }
  if (tipTimeout) {
    clearTimeout(tipTimeout)
  }
})

watch(themeMode, () => {
  updateTheme()
})
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

