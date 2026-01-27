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
  enableSound: boolean
  // API 高级配置
  vndbApiBaseUrl: string
  vndbImageProxyUrl: string
  aiTranslateApiUrl: string
  aiTranslateApiKey: string
  aiTranslateModel: string
  backgroundImageApiUrl: string
  videoParseApiUrl: string
}

// 默认 API 配置
export const DEFAULT_API_CONFIG = {
  vndbApiBaseUrl: 'https://api.vndb.org/kana',
  vndbImageProxyUrl: 'https://rp.searchgal.top/',
  aiTranslateApiUrl: 'https://ai.searchgal.top/v1/chat/completions',
  aiTranslateApiKey: 'sk-Md5kXePgq6HJjPa1Cf3265511bEe4e4c888232A0837e371e',
  aiTranslateModel: 'Qwen/Qwen2.5-32B-Instruct',
  backgroundImageApiUrl: 'https://api.illlights.com/v1/img',
  videoParseApiUrl: 'https://vp.searchgal.top/',
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
  enableSound: true,
  // API 高级配置
  vndbApiBaseUrl: DEFAULT_API_CONFIG.vndbApiBaseUrl,
  vndbImageProxyUrl: DEFAULT_API_CONFIG.vndbImageProxyUrl,
  aiTranslateApiUrl: DEFAULT_API_CONFIG.aiTranslateApiUrl,
  aiTranslateApiKey: DEFAULT_API_CONFIG.aiTranslateApiKey,
  aiTranslateModel: DEFAULT_API_CONFIG.aiTranslateModel,
  backgroundImageApiUrl: DEFAULT_API_CONFIG.backgroundImageApiUrl,
  videoParseApiUrl: DEFAULT_API_CONFIG.videoParseApiUrl,
}

export const useSettingsStore = defineStore('settings', () => {
  // 状态
  const settings = ref<UserSettings>({ ...DEFAULT_SETTINGS })
  const isInitialized = ref(false)
  
  // 设置变更历史（用于撤销）
  const settingsHistory = ref<UserSettings[]>([])
  const historyIndex = ref(-1)
  const maxHistoryLength = 20
  
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
    
    // 初始化历史记录
    settingsHistory.value = [{ ...settings.value }]
    historyIndex.value = 0
  }
  
  // 保存设置到 localStorage
  function saveSettings() {
    try {
      localStorage.setItem('userSettings', JSON.stringify(settings.value))
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }
  
  // 记录设置变更历史
  function recordHistory() {
    // 如果不在最新位置，删除后面的历史
    if (historyIndex.value < settingsHistory.value.length - 1) {
      settingsHistory.value = settingsHistory.value.slice(0, historyIndex.value + 1)
    }
    
    // 添加新记录
    settingsHistory.value.push({ ...settings.value })
    historyIndex.value = settingsHistory.value.length - 1
    
    // 限制历史记录数量
    if (settingsHistory.value.length > maxHistoryLength) {
      settingsHistory.value.shift()
      historyIndex.value--
    }
  }
  
  // 更新单个设置
  function updateSetting<K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) {
    settings.value[key] = value
    saveSettings()
    recordHistory()
  }
  
  // 批量更新设置
  function updateSettings(newSettings: Partial<UserSettings>) {
    settings.value = { ...settings.value, ...newSettings }
    saveSettings()
    recordHistory()
  }
  
  // 重置设置
  function resetSettings() {
    settings.value = { ...DEFAULT_SETTINGS }
    saveSettings()
    recordHistory()
  }
  
  // 重置单个设置
  function resetSetting<K extends keyof UserSettings>(key: K) {
    settings.value[key] = DEFAULT_SETTINGS[key]
    saveSettings()
    recordHistory()
  }
  
  // 撤销设置变更
  function undoSettings(): boolean {
    if (historyIndex.value > 0) {
      historyIndex.value--
      settings.value = { ...settingsHistory.value[historyIndex.value] }
      saveSettings()
      return true
    }
    return false
  }
  
  // 重做设置变更
  function redoSettings(): boolean {
    if (historyIndex.value < settingsHistory.value.length - 1) {
      historyIndex.value++
      settings.value = { ...settingsHistory.value[historyIndex.value] }
      saveSettings()
      return true
    }
    return false
  }
  
  // 检查是否可以撤销/重做
  function canUndo(): boolean {
    return historyIndex.value > 0
  }
  
  function canRedo(): boolean {
    return historyIndex.value < settingsHistory.value.length - 1
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
      recordHistory()
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }
  
  // 获取设置差异（与默认值比较）
  function getSettingsDiff(): Partial<UserSettings> {
    const diff: Partial<UserSettings> = {}
    for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof UserSettings)[]) {
      if (JSON.stringify(settings.value[key]) !== JSON.stringify(DEFAULT_SETTINGS[key])) {
        (diff as Record<string, unknown>)[key] = settings.value[key]
      }
    }
    return diff
  }
  
  // 检查设置是否为默认值
  function isDefault<K extends keyof UserSettings>(key: K): boolean {
    return JSON.stringify(settings.value[key]) === JSON.stringify(DEFAULT_SETTINGS[key])
  }
  
  // 检查是否所有设置都是默认值
  function isAllDefault(): boolean {
    return Object.keys(getSettingsDiff()).length === 0
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
    settingsHistory,
    historyIndex,
    
    // 方法
    loadSettings,
    saveSettings,
    updateSetting,
    updateSettings,
    resetSettings,
    resetSetting,
    undoSettings,
    redoSettings,
    canUndo,
    canRedo,
    exportSettings,
    importSettings,
    getSettingsDiff,
    isDefault,
    isAllDefault,
  }
})

