/**
 * API 配置获取函数
 * 统一管理所有 API 配置的获取逻辑
 */

import { useSettingsStore, DEFAULT_API_CONFIG } from '@/stores/settings'

export function getVndbApiBaseUrl(): string {
  try {
    const settingsStore = useSettingsStore()
    return settingsStore.settings.vndbApiBaseUrl || DEFAULT_API_CONFIG.vndbApiBaseUrl
  } catch {
    return DEFAULT_API_CONFIG.vndbApiBaseUrl
  }
}

export function getAiTranslateApiUrl(): string {
  try {
    const settingsStore = useSettingsStore()
    return settingsStore.settings.aiTranslateApiUrl || DEFAULT_API_CONFIG.aiTranslateApiUrl
  } catch {
    return DEFAULT_API_CONFIG.aiTranslateApiUrl
  }
}

export function getAiTranslateApiKey(): string {
  try {
    const settingsStore = useSettingsStore()
    return settingsStore.settings.aiTranslateApiKey || DEFAULT_API_CONFIG.aiTranslateApiKey
  } catch {
    return DEFAULT_API_CONFIG.aiTranslateApiKey
  }
}

export function getAiTranslateModel(): string {
  try {
    const settingsStore = useSettingsStore()
    return settingsStore.settings.aiTranslateModel || DEFAULT_API_CONFIG.aiTranslateModel
  } catch {
    return DEFAULT_API_CONFIG.aiTranslateModel
  }
}

export function getVndbImageProxyUrl(): string {
  try {
    const settingsStore = useSettingsStore()
    return settingsStore.settings.vndbImageProxyUrl || DEFAULT_API_CONFIG.vndbImageProxyUrl
  } catch {
    return DEFAULT_API_CONFIG.vndbImageProxyUrl
  }
}

export function getVideoParseApiUrl(): string {
  try {
    const settingsStore = useSettingsStore()
    return settingsStore.settings.videoParseApiUrl || DEFAULT_API_CONFIG.videoParseApiUrl
  } catch {
    return DEFAULT_API_CONFIG.videoParseApiUrl
  }
}

