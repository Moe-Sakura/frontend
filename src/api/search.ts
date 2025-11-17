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
}

/**
 * 搜索游戏（流式处理）
 * 根据 API 文档: https://github.com/Moe-Sakura/SearchGal/blob/main/docs/api.md
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
    // 从 searchParams 中获取 API 地址
    const apiUrl = searchParams.get('api') || 'https://api.searchgal.homes'
    const gameName = searchParams.get('game')
    const searchMode = searchParams.get('mode') || 'game'
    
    if (!gameName) {
      throw new Error('游戏名称不能为空')
    }
    
    // 根据 API 文档，使用 FormData 构建请求体
    const formData = new FormData()
    formData.append('game', gameName)
    formData.append('magic', 'true') // 启用魔法搜索以获取更多结果
    
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
          
          // 根据 API 文档的响应格式处理数据
          if (data.total !== undefined) {
            // 初始事件：{"total": 10}
            totalCount = data.total
            callbacks.onTotal?.(totalCount)
          } else if (data.progress && data.result) {
            // 进度事件：{"progress": {...}, "result": {...}}
            callbacks.onProgress?.(data.progress.completed, data.progress.total)
            
            // 转换为我们的格式，保留完整平台信息
            const platformResult: PlatformResult = {
              name: data.result.name,
              color: data.result.color || 'white',
              items: data.result.items.map((item: any) => ({
                platform: data.result.name,
                title: item.name,
                url: item.url
              })),
              error: data.result.error || ''
            }
            
            callbacks.onPlatformResult?.(platformResult)
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
    // VNDB API v2 正确的请求格式
    const response = await fetch(`${VNDB_API_BASE_URL}/vn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: ['search', '=', gameName],
        fields: 'title, titles.lang, titles.title, description, image.url, image.sexual, image.violence, screenshots.url, screenshots.sexual, screenshots.violence, screenshots.votecount, length_minutes, length_votes',
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
    const mainImageUrl = result.image?.sexual <= 1 && result.image?.violence === 0 ? result.image.url : null
    
    const sortedScreenshots = result.screenshots
      ? [...result.screenshots].sort((a: any, b: any) => (b.votecount || 0) - (a.votecount || 0))
      : []
    
    const screenshotUrl = sortedScreenshots.find((s: any) => s.sexual <= 1 && s.violence === 0)?.url || null
    
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
      book_length
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
 */
export async function translateText(text: string): Promise<string | null> {
  if (!text || text.trim().length === 0) {
    return null
  }

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
            content: '你是一个专业的日英翻译助手。请将用户提供的文本翻译成简体中文。只返回翻译结果，不要添加任何解释或额外内容。'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    if (data.choices && data.choices.length > 0) {
      const translatedText = data.choices[0].message?.content?.trim()
      return translatedText || null
    }

    return null
  } catch (error) {
    return null
  }
}

async function checkProxyAvailability() {
  try {
    const response = await fetch(VNDB_IMAGE_PROXY_URL, { method: 'HEAD' })
    isProxyAvailable = response.ok
  } catch {
    isProxyAvailable = false
  }
}

function replaceVndbUrls(obj: any) {
  if (!ENABLE_VNDB_IMAGE_PROXY || !isProxyAvailable || obj === null || typeof obj !== 'object') {
    return
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key]
      if (typeof value === 'string' && value.startsWith('https://t.vndb.org/')) {
        obj[key] = VNDB_IMAGE_PROXY_URL + value
      } else if (typeof value === 'object') {
        replaceVndbUrls(value)
      }
    }
  }
}

