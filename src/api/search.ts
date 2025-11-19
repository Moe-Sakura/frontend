// API 相关常量和类型
export const VNDB_API_BASE_URL = "https://api.vndb.org/kana"
export const AI_TRANSLATE_API_URL = "https://ai.searchgal.homes/v1/chat/completions"
export const AI_TRANSLATE_API_KEY = "sk-Md5kXePgq6HJjPa1Cf3265511bEe4e4c888232A0837e371e"
export const AI_TRANSLATE_MODEL = "Qwen/Qwen2.5-32B-Instruct"
export const ENABLE_VNDB_IMAGE_PROXY = true
export const VNDB_IMAGE_PROXY_URL = "https://rpx.searchgal.homes/"

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
  items: SearchResult[]
  error: string
}

export interface VndbInfo {
  names: string[]
  mainName: string
  originalTitle: string
  mainImageUrl: string | null
  screenshotUrl: string | null
  description: string | null
  translatedDescription: string | null
  va: any[]
  vntags: any[]
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
  }
) {
  try {
    // 从 searchParams 中获取 API 地址，默认使用 Cloudflare Workers API
    const apiUrl = searchParams.get('api') || 'https://cfapi.searchgal.homes'
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
    }).catch(() => {
      throw new Error('网络连接失败，请检查网络或API地址')
    })
    
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('请求过于频繁，请稍后再试')
      }
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
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
      
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.trim()) continue

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
            const platformResult: PlatformResult = {
              name: data.result.name,
              color: data.result.color || 'white',
              items: data.result.items.map((item: any) => ({
                platform: data.result.name,
                title: item.name,
                url: item.url,
                tags: data.result.tags || [] // 保留平台标签（NoReq, Login, BTmag 等）
              })),
              error: data.result.error || ''
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
        fields: 'title, titles.lang, titles.title, description, image.url, image.sexual, image.violence, screenshots.url, screenshots.sexual, screenshots.violence, screenshots.votecount, length_minutes, length_votes, rating, votecount, released, developers.name, platforms',
        results: 1
      })
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
    
    if (result.title) names.push(result.title)
    
    if (result.titles && Array.isArray(result.titles)) {
      result.titles.forEach((titleEntry: any) => {
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
    
    // 获取游戏截图 - 按投票数排序，选择安全级别的截图
    let screenshotUrl: string | null = null
    if (result.screenshots && Array.isArray(result.screenshots) && result.screenshots.length > 0) {
      const sortedScreenshots = [...result.screenshots]
        .filter((s: any) => s.url && (s.sexual === 0 || s.sexual === 1) && s.violence === 0)
        .sort((a: any, b: any) => (b.votecount || 0) - (a.votecount || 0))
      
      if (sortedScreenshots.length > 0) {
        screenshotUrl = sortedScreenshots[0].url
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
      ? result.developers.map((dev: any) => dev.name).filter(Boolean)
      : []

    const finalResult: VndbInfo = {
      names: [...new Set(names)],
      mainName,
      originalTitle: result.title,
      mainImageUrl,
      screenshotUrl,
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
      platforms: result.platforms || undefined
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
          'Authorization': `Bearer ${AI_TRANSLATE_API_KEY}`
        },
        body: JSON.stringify({
          model: AI_TRANSLATE_MODEL,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的日英翻译助手。请将用户提供的游戏简介翻译成简体中文。保持原文的格式和段落结构，只返回翻译结果，不要添加任何解释或额外内容。'
            },
            {
              role: 'user',
              content: textToTranslate
            }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          stream: false
        })
      })

      if (!response.ok) {
        // 如果是最后一次尝试，返回 null
        if (attempt === maxRetries) {
          return null
        }
        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
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
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }

      return null
    } catch (error) {
      // 如果是最后一次尝试，返回 null
      if (attempt === maxRetries) {
        return null
      }
      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }

  return null
}

async function checkProxyAvailability() {
  try {
    const response = await fetch(VNDB_IMAGE_PROXY_URL, { method: 'HEAD' })
    isProxyAvailable = response.ok
  } catch {
    isProxyAvailable = false
  }
}

function replaceVndbUrls(vndbInfo: VndbInfo) {
  if (!ENABLE_VNDB_IMAGE_PROXY || !isProxyAvailable) {
    return
  }

  // 替换封面图片 URL
  if (vndbInfo.mainImageUrl && vndbInfo.mainImageUrl.startsWith('https://')) {
    // 提取 VNDB 图片路径
    const match = vndbInfo.mainImageUrl.match(/https:\/\/[^\/]+\/(.+)/)
    if (match) {
      vndbInfo.mainImageUrl = VNDB_IMAGE_PROXY_URL + match[1]
    }
  }

  // 替换截图 URL
  if (vndbInfo.screenshotUrl && vndbInfo.screenshotUrl.startsWith('https://')) {
    const match = vndbInfo.screenshotUrl.match(/https:\/\/[^\/]+\/(.+)/)
    if (match) {
      vndbInfo.screenshotUrl = VNDB_IMAGE_PROXY_URL + match[1]
    }
  }
}

