/**
 * 背景图片管理 composable
 * 简单的定时获取随机图片，失败时保持上一张
 * 
 * 自动参数：
 * - name: 跟随 VNDB 获取到的作品名
 * - maxbrightness: 暗色模式自动设为 0.5
 * - view: 移动端自动使用 vertical 模式
 */

import { ref, computed } from 'vue'
import { useSettingsStore, DEFAULT_API_CONFIG } from '@/stores/settings'
import { useSearchStore } from '@/stores/search'
import { useUIStore } from '@/stores/ui'

// Ken Burns 动画变体类型
export type KenBurnsType = 
  | 'kb-zoom-in' 
  | 'kb-zoom-out' 
  | 'kb-pan-left' 
  | 'kb-pan-right' 
  | 'kb-pan-up' 
  | 'kb-pan-down'

// 配置常量
const CONFIG = {
  DISPLAY_INTERVAL: 30000, // 30秒切换一次
  MOBILE_BREAKPOINT: 768,  // 移动端断点
} as const

// Ken Burns 效果列表
const KEN_BURNS_EFFECTS: KenBurnsType[] = [
  'kb-zoom-in',
  'kb-zoom-out',
  'kb-pan-left',
  'kb-pan-right',
  'kb-pan-up',
  'kb-pan-down',
]

// 检测是否为移动端
function isMobile(): boolean {
  return window.innerWidth < CONFIG.MOBILE_BREAKPOINT
}

export function useBackgroundImage() {
  const settingsStore = useSettingsStore()
  const searchStore = useSearchStore()
  const uiStore = useUIStore()
  
  // 状态
  const currentImageUrl = ref('')
  const currentBgKey = ref(0)
  const currentKenBurns = ref<KenBurnsType>('kb-zoom-in')
  
  // 定时器
  let displayInterval: number | null = null

  // 计算属性
  const hasBackgroundImage = computed(() => !!currentImageUrl.value)
  const backgroundImageUrl = computed(() => currentImageUrl.value)
  const kenBurnsClass = computed(() => currentKenBurns.value)

  // 随机选择 Ken Burns 效果
  function selectRandomKenBurns() {
    currentKenBurns.value = KEN_BURNS_EFFECTS[Math.floor(Math.random() * KEN_BURNS_EFFECTS.length)]
  }

  // 参数级别配置
  interface UrlOptions {
    includeName?: boolean
    includeBrightness?: boolean
    includeView?: boolean
  }

  // 构建 API URL（自动参数）
  function buildApiUrl(options: UrlOptions = {}): string {
    const { includeName = true, includeBrightness = true, includeView = true } = options
    const baseUrl = settingsStore.settings.backgroundImageApiUrl || DEFAULT_API_CONFIG.backgroundImageApiUrl
    const params = new URLSearchParams()
    
    // 添加时间戳防止缓存
    params.set('t', Date.now().toString())
    
    // 来源作品 - 跟随用户输入框内容
    if (includeName) {
      const searchQuery = searchStore.searchQuery?.trim()
      if (searchQuery) {
        params.set('name', searchQuery)
      }
    }
    
    // 暗色模式 - 自动添加最大亮度 0.5
    if (includeBrightness && uiStore.isDarkMode) {
      params.set('maxbrightness', '0.5')
    }
    
    // 移动端 - 使用 vertical 视图模式
    if (includeView && isMobile()) {
      params.set('view', 'vertical')
    }
    
    return `${baseUrl}?${params.toString()}`
  }

  // 检查是否有来源作品参数
  function hasNameParam(): boolean {
    return !!searchStore.searchQuery?.trim()
  }

  // 加载图片
  function loadImage(apiUrl: string, onSuccess: () => void, onError: () => void) {
    const img = new Image()
    img.onload = onSuccess
    img.onerror = onError
    img.src = apiUrl
  }

  // 更新背景图显示
  function updateBackground(apiUrl: string) {
    selectRandomKenBurns()
    currentImageUrl.value = apiUrl
    currentBgKey.value++
  }

  // 获取并显示下一张图片（三级重试）
  function fetchNextImage() {
    // 第一级：所有参数
    const url1 = buildApiUrl({ includeName: true, includeBrightness: true, includeView: true })
    
    loadImage(url1, () => updateBackground(url1), () => {
      // 第二级：只保留 name，去掉亮度和视图模式
      if (hasNameParam()) {
        const url2 = buildApiUrl({ includeName: true, includeBrightness: false, includeView: false })
        
        loadImage(url2, () => updateBackground(url2), () => {
          // 第三级：去掉 name（只保留时间戳）
          const url3 = buildApiUrl({ includeName: false, includeBrightness: false, includeView: false })
          
          loadImage(url3, () => updateBackground(url3), () => {
            // 全部失败，保持当前图片不变
          })
        })
      } else {
        // 没有 name 参数，直接尝试基础 URL
        const url3 = buildApiUrl({ includeName: false, includeBrightness: false, includeView: false })
        
        loadImage(url3, () => updateBackground(url3), () => {
          // 失败，保持当前图片不变
        })
      }
    })
  }

  // 启动定时器
  function startInterval() {
    if (displayInterval) {
      clearInterval(displayInterval)
    }
    
    // 立即获取第一张
    fetchNextImage()
    
    // 定时获取下一张
    displayInterval = window.setInterval(() => {
      fetchNextImage()
    }, CONFIG.DISPLAY_INTERVAL)
  }

  // 停止定时器
  function stopInterval() {
    if (displayInterval) {
      clearInterval(displayInterval)
      displayInterval = null
    }
  }

  // 初始化
  async function init() {
    startInterval()
  }

  // 销毁
  function destroy() {
    stopInterval()
  }

  return {
    // 状态
    currentImageUrl,
    currentBgKey,
    
    // 计算属性
    hasBackgroundImage,
    backgroundImageUrl,
    kenBurnsClass,
    
    // 方法
    init,
    destroy,
  }
}
