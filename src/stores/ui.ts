import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

// 持久化的 UI 状态类型
export interface PersistedUIState {
  isDarkMode: boolean
  customCSS: string
  showSearchHistory: boolean
  lastVisitTime: number
}

const STORAGE_KEY = 'ui-state'

// 默认持久化状态
const DEFAULT_PERSISTED_STATE: PersistedUIState = {
  isDarkMode: false,
  customCSS: '',
  showSearchHistory: true,
  lastVisitTime: 0,
}

export const useUIStore = defineStore('ui', () => {
  // 是否已初始化
  const isInitialized = ref(false)

  // 主题相关
  const isDarkMode = ref(false)
  const customCSS = ref('')
  
  // 模态框状态
  const isCommentsModalOpen = ref(false)
  const isVndbPanelOpen = ref(false)
  const isSettingsModalOpen = ref(false)
  const isHistoryModalOpen = ref(false)
  
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
  function toggleDarkMode() {
    isDarkMode.value = !isDarkMode.value
    document.documentElement.classList.toggle('dark', isDarkMode.value)
    localStorage.setItem('darkMode', isDarkMode.value ? 'true' : 'false')
  }
  
  function setDarkMode(value: boolean) {
    isDarkMode.value = value
    document.documentElement.classList.toggle('dark', value)
    localStorage.setItem('darkMode', value ? 'true' : 'false')
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
  
  // 从 localStorage 加载持久化状态
  function loadPersistedState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed: PersistedUIState = JSON.parse(saved)
        isDarkMode.value = parsed.isDarkMode ?? DEFAULT_PERSISTED_STATE.isDarkMode
        customCSS.value = parsed.customCSS ?? DEFAULT_PERSISTED_STATE.customCSS
        showSearchHistory.value = parsed.showSearchHistory ?? DEFAULT_PERSISTED_STATE.showSearchHistory
      }
    } catch {
      // 解析失败，使用默认值
    }
  }

  // 保存持久化状态到 localStorage
  function savePersistedState() {
    try {
      const state: PersistedUIState = {
        isDarkMode: isDarkMode.value,
        customCSS: customCSS.value,
        showSearchHistory: showSearchHistory.value,
        lastVisitTime: Date.now(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // 保存失败，静默处理
    }
  }

  // 监听需要持久化的状态变化
  watch(
    [isDarkMode, customCSS, showSearchHistory],
    () => {
      if (isInitialized.value) {
        savePersistedState()
      }
    },
  )

  // 初始化
  function init() {
    // 加载持久化状态
    loadPersistedState()

    // 如果没有保存的主题偏好，跟随系统
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      isDarkMode.value = prefersDark
    }

    // 应用主题
    document.documentElement.classList.toggle('dark', isDarkMode.value)
    
    isInitialized.value = true
  }

  // 显示 SW 更新提示
  function setShowUpdateToast(show: boolean) {
    showUpdateToast.value = show
  }
  
  return {
    // 状态
    isInitialized,
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
    
    // 计算属性
    hasOpenModal,
    activeModalsCount,
    
    // 方法
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
    init,
  }
})

