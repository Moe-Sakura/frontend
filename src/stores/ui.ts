import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // 主题相关
  const isDarkMode = ref(false)
  const customCSS = ref('')
  
  // 模态框状态
  const isCommentsModalOpen = ref(false)
  const isVndbPanelOpen = ref(false)
  const isSettingsModalOpen = ref(false)
  
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
    isSettingsModalOpen.value,
  )
  
  const activeModalsCount = computed(() => {
    let count = 0
    if (isCommentsModalOpen.value) {count++}
    if (isVndbPanelOpen.value) {count++}
    if (isSettingsModalOpen.value) {count++}
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
  
  // 初始化
  function init() {
    // 恢复暗色模式
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setDarkMode(true)
    } else if (savedDarkMode === 'false') {
      setDarkMode(false)
    } else {
      // 默认跟随系统
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
    }
  }
  
  return {
    // 状态
    isDarkMode,
    customCSS,
    isCommentsModalOpen,
    isVndbPanelOpen,
    isSettingsModalOpen,
    showScrollToTop,
    showPlatformNav,
    showSearchHistory,
    currentBackgroundImage,
    backgroundImageLoaded,
    isLoading,
    loadingMessage,
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
    closeAllModals,
    setShowScrollToTop,
    togglePlatformNav,
    closePlatformNav,
    toggleSearchHistory,
    setBackgroundImage,
    setBackgroundImageLoaded,
    setLoading,
    showToast,
    removeToast,
    clearToasts,
    init,
  }
})

