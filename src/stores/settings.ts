import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface UserSettings {
  customApi: string
  customCSS: string
  customJS: string
  customHTML: string
  autoLoadMore: boolean
  resultsPerPage: number
  enableAnimations: boolean
  showPlatformIcons: boolean
  compactMode: boolean
  enableNotifications: boolean
  // API 高级配置
  vndbApiBaseUrl: string
  vndbImageProxyUrl: string
  aiTranslateApiUrl: string
  aiTranslateApiKey: string
  aiTranslateModel: string
  backgroundImageApiUrl: string
}

// 默认 API 配置
export const DEFAULT_API_CONFIG = {
  vndbApiBaseUrl: 'https://api.vndb.org/kana',
  vndbImageProxyUrl: 'https://rpx.searchgal.homes/',
  aiTranslateApiUrl: 'https://ai.searchgal.homes/v1/chat/completions',
  aiTranslateApiKey: 'sk-Md5kXePgq6HJjPa1Cf3265511bEe4e4c888232A0837e371e',
  aiTranslateModel: 'Qwen/Qwen2.5-32B-Instruct',
  backgroundImageApiUrl: 'https://api.illlights.com/v1/img',
}

const DEFAULT_SETTINGS: UserSettings = {
  customApi: '',
  customCSS: '',
  customJS: '',
  customHTML: '',
  autoLoadMore: false,
  resultsPerPage: 10,
  enableAnimations: true,
  showPlatformIcons: true,
  compactMode: false,
  enableNotifications: true,
  // API 高级配置
  vndbApiBaseUrl: DEFAULT_API_CONFIG.vndbApiBaseUrl,
  vndbImageProxyUrl: DEFAULT_API_CONFIG.vndbImageProxyUrl,
  aiTranslateApiUrl: DEFAULT_API_CONFIG.aiTranslateApiUrl,
  aiTranslateApiKey: DEFAULT_API_CONFIG.aiTranslateApiKey,
  aiTranslateModel: DEFAULT_API_CONFIG.aiTranslateModel,
  backgroundImageApiUrl: DEFAULT_API_CONFIG.backgroundImageApiUrl,
}

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const settings = ref<UserSettings>({ ...DEFAULT_SETTINGS })
  const isInitialized = ref(false)
  
  // 从 localStorage 加载设置
  function loadSettings() {
    try {
      const saved = localStorage.getItem('userSettings')
      if (saved) {
        const parsed = JSON.parse(saved)
        settings.value = { ...DEFAULT_SETTINGS, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
    isInitialized.value = true
  }
  
  // 保存设置到 localStorage
  function saveSettings() {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }
  
  // 更新单个设置
  function updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) {
    settings.value[key] = value
    saveSettings()
  }
  
  // 批量更新设置
  function updateSettings(newSettings: Partial<UserSettings>) {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
  }
  
  // 重置设置
  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    saveSettings()
  }
  
  // 导出设置
  function exportSettings(): string {
    return JSON.stringify(settings.value, null, 2)
  }
  
  // 导入设置
  function importSettings(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString)
      settings.value = { ...DEFAULT_SETTINGS, ...imported }
      saveSettings()
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }
  
  // 监听设置变化，自动保存
  watch(
    settings,
    () => {
      if (isInitialized.value) {
        saveSettings()
      }
    },
    { deep: true },
  )
  
  // 自动加载设置
  loadSettings()
  
  return {
    // 状态
    settings,
    isInitialized,
    
    // 方法
    loadSettings,
    saveSettings,
    updateSetting,
    updateSettings,
    resetSettings,
    exportSettings,
    importSettings,
  }
})

