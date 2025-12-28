import { onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { useSearchStore } from '@/stores/search'
import { playTap, playButton, playSwipe } from '@/composables/useSound'

// 快捷键配置
export const SHORTCUTS = {
  ESCAPE: 'Escape',           // 关闭当前面板
  SETTINGS: ',',              // 打开设置
  COMMENTS: 'c',              // 打开评论
  VNDB: 'v',                  // 打开 VNDB
  HISTORY: 'y',               // 打开搜索历史
  SEARCH: '/',                // 聚焦搜索框
  SCROLL_TOP: 't',            // 回到顶部
  HOME: 'h',                  // 返回首页
  NAV: 'n',                   // 站点导航
  NEXT_PLATFORM: ']',         // 下一个平台
  PREV_PLATFORM: '[',         // 上一个平台
} as const

export interface ShortcutInfo {
  key: string
  description: string
  modifier?: 'ctrl' | 'alt' | 'shift'
  category?: 'navigation' | 'action' | 'scroll'
}

// 快捷键帮助信息
export const shortcutsList: ShortcutInfo[] = [
  // 导航类
  { key: 'Esc', description: '关闭当前面板', category: 'navigation' },
  { key: 'H', description: '返回首页', category: 'navigation' },
  { key: ',', description: '打开/关闭设置', category: 'navigation' },
  { key: 'C', description: '打开/关闭评论', category: 'navigation' },
  { key: 'V', description: '打开/关闭作品介绍', category: 'navigation' },
  { key: 'Y', description: '打开/关闭搜索历史', category: 'navigation' },
  { key: 'N', description: '站点导航', category: 'navigation' },
  // 操作类
  { key: '/', description: '聚焦搜索框', category: 'action' },
  // 滚动类
  { key: 'T', description: '回到顶部', category: 'scroll' },
  { key: '[', description: '上一个平台', category: 'scroll' },
  { key: ']', description: '下一个平台', category: 'scroll' },
]

export function useKeyboardShortcuts() {
  const uiStore = useUIStore()
  const searchStore = useSearchStore()

  // 检查是否在输入框中
  function isInputFocused(): boolean {
    const activeElement = document.activeElement
    if (!activeElement) {return false}
    
    const tagName = activeElement.tagName.toLowerCase()
    const isContentEditable = activeElement.hasAttribute('contenteditable')
    
    return tagName === 'input' || tagName === 'textarea' || isContentEditable
  }

  // 聚焦搜索框
  function focusSearch() {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="搜索"]')!
    if (searchInput) {
      searchInput.focus()
      searchInput.select()
    }
  }

  // 回到顶部
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 获取平台列表
  function getPlatformElements(): HTMLElement[] {
    return Array.from(document.querySelectorAll('[data-platform]'))
  }

  // 跳转到指定平台
  function scrollToPlatform(index: number) {
    const platforms = getPlatformElements()
    if (index >= 0 && index < platforms.length) {
      const target = platforms[index]
      const yOffset = -80
      const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  // 跳转到上一个/下一个平台
  function scrollToNextPlatform() {
    const platforms = getPlatformElements()
    if (platforms.length === 0) {return}
    
    const scrollY = window.scrollY + 100
    for (let i = 0; i < platforms.length; i++) {
      if (platforms[i].offsetTop > scrollY) {
        scrollToPlatform(i)
        return
      }
    }
    // 如果已经在最后，跳到第一个
    scrollToPlatform(0)
  }

  function scrollToPrevPlatform() {
    const platforms = getPlatformElements()
    if (platforms.length === 0) {return}
    
    const scrollY = window.scrollY + 100
    for (let i = platforms.length - 1; i >= 0; i--) {
      if (platforms[i].offsetTop < scrollY - 50) {
        scrollToPlatform(i)
        return
      }
    }
    // 如果已经在最前，跳到最后一个
    scrollToPlatform(platforms.length - 1)
  }

  // 切换站点导航
  function toggleNav() {
    // 模拟点击站点导航按钮
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const navBtn = document.querySelector('.nav-btn')!
    if (navBtn) {
      navBtn.click()
    }
  }

  // 显示快捷键帮助
  function showHelp() {
    uiStore.showToast(
      'info',
      '按键: Esc关闭 | H首页 | ,设置 | C评论 | V作品 | Y历史 | N导航 | /搜索 | T顶部 | [/]平台',
      6000,
    )
  }

  // 关闭所有面板
  function closeAllPanels() {
    uiStore.closeAllModals()
  }

  // 切换面板（使用 store 中的互斥方法）
  function togglePanel(panel: 'settings' | 'comments' | 'vndb' | 'history') {
    switch (panel) {
      case 'settings':
        uiStore.toggleSettingsModal()
        break
      case 'comments':
        uiStore.toggleCommentsModal()
        break
      case 'vndb':
        uiStore.toggleVndbPanel()
        break
      case 'history':
        uiStore.toggleHistoryModal()
        break
    }
  }

  // 检查是否有任何面板打开
  function hasAnyPanelOpen(): boolean {
    return uiStore.isSettingsModalOpen || 
           uiStore.isCommentsModalOpen || 
           uiStore.isVndbPanelOpen || 
           uiStore.isHistoryModalOpen
  }

  // 键盘事件处理
  function handleKeyDown(event: KeyboardEvent) {
    const key = event.key.toLowerCase()
    
    // Escape 键 - 总是处理（关闭面板）
    if (event.key === 'Escape') {
      if (hasAnyPanelOpen()) {
        event.preventDefault()
        playButton()
        closeAllPanels()
      }
      return
    }

    // 如果在输入框中，只响应 Escape
    if (isInputFocused()) {
      return
    }

    // 不处理带有 Ctrl/Meta 的组合键（除了特定的）
    if (event.ctrlKey || event.metaKey) {
      return
    }

    switch (key) {
      case ',':
        // 打开/关闭设置
        event.preventDefault()
        playButton()
        togglePanel('settings')
        break

      case 'c':
        // 打开/关闭评论
        event.preventDefault()
        playButton()
        togglePanel('comments')
        break

      case 'v':
        // 打开/关闭 VNDB（需要有 VNDB 信息）
        if (searchStore.vndbInfo) {
          event.preventDefault()
          playButton()
          togglePanel('vndb')
        }
        break

      case 'y':
        // 打开/关闭搜索历史
        event.preventDefault()
        playButton()
        togglePanel('history')
        break

      case 'h':
        // 返回首页（关闭所有面板）
        event.preventDefault()
        playTap()
        closeAllPanels()
        break

      case 'n':
        // 站点导航
        event.preventDefault()
        playTap()
        toggleNav()
        break

      case '/':
        // 聚焦搜索框
        event.preventDefault()
        playTap()
        focusSearch()
        break

      case 't':
        // 回到顶部
        event.preventDefault()
        playSwipe()
        scrollToTop()
        break

      case '[':
        // 上一个平台
        event.preventDefault()
        playSwipe()
        scrollToPrevPlatform()
        break

      case ']':
        // 下一个平台
        event.preventDefault()
        playSwipe()
        scrollToNextPlatform()
        break

      case '?':
        // 显示/隐藏快捷键帮助
        event.preventDefault()
        playButton()
        uiStore.toggleKeyboardHelp()
        break
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })

  return {
    shortcutsList,
    focusSearch,
    scrollToTop,
    scrollToPlatform,
    scrollToNextPlatform,
    scrollToPrevPlatform,
    toggleNav,
    showHelp,
  }
}

