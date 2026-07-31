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
      <GithubIcon :size="20" />
    </a>

    <!-- 键盘快捷键按钮 -->
    <button
      aria-label="键盘快捷键"
      class="toolbar-button keyboard-button"
      @click="toggleKeyboardHelp"
    >
      <Keyboard :size="20" />
    </button>

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
import { useUIStore } from '@/stores/ui'
import { generateShareURL } from '@/utils/urlParams'
import { Check, Download, Share2, Keyboard, Settings } from '@lucide/vue'
import GithubIcon from '@/components/GithubIcon.vue'
import {
  playTap,
  playCelebration,
  playNotification,
  playSwipe,
  playCaution,
} from '@/composables/useSound'

const searchStore = useSearchStore()
const uiStore = useUIStore()

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
  playTap()
  const shareURL = generateShareURL({
    s: searchStore.searchQuery,
    mode: searchStore.searchMode,
    api: searchStore.customApi,
  })
  
  try {
    await navigator.clipboard.writeText(shareURL)
    playNotification()
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
      // eslint-disable-next-line @typescript-eslint/no-deprecated
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

// 切换键盘快捷键帮助
function toggleKeyboardHelp() {
  playTap()
  uiStore.toggleKeyboardHelp()
}

// 打开设置
function openSettings() {
  playTap()
  emit('openSettings')
}

/** 文件系统不允许出现在文件名中的字符 */
const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g

/** 图源常把尺寸等信息 URL 编码进文件名，解码失败时原样返回 */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/bmp': 'bmp',
  'image/svg+xml': 'svg',
}

/**
 * 由图片地址与 MIME 推导文件名
 * @param sourceUrl 应传重定向后的最终地址：随机图 API 的入口（/v1/img?t=…）里没有文件名
 */
function buildImageFilename(sourceUrl: string, mimeType: string): string {
  let filename = 'searchgal-background'
  let extension = 'jpg'

  try {
    const rawName = new URL(sourceUrl).pathname.split('/').pop() ?? ''
    // 图源常把尺寸等信息编码进文件名（如 xxx_%5B79%201%5D.avif），先还原再清洗
    const lastPart = safeDecode(rawName)

    if (lastPart.includes('.')) {
      const nameParts = lastPart.split('.')
      extension = nameParts.pop() || extension
      filename = nameParts.join('.')
    } else if (lastPart) {
      filename = lastPart
    }
  } catch {
    // 地址不合法时用默认文件名
  }

  if (mimeType) {
    extension = MIME_TO_EXT[mimeType] || extension
  }

  // 去掉文件名里不能用的字符，并把连续空白压成单个下划线
  filename = filename
    .replace(INVALID_FILENAME_CHARS, '')
    .replace(/\s+/g, '_')
    .replace(/^[._]+|[._]+$/g, '')

  if (!filename) {
    filename = 'searchgal-background'
  }

  // 部分随机图 API 的文件名很长，截断避免超出文件系统限制
  if (filename.length > 50) {
    filename = filename.slice(0, 50)
  }

  return `${filename}.${extension}`
}

function triggerDownload(href: string, filename: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function flashSaveTip() {
  showSaveTip.value = true
  setTimeout(() => {
    showSaveTip.value = false
  }, 2000)
}

// 保存背景图（使用源格式和文件名）
async function saveBackgroundImage() {
  if (!props.currentBackgroundUrl) {return}
  playSwipe()

  try {
    const response = await fetch(props.currentBackgroundUrl)
    if (!response.ok) {throw new Error(`HTTP ${response.status}`)}

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    // response.url 是跟随重定向后的真实图片地址，文件名取它才有意义
    triggerDownload(objectUrl, buildImageFilename(response.url || props.currentBackgroundUrl, blob.type))
    setTimeout(() => { URL.revokeObjectURL(objectUrl) }, 100)

    playCelebration()
    flashSaveTip()
  } catch (error) {
    /*
     * 自定义随机图 API 大多不返回 Access-Control-Allow-Origin，fetch 会被浏览器拦截
     * （背景图本身是 CSS background-image，不受 CORS 限制，所以只有下载会失败）。
     * 跨域时 <a download> 会被忽略，只能退回到新标签页打开原图让用户自行保存。
     */
    console.warn('[TopToolbar] 背景图下载失败（多为图源未开放 CORS），回退到新标签页打开：', error)

    const opened = window.open(props.currentBackgroundUrl, '_blank', 'noopener,noreferrer')
    if (opened) {
      playNotification()
      flashSaveTip()
    } else {
      // 弹窗被拦截，什么都做不了，至少给个失败反馈
      playCaution()
    }
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
  
  /* 半透明效果 */
  background: rgba(var(--color-bg-light, 255, 255, 255), var(--opacity-button, 0.75));
  border: var(--border-thin, 1px) solid rgba(var(--brand-primary, 255, 20, 147), var(--opacity-border, 0.15));
  box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.12));
  
  color: rgb(var(--brand-primary-dark, 199, 21, 133));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  
  /* 性能优化 */
  transform: translate3d(0, 0, 0);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 2.2);
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
  background: rgba(var(--color-bg-dark, 30, 41, 59), var(--opacity-button-dark, 0.75));
  border-color: rgba(var(--brand-primary-light, 255, 105, 180), var(--opacity-border-dark, 0.2));
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  color: rgb(var(--brand-primary-light, 255, 179, 217));
}

.toolbar-button:hover {
  transform: translate3d(0, -3px, 0) scale(1.08);
  box-shadow:
    0 16px 40px rgba(var(--brand-primary, 255, 20, 147), 0.3),
    0 8px 20px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.5);
}

.dark .toolbar-button:hover {
  box-shadow:
    0 16px 40px rgba(var(--brand-primary-light, 255, 105, 180), 0.35),
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

/* 保存成功状态 - 主题色渐变 */
.save-success {
  background: linear-gradient(135deg, rgb(var(--brand-primary)), rgb(var(--brand-primary-dark))) !important;
  color: white !important;
  border-color: rgba(var(--brand-primary), 0.5) !important;
  box-shadow: 
    0 8px 20px rgba(var(--brand-primary), 0.4),
    0 0 30px rgba(var(--brand-primary), 0.3) !important;
}

.save-success i {
  color: white !important;
}

/* 分享已复制状态 - 主题色渐变 */
.share-copied {
  background: linear-gradient(135deg, rgb(var(--brand-primary)), rgb(var(--brand-primary-dark))) !important;
  color: white !important;
  border-color: rgba(var(--brand-primary), 0.5) !important;
  box-shadow: 
    0 8px 20px rgba(var(--brand-primary), 0.4),
    0 0 30px rgba(var(--brand-primary), 0.3) !important;
}

.share-copied i {
  color: white !important;
}
</style>

