// API 相关常量和类型
export const VNDB_API_BASE_URL = 'https://api.vndb.org/kana'
export const AI_TRANSLATE_API_URL = 'https://ai.searchgal.homes/v1/chat/completions'
export const AI_TRANSLATE_API_KEY = 'sk-Md5kXePgq6HJjPa1Cf3265511bEe4e4c888232A0837e371e'
export const AI_TRANSLATE_MODEL = 'Qwen/Qwen2.5-32B-Instruct'
export const ENABLE_VNDB_IMAGE_PROXY = true
export const VNDB_IMAGE_PROXY_URL = 'https://rp.searchgal.homes/'

let isProxyAvailable = false

export interface SearchResult {
  platform: string
  title: string
  url: string
  tags?: string[]
}

export interface PlatformResult {
  name: string
  color: 'lime' | 'white' | 'gold' | 'red'
  url?: string
  items: SearchResult[]
  error: string
}

export interface VndbVoiceActor {
  id: string
  name: string
  character?: string
}

export interface VndbTag {
  id: string
  name: string
  rating?: number
}

export interface VndbTitleEntry {
  lang: string
  title: string
}

export interface VndbScreenshot {
  url: string
  sexual: number
  violence: number
  votecount?: number
}

export interface VndbDeveloper {
  name: string
}

export interface VndbApiItem {
  name: string
  url: string
}

export interface VndbInfo {
  id?: string
  names: string[]
  mainName: string
  originalTitle: string
  mainImageUrl: string | null
  screenshotUrl: string | null
  screenshots: string[]
  description: string | null
  translatedDescription: string | null
  va: VndbVoiceActor[]
  vntags: VndbTag[]
  play_hours: number
  length_minute: number
  length_votes: number
  length_color: string
  book_length: string
  rating?: number
  votecount?: number
  released?: string
  developers?: string[]
  platforms?: string[]
}

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
    // 从 searchParams 中获取 API 地址，默认使用 Cloudflare Workers API
    const apiUrl = searchParams.get('api') || 'https://cf.api.searchgal.homes'
    const gameName = searchParams.get('game')
    const searchMode = searchParams.get('mode') || 'game'

    if (!gameName) {
      throw new Error('游戏名称不能为空')
    }

    // 根据 Cloudflare Workers API 文档，使用 FormData 构建请求体
    const formData = new FormData()
    formData.append('game', gameName)

    // 根据搜索模式选择 API 端点
    const endpoint = searchMode === 'patch' ? '/patch' : '/gal'

    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      body: formData,
      mode: 'cors',
      credentials: 'omit',
    }).catch((err) => {
      // 提取更详细的网络错误信息
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

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) {
          continue
        }

        try {
          const data = JSON.parse(line)

          // 根据 Cloudflare Workers API 文档的响应格式处理数据
          if (data.total !== undefined) {
            // 初始事件：{"total": 33}
            totalCount = data.total
            callbacks.onTotal?.(totalCount)
          } else if (data.progress && data.result) {
            // 进度事件：{"progress": {"completed": 1, "total": 33}, "result": {...}}
            callbacks.onProgress?.(data.progress.completed, data.progress.total)

            // 转换为我们的格式，保留 tags 标签信息
            const items = data.result.items.map((item: VndbApiItem) => ({
              platform: data.result.name,
              title: item.name,
              url: item.url,
              tags: data.result.tags || [], // 保留平台标签（NoReq, Login, BTmag 等）
            }))

            // 提取平台URL：优先使用API返回的url/website，否则从第一个结果的URL中提取域名
            let platformUrl = data.result.url || data.result.website || ''

            if (!platformUrl && items.length > 0 && items[0].url) {
              try {
                const firstUrl = new URL(items[0].url)
                platformUrl = `${firstUrl.protocol}//${firstUrl.host}`
              } catch (e) {
                // URL解析失败，保持为空
                console.warn(`无法从 ${items[0].url} 提取平台URL`)
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
            // 仅进度更新：{"progress": {"completed": 2, "total": 33}}
            callbacks.onProgress?.(data.progress.completed, data.progress.total)
          } else if (data.done === true) {
            // 完成事件：{"done": true}
            callbacks.onComplete?.()
          }
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
  } catch (error) {
    // 搜索失败
    callbacks.onError?.(error instanceof Error ? error.message : '搜索失败')
  }
}

/**
 * 获取 VNDB 数据
 */
export async function fetchVndbData(gameName: string): Promise<VndbInfo | null> {
  try {
    // VNDB API v2 正确的请求格式 - 获取更多字段
    const response = await fetch(`${VNDB_API_BASE_URL}/vn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: ['search', '=', gameName],
        fields:
          'id, title, titles.lang, titles.title, description, image.url, image.sexual, image.violence, screenshots.url, screenshots.sexual, screenshots.violence, screenshots.votecount, length_minutes, length_votes, rating, votecount, released, developers.name, platforms',
        results: 1,
      }),
    })

    if (!response.ok) {
      throw new Error(`VNDB API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return null
    }

    const result = data.results[0]

    // 提取名称
    let zhName = ''
    let jaName = ''
    const names: string[] = []

    if (result.title) {
      names.push(result.title)
    }

    if (result.titles && Array.isArray(result.titles)) {
      result.titles.forEach((titleEntry: VndbTitleEntry) => {
        if (titleEntry.title) {
          names.push(titleEntry.title)
          if (titleEntry.lang === 'zh-Hans' || titleEntry.lang === 'zh-Hant') {
            zhName = titleEntry.title
          } else if (titleEntry.lang === 'ja') {
            jaName = titleEntry.title
          }
        }
      })
    }

    const mainName = zhName || jaName || result.title

    // 获取封面图片 - 优先选择安全级别的图片
    let mainImageUrl: string | null = null
    if (result.image && result.image.url) {
      // 只使用 sexual <= 1 且 violence === 0 的图片
      if ((result.image.sexual === 0 || result.image.sexual === 1) && result.image.violence === 0) {
        mainImageUrl = result.image.url
      }
    }

    // 获取游戏截图 - 按投票数排序，选择安全级别的截图（排除 R18）
    let screenshotUrl: string | null = null
    const screenshots: string[] = []

    if (result.screenshots && Array.isArray(result.screenshots) && result.screenshots.length > 0) {
      // 过滤并排序截图：只保留 sexual <= 1 且 violence === 0 的截图
      const sortedScreenshots = [...result.screenshots]
        .filter((s: VndbScreenshot) => s.url && (s.sexual === 0 || s.sexual === 1) && s.violence === 0)
        .sort((a: VndbScreenshot, b: VndbScreenshot) => (b.votecount || 0) - (a.votecount || 0))

      if (sortedScreenshots.length > 0) {
        screenshotUrl = sortedScreenshots[0].url
        // 保存所有安全截图的 URL
        screenshots.push(...sortedScreenshots.map((s: VndbScreenshot) => s.url))
      }
    }

    // 计算游戏时长
    const length_minute = result.length_minutes || 0
    const length_votes = result.length_votes || 0
    const play_hours = Math.round(length_minute / 60)

    let book_length = 'Unknown'
    let length_color = 'text-gray-500'

    if (play_hours < 2) {
      book_length = 'Very short'
      length_color = 'text-green-500'
    } else if (play_hours < 10) {
      book_length = 'Short'
      length_color = 'text-blue-500'
    } else if (play_hours < 30) {
      book_length = 'Medium'
      length_color = 'text-yellow-500'
    } else if (play_hours < 50) {
      book_length = 'Long'
      length_color = 'text-orange-500'
    } else {
      book_length = 'Very long'
      length_color = 'text-red-500'
    }

    // 提取开发商信息
    const developers = result.developers
      ? result.developers.map((dev: VndbDeveloper) => dev.name).filter(Boolean)
      : []

    const finalResult: VndbInfo = {
      id: result.id || undefined,
      names: [...new Set(names)],
      mainName,
      originalTitle: result.title,
      mainImageUrl,
      screenshotUrl,
      screenshots,
      description: result.description || null,
      translatedDescription: null,
      va: result.va || [],
      vntags: [],
      play_hours,
      length_minute,
      length_votes,
      length_color,
      book_length,
      rating: result.rating || undefined,
      votecount: result.votecount || undefined,
      released: result.released || undefined,
      developers: developers.length > 0 ? developers : undefined,
      platforms: result.platforms || undefined,
    }

    // 检查代理并替换 URL
    if (ENABLE_VNDB_IMAGE_PROXY) {
      await checkProxyAvailability()
      if (isProxyAvailable) {
        replaceVndbUrls(finalResult)
      }
    }

    return finalResult
  } catch (error) {
    return null
  }
}

/**
 * AI 翻译文本
 * @param text - 要翻译的文本
 * @param maxRetries - 最大重试次数
 * @returns 翻译后的文本，失败返回 null
 */
export async function translateText(text: string, maxRetries: number = 2): Promise<string | null> {
  if (!text || text.trim().length === 0) {
    return null
  }

  // 限制文本长度，避免超出 API 限制
  const maxLength = 3000
  const textToTranslate = text.length > maxLength ? text.substring(0, maxLength) + '...' : text

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(AI_TRANSLATE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_TRANSLATE_API_KEY}`,
        },
        body: JSON.stringify({
          model: AI_TRANSLATE_MODEL,
          messages: [
            {
              role: 'system',
              content: `你是一名专业的视觉小说游戏本地化专家，请将提供的游戏简介精准翻译为简体中文。

【翻译规范】

1. 格式净化：翻译前完全清除所有HTML、Markdown、XML等非内容格式标记，仅保留原始文本内容

2. 结构保留：完整保持原文段落划分，段落间以自然换行分隔

3. 术语统一：准确处理视觉小说领域的专业术语，确保表述一致

4. 人名规范：
   - 保留原名拼写
   - 或采用中文圈广泛接受的译名
   - 同一作品内译名保持统一

5. 内容控制：
   - 严禁添加原文未包含的剧透信息
   - 禁止插入解释性文字或主观评价
   - 杜绝文化偏见性表述

6. 输出要求：仅输出翻译后的纯文本内容，无需任何说明性文字`,
            },
            {
              role: 'user',
              content: textToTranslate,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
          stream: false,
        }),
      })

      if (!response.ok) {
        // 如果是最后一次尝试，返回 null
        if (attempt === maxRetries) {
          return null
        }
        // 等待一段时间后重试
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }

      const data = await response.json()

      if (data.choices && data.choices.length > 0) {
        const translatedText = data.choices[0].message?.content?.trim()
        if (translatedText && translatedText.length > 0) {
          return translatedText
        }
      }

      // 如果没有有效结果且不是最后一次尝试，继续重试
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }

      return null
    } catch (error) {
      // 如果是最后一次尝试，返回 null
      if (attempt === maxRetries) {
        return null
      }
      // 等待后重试
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  return null
}

async function checkProxyAvailability() {
  // 始终启用代理，不进行可用性检查
  // 因为代理服务器可能不支持 HEAD 请求
  isProxyAvailable = true
}

function replaceVndbUrls(vndbInfo: VndbInfo) {
  if (!ENABLE_VNDB_IMAGE_PROXY || !isProxyAvailable) {
    return
  }

  // 替换封面图片 URL - 代理需要完整的原始 URL
  if (vndbInfo.mainImageUrl && vndbInfo.mainImageUrl.startsWith('https://t.vndb.org/')) {
    vndbInfo.mainImageUrl = VNDB_IMAGE_PROXY_URL + vndbInfo.mainImageUrl
  }

  // 替换主截图 URL - 代理需要完整的原始 URL
  if (vndbInfo.screenshotUrl && vndbInfo.screenshotUrl.startsWith('https://t.vndb.org/')) {
    vndbInfo.screenshotUrl = VNDB_IMAGE_PROXY_URL + vndbInfo.screenshotUrl
  }

  // 替换所有截图 URL
  if (vndbInfo.screenshots && vndbInfo.screenshots.length > 0) {
    vndbInfo.screenshots = vndbInfo.screenshots.map((url) => {
      if (url.startsWith('https://t.vndb.org/')) {
        return VNDB_IMAGE_PROXY_URL + url
      }
      return url
    })
  }
}
