/**
 * URL 参数管理工具
 * 用于实现搜索参数与地址栏的双向绑定
 */

export interface SearchParams {
  s?: string        // 搜索关键字
  mode?: 'game' | 'patch'  // 搜索模式
  api?: string      // 自定义 API 地址
}

/**
 * 从 URL 读取搜索参数
 */
export function getSearchParamsFromURL(): SearchParams {
  const params = new URLSearchParams(window.location.search)
  
  const result: SearchParams = {}
  
  // 搜索关键字
  const s = params.get('s')
  if (s) {
    result.s = decodeURIComponent(s)
  }
  
  // 搜索模式
  const mode = params.get('mode')
  if (mode === 'game' || mode === 'patch') {
    result.mode = mode
  }
  
  // 自定义 API
  const api = params.get('api')
  if (api) {
    result.api = decodeURIComponent(api)
  }
  
  return result
}

/**
 * 更新 URL 参数（不刷新页面）
 */
export function updateURLParams(params: SearchParams): void {
  const url = new URL(window.location.href)
  const searchParams = url.searchParams
  
  // 清除所有参数
  searchParams.delete('s')
  searchParams.delete('mode')
  searchParams.delete('api')
  
  // 设置新参数
  if (params.s && params.s.trim()) {
    searchParams.set('s', encodeURIComponent(params.s.trim()))
  }
  
  if (params.mode && params.mode !== 'game') {
    // 默认是 game，只在非默认时设置
    searchParams.set('mode', params.mode)
  }
  
  if (params.api && params.api.trim()) {
    searchParams.set('api', encodeURIComponent(params.api.trim()))
  }
  
  // 更新 URL（不刷新页面）
  const newURL = searchParams.toString() 
    ? `${url.pathname}?${searchParams.toString()}`
    : url.pathname
  
  window.history.replaceState({}, '', newURL)
}

/**
 * 清除 URL 参数
 */
export function clearURLParams(): void {
  window.history.replaceState({}, '', window.location.pathname)
}

/**
 * 生成分享链接
 */
export function generateShareURL(params: SearchParams): string {
  const url = new URL(window.location.origin)
  const searchParams = url.searchParams
  
  if (params.s && params.s.trim()) {
    searchParams.set('s', encodeURIComponent(params.s.trim()))
  }
  
  if (params.mode && params.mode !== 'game') {
    searchParams.set('mode', params.mode)
  }
  
  if (params.api && params.api.trim()) {
    searchParams.set('api', encodeURIComponent(params.api.trim()))
  }
  
  return searchParams.toString() 
    ? `${url.origin}?${searchParams.toString()}`
    : url.origin
}

/**
 * 监听浏览器前进/后退按钮
 */
export function onURLParamsChange(callback: (params: SearchParams) => void): () => void {
  const handler = () => {
    const params = getSearchParamsFromURL()
    callback(params)
  }
  
  window.addEventListener('popstate', handler)
  
  // 返回清理函数
  return () => {
    window.removeEventListener('popstate', handler)
  }
}

