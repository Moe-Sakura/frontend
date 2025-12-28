/**
 * 状态持久化工具
 * 用于保存和恢复搜索状态到 localStorage
 */

import type { PlatformData, VndbInfo } from '@/stores/search'

const STORAGE_KEY = 'searchgal_state'
const STORAGE_VERSION = '1.0'
const MAX_HISTORY_SIZE = 10 // 最多保存 10 条搜索历史

export interface SearchState {
  version: string
  timestamp: number
  searchQuery: string
  searchMode: 'game' | 'patch'
  customApi: string
  platformResults: [string, PlatformData][]
  vndbInfo: VndbInfo | null
  // 输入状态
  inputQuery?: string
  inputMode?: 'game' | 'patch'
  inputApi?: string
}

export interface SearchHistory {
  query: string
  mode: 'game' | 'patch'
  timestamp: number
  resultCount: number
}

/**
 * 保存搜索状态到 localStorage
 */
export function saveSearchState(state: Omit<SearchState, 'version' | 'timestamp'>): void {
  try {
    const stateToSave: SearchState = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      ...state,
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  } catch (error) {
    // localStorage 可能已满或被禁用，静默处理
  }
}

/**
 * 从 localStorage 恢复搜索状态
 */
export function loadSearchState(): SearchState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {return null}
    
    const state: SearchState = JSON.parse(stored)
    
    // 检查版本
    if (state.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    
    // 检查是否过期（7天）
    const MAX_AGE = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - state.timestamp > MAX_AGE) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    
    return state
  } catch (error) {
    // 解析失败，清除无效数据
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

/**
 * 清除保存的搜索状态
 */
export function clearSearchState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    // 静默处理
  }
}

/**
 * 保存搜索历史
 */
export function saveSearchHistory(history: SearchHistory): void {
  try {
    const HISTORY_KEY = 'searchgal_history'
    const stored = localStorage.getItem(HISTORY_KEY)
    let historyList: SearchHistory[] = stored ? JSON.parse(stored) : []
    
    // 移除重复的搜索（相同 query 和 mode）
    historyList = historyList.filter(
      item => !(item.query === history.query && item.mode === history.mode),
    )
    
    // 添加新搜索到开头
    historyList.unshift(history)
    
    // 限制历史记录数量
    if (historyList.length > MAX_HISTORY_SIZE) {
      historyList = historyList.slice(0, MAX_HISTORY_SIZE)
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(historyList))
  } catch (error) {
    // 静默处理
  }
}

/**
 * 获取搜索历史
 */
export function loadSearchHistory(): SearchHistory[] {
  try {
    const HISTORY_KEY = 'searchgal_history'
    const stored = localStorage.getItem(HISTORY_KEY)
    if (!stored) {return []}
    
    const historyList: SearchHistory[] = JSON.parse(stored)
    
    // 过滤过期的历史（30天）
    const MAX_AGE = 30 * 24 * 60 * 60 * 1000
    const now = Date.now()
    return historyList.filter(item => now - item.timestamp < MAX_AGE)
  } catch (error) {
    return []
  }
}

/**
 * 清除搜索历史
 */
export function clearSearchHistory(): void {
  try {
    const HISTORY_KEY = 'searchgal_history'
    localStorage.removeItem(HISTORY_KEY)
  } catch (error) {
    // 静默处理
  }
}

/**
 * 获取 localStorage 使用情况
 */
export function getStorageInfo(): { used: number; total: number; percentage: number } {
  try {
    let used = 0
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        used += localStorage[key].length + key.length
      }
    }
    
    // 大多数浏览器 localStorage 限制为 5-10MB
    const total = 5 * 1024 * 1024 // 假设 5MB
    const percentage = (used / total) * 100
    
    return { used, total, percentage }
  } catch (error) {
    return { used: 0, total: 0, percentage: 0 }
  }
}

