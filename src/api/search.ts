/**
 * 搜索 API
 * 处理 Galgame 聚合搜索功能
 * 
 * 重构说明：
 * - 配置函数已移至 ./config.ts
 * - VNDB API 已移至 ./vndb.ts
 * - 翻译 API 已移至 ./translate.ts
 * - 此文件保留搜索功能和向后兼容的重新导出
 */

import type { PlatformResult, VndbApiItem } from '@/types/vndb'

// ============================================
// 向后兼容：重新导出其他模块的函数和类型
// ============================================

export {
  getVndbApiBaseUrl,
  getAiTranslateApiUrl,
  getAiTranslateApiKey,
  getAiTranslateModel,
  getVndbImageProxyUrl,
  getVideoParseApiUrl,
} from './config'

export {
  ENABLE_VNDB_IMAGE_PROXY,
  fetchVndbData,
  fetchVndbCharacters,
  fetchVndbQuotes,
  fetchGameVideoUrl,
} from './vndb'

export {
  translateText,
  translateAllContent,
} from './translate'

export type {
  VndbInfo,
  VndbCharacter,
  VndbQuote,
  VndbTag,
  VndbVoiceActor,
  VndbDeveloper,
  VndbRelation,
  VndbExtLink,
  PlatformResult,
  VideoParseResult,
  TranslateMode,
  TranslateAllResult,
} from '@/types/vndb'

// ============================================
// 搜索 API
// ============================================

/**
 * 搜索游戏（流式处理）
 * 根据 Cloudflare Workers API 文档: https://github.com/Moe-Sakura/Wrangler-API
 *
 * API 端点:
 * - POST /gal - 搜索游戏资源
 * - POST /patch - 搜索补丁资源
 *
 * 请求格式: multipart/form-data
 * 表单字段: game (string)
 *
 * 响应格式: text/event-stream (SSE)
 * - {"total": 33} - 总平台数
 * - {"progress": {"completed": 1, "total": 33}} - 进度更新
 * - {"progress": {...}, "result": {...}} - 平台结果
 * - {"done": true} - 完成标记
 */
export async function searchGameStream(
  searchParams: URLSearchParams,
  callbacks: {
    onTotal?: (total: number) => void
    onProgress?: (current: number, total: number) => void
    onPlatformResult?: (data: PlatformResult) => void
    onComplete?: () => void
    onError?: (error: string) => void
  },
) {
  try {
    const apiUrl = searchParams.get('api') || 'https://cf.api.searchgal.homes'
    const gameName = searchParams.get('game')
    const searchMode = searchParams.get('mode') || 'game'

    if (!gameName) {
      throw new Error('游戏名称不能为空')
    }

    const formData = new FormData()
    formData.append('game', gameName)

    const endpoint = searchMode === 'patch' ? '/patch' : '/gal'

    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
    }).catch((err) => {
      const errorName = err?.name || 'NetworkError'
      const errorMessage = err?.message || ''
      
      if (errorMessage.includes('Failed to fetch') || errorName === 'TypeError') {
        throw new Error(`[ERR_NETWORK] 无法连接到服务器 (${apiUrl})`)
      }
      if (errorMessage.includes('timeout') || errorName === 'TimeoutError') {
        throw new Error('[ERR_TIMEOUT] 请求超时，服务器响应过慢')
      }
      if (errorMessage.includes('abort') || errorName === 'AbortError') {
        throw new Error('[ERR_ABORTED] 请求已取消')
      }
      
      throw new Error(`[ERR_NETWORK] 网络连接失败: ${errorMessage || '未知错误'}`)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const statusMessages: Record<number, string> = {
        400: '请求格式错误',
        401: '未授权访问',
        403: '访问被拒绝',
        404: 'API 端点不存在',
        405: '请求方法不被允许',
        408: '请求超时',
        429: '请求过于频繁，请稍后再试',
        500: '服务器内部错误',
        502: '网关错误，后端服务不可用',
        503: '服务暂时不可用',
        504: '网关超时',
      }
      const message = errorData.error || statusMessages[response.status] || '请求失败'
      throw new Error(`[${response.status}] ${message}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('无法获取响应流')
    }

    let buffer = ''
    let totalCount = 0

    while (true) {
      const { done, value } = await reader.read()

      if (done) {break}

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) {continue}

        try {
          const data = JSON.parse(line)

          if (data.total !== undefined) {
            totalCount = data.total
            callbacks.onTotal?.(totalCount)
          } else if (data.progress && data.result) {
            callbacks.onProgress?.(data.progress.completed, data.progress.total)

            const items = data.result.items.map((item: VndbApiItem) => ({
              platform: data.result.name,
              title: item.name,
              url: item.url,
              tags: data.result.tags || [],
            }))

            let platformUrl = data.result.url || data.result.website || ''

            if (!platformUrl && items.length > 0 && items[0].url) {
              try {
                const firstUrl = new URL(items[0].url)
                platformUrl = `${firstUrl.protocol}//${firstUrl.host}`
              } catch {
                // URL解析失败，保持为空
              }
            }

            const platformResult: PlatformResult = {
              name: data.result.name,
              color: data.result.color || 'white',
              url: platformUrl,
              items: items,
              error: data.result.error || '',
            }

            callbacks.onPlatformResult?.(platformResult)
          } else if (data.progress && !data.result) {
            callbacks.onProgress?.(data.progress.completed, data.progress.total)
          } else if (data.done === true) {
            callbacks.onComplete?.()
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  } catch (error) {
    callbacks.onError?.(error instanceof Error ? error.message : '搜索失败')
  }
}
