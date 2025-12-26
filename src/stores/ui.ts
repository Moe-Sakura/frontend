import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

// 主题模式类型
export type ThemeMode = 'system' | 'light' | 'dark'

// 持久化的 UI 状态类型
export interface PersistedUIState {
  // 主题
  themeMode: ThemeMode
  isDarkMode: boolean
  customCSS: string
  
  // 模态框状态
  isCommentsModalOpen: boolean
  isVndbPanelOpen: boolean
  isSettingsModalOpen: boolean
  isHistoryModalOpen: boolean
  isKeyboardHelpOpen: boolean
  
  // 其他 UI 状态
  showSearchHistory: boolean
  showPlatformNav: boolean
  
  // 滚动位置
  scrollPosition: number
  
  // 时间戳
  lastVisitTime: number
}

const STORAGE_KEY = 'ui-state'
const SESSION_KEY = 'ui-session-state'

// 默认持久化状态
const DEFAULT_PERSISTED_STATE: PersistedUIState = {
  themeMode: 'system',
  isDarkMode: false,
  customCSS: '',
  isCommentsModalOpen: false,
  isVndbPanelOpen: false,
  isSettingsModalOpen: false,
  isHistoryModalOpen: false,
  isKeyboardHelpOpen: false,
  showSearchHistory: true,
  showPlatformNav: false,
  scrollPosition: 0,
  lastVisitTime: 0,
}

export const useUIStore = defineStore('ui', () => {
  // 是否已初始化
  const isInitialized = ref(false)

  // 主题相关
  const themeMode = ref<ThemeMode>('system')
  const isDarkMode = ref(false)
  const customCSS = ref('')
  let systemThemeCleanup: (() => void) | null = null
  
  // 模态框状态
  const isCommentsModalOpen = ref(false)
  const isVndbPanelOpen = ref(false)
  const isSettingsModalOpen = ref(false)
  const isHistoryModalOpen = ref(false)
  const isKeyboardHelpOpen = ref(false)
  
  // 浮动按钮状态
  const showScrollToTop = ref(false)
  const showPlatformNav = ref(false)
  
  // 搜索历史显示
  const showSearchHistory = ref(true)
  
  // 背景图片
  const currentBackgroundImage = ref('')
  const backgroundImageLoaded = ref(false)
  
  // 加载状态
  const isLoading = ref(false)
  const loadingMessage = ref('')

  // SW 更新状态
  const showUpdateToast = ref(false)
  
  // 滚动位置（用于恢复）
  const scrollPosition = ref(0)
  
  // Toast 通知
  const toasts = ref<Array<{
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    message: string
    duration: number
  }>>([])
  
  // 计算属性
  const hasOpenModal = computed(() => 
    isCommentsModalOpen.value || 
    isVndbPanelOpen.value || 
    isSettingsModalOpen.value ||
    isHistoryModalOpen.value,
  )
  
  const activeModalsCount = computed(() => {
    let count = 0
    if (isCommentsModalOpen.value) {count++}
    if (isVndbPanelOpen.value) {count++}
    if (isSettingsModalOpen.value) {count++}
    if (isHistoryModalOpen.value) {count++}
    return count
  })
  
  // 方法 - 主题
  
  /**
   * 获取系统主题偏好
   */
  function getSystemTheme(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  /**
   * 应用主题到 DOM
   */
  function applyTheme(dark: boolean) {
    isDarkMode.value = dark
    document.documentElement.classList.toggle('dark', dark)
  }
  
  /**
   * 设置主题模式
   */
  function setThemeMode(mode: ThemeMode) {
    themeMode.value = mode
    
    // 清理之前的系统主题监听
    if (systemThemeCleanup) {
      systemThemeCleanup()
      systemThemeCleanup = null
    }
    
    if (mode === 'system') {
      // 应用系统主题
      applyTheme(getSystemTheme())
      
      // 监听系统主题变化
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        if (themeMode.value === 'system') {
          applyTheme(e.matches)
        }
      }
      mediaQuery.addEventListener('change', handler)
      systemThemeCleanup = () => mediaQuery.removeEventListener('change', handler)
    } else {
      // 应用固定主题
      applyTheme(mode === 'dark')
    }
  }
  
  function toggleDarkMode() {
    // 切换主题模式：system -> light -> dark -> system
    const modes: ThemeMode[] = ['system', 'light', 'dark']
    const currentIndex = modes.indexOf(themeMode.value)
    const nextIndex = (currentIndex + 1) % modes.length
    setThemeMode(modes[nextIndex])
  }
  
  function setDarkMode(value: boolean) {
    setThemeMode(value ? 'dark' : 'light')
  }
  
  function setCustomCSS(css: string) {
    customCSS.value = css
  }
  
  // 方法 - 模态框
  function toggleCommentsModal() {
    isCommentsModalOpen.value = !isCommentsModalOpen.value
  }
  
  function toggleVndbPanel() {
    isVndbPanelOpen.value = !isVndbPanelOpen.value
  }
  
  function toggleSettingsModal() {
    isSettingsModalOpen.value = !isSettingsModalOpen.value
  }
  
  function closeAllModals() {
    isCommentsModalOpen.value = false
    isVndbPanelOpen.value = false
    isSettingsModalOpen.value = false
    isHistoryModalOpen.value = false
    isKeyboardHelpOpen.value = false
  }
  
  function toggleHistoryModal() {
    isHistoryModalOpen.value = !isHistoryModalOpen.value
  }
  
  // 方法 - 浮动按钮
  function setShowScrollToTop(show: boolean) {
    showScrollToTop.value = show
  }
  
  function togglePlatformNav() {
    showPlatformNav.value = !showPlatformNav.value
  }
  
  function closePlatformNav() {
    showPlatformNav.value = false
  }
  
  // 方法 - 搜索历史
  function toggleSearchHistory() {
    showSearchHistory.value = !showSearchHistory.value
  }
  
  // 方法 - 背景图片
  function setBackgroundImage(url: string) {
    currentBackgroundImage.value = url
  }
  
  function setBackgroundImageLoaded(loaded: boolean) {
    backgroundImageLoaded.value = loaded
  }
  
  // 方法 - 加载状态
  function setLoading(loading: boolean, message = '') {
    isLoading.value = loading
    loadingMessage.value = message
  }
  
  // 方法 - Toast 通知
  function showToast(
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    duration = 3000,
  ) {
    const id = `toast-${Date.now()}-${Math.random()}`
    toasts.value.push({ id, type, message, duration })
    
    // 自动移除
    setTimeout(() => {
      removeToast(id)
    }, duration)
    
    return id
  }
  
  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }
  
  function clearToasts() {
    toasts.value = []
  }
  
  // 从 localStorage 加载持久化状态（长期偏好）
  function loadPersistedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: Partial<PersistedUIState> = JSON.parse(saved)
        themeMode.value = parsed.themeMode ?? DEFAULT_PERSISTED_STATE.themeMode
        customCSS.value = parsed.customCSS ?? DEFAULT_PERSISTED_STATE.customCSS
        showSearchHistory.value = parsed.showSearchHistory ?? DEFAULT_PERSISTED_STATE.showSearchHistory
      }
    } catch {
      // 解析失败，使用默认值
    }
  }

  // 从 sessionStorage 加载会话状态（刷新恢复）
  function loadSessionState() {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (saved) {
        const parsed: Partial<PersistedUIState> = JSON.parse(saved)
        
        // 恢复模态框状态
        isCommentsModalOpen.value = parsed.isCommentsModalOpen ?? false
        isVndbPanelOpen.value = parsed.isVndbPanelOpen ?? false
        isSettingsModalOpen.value = parsed.isSettingsModalOpen ?? false
        isHistoryModalOpen.value = parsed.isHistoryModalOpen ?? false
        isKeyboardHelpOpen.value = parsed.isKeyboardHelpOpen ?? false
        
        // 恢复其他状态
        showPlatformNav.value = parsed.showPlatformNav ?? false
        scrollPosition.value = parsed.scrollPosition ?? 0
      }
    } catch {
      // 解析失败，使用默认值
    }
  }

  // 保存持久化状态到 localStorage（长期偏好）
  function savePersistedState() {
    try {
      const state: Partial<PersistedUIState> = {
        themeMode: themeMode.value,
        customCSS: customCSS.value,
        showSearchHistory: showSearchHistory.value,
        lastVisitTime: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 保存失败，静默处理
    }
  }

  // 保存会话状态到 sessionStorage（刷新恢复）
  function saveSessionState() {
    try {
      const state: Partial<PersistedUIState> = {
        isCommentsModalOpen: isCommentsModalOpen.value,
        isVndbPanelOpen: isVndbPanelOpen.value,
        isSettingsModalOpen: isSettingsModalOpen.value,
        isHistoryModalOpen: isHistoryModalOpen.value,
        isKeyboardHelpOpen: isKeyboardHelpOpen.value,
        showPlatformNav: showPlatformNav.value,
        scrollPosition: window.scrollY,
      }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state))
    } catch {
      // 保存失败，静默处理
    }
  }

  // 监听需要持久化的状态变化（localStorage - 长期偏好）
  watch(
    [themeMode, customCSS, showSearchHistory],
    () => {
      if (isInitialized.value) {
        savePersistedState()
      }
    },
  )
  
  // 监听需要保存到会话的状态变化（sessionStorage - 刷新恢复）
  watch(
    [
      isCommentsModalOpen,
      isVndbPanelOpen,
      isSettingsModalOpen,
      isHistoryModalOpen,
      isKeyboardHelpOpen,
      showPlatformNav,
    ],
    () => {
      if (isInitialized.value) {
        saveSessionState()
      }
    },
  )

  // 初始化
  function init() {
    // 加载持久化状态（长期偏好）
    loadPersistedState()
    
    // 加载会话状态（刷新恢复）
    loadSessionState()

    // 应用主题模式
    setThemeMode(themeMode.value)
    
    isInitialized.value = true
    
    // 恢复滚动位置
    if (scrollPosition.value > 0) {
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition.value)
      })
    }
    
    // 监听页面卸载，保存滚动位置
    window.addEventListener('beforeunload', saveSessionState)
    
    // 定期保存滚动位置（防止意外关闭）
    let scrollSaveTimer: number | null = null
    window.addEventListener('scroll', () => {
      if (scrollSaveTimer) {
        clearTimeout(scrollSaveTimer)
      }
      scrollSaveTimer = window.setTimeout(() => {
        if (isInitialized.value) {
          saveSessionState()
        }
      }, 500)
    }, { passive: true })
  }

  // 显示 SW 更新提示
  function setShowUpdateToast(show: boolean) {
    showUpdateToast.value = show
  }
  
  // 清除会话状态（用于完全重置）
  function clearSessionState() {
    sessionStorage.removeItem(SESSION_KEY)
  }
  
  return {
    // 状态
    isInitialized,
    themeMode,
    isDarkMode,
    customCSS,
    isCommentsModalOpen,
    isVndbPanelOpen,
    isSettingsModalOpen,
    isHistoryModalOpen,
    showScrollToTop,
    showPlatformNav,
    showSearchHistory,
    currentBackgroundImage,
    backgroundImageLoaded,
    isLoading,
    loadingMessage,
    showUpdateToast,
    toasts,
    isKeyboardHelpOpen,
    scrollPosition,
    
    // 计算属性
    hasOpenModal,
    activeModalsCount,
    
    // 方法
    setThemeMode,
    toggleDarkMode,
    setDarkMode,
    setCustomCSS,
    toggleCommentsModal,
    toggleVndbPanel,
    toggleSettingsModal,
    toggleHistoryModal,
    closeAllModals,
    setShowScrollToTop,
    togglePlatformNav,
    closePlatformNav,
    toggleSearchHistory,
    setBackgroundImage,
    setBackgroundImageLoaded,
    setLoading,
    setShowUpdateToast,
    showToast,
    removeToast,
    clearToasts,
    loadPersistedState,
    savePersistedState,
    loadSessionState,
    saveSessionState,
    clearSessionState,
    init,
  }
})
