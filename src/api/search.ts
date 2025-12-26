// API 相关常量和类型
import { useSettingsStore, DEFAULT_API_CONFIG } from '@/stores/settings'

// 获取 API 配置的 getter 函数
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

// TouchGal 视频解析 API
const VIDEO_PARSE_API_URL = 'https://vp.searchgal.homes/'

export interface VideoParseResult {
  success: boolean
  game_result: number
  video_url: string
  error: string
}

/**
 * 获取游戏 PV 视频 URL
 * @param vndbId VNDB ID (如 "v12345")
 */
export async function fetchGameVideoUrl(vndbId: string): Promise<string | null> {
  if (!vndbId) return null

  try {
    const response = await fetch(VIDEO_PARSE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ vndb_id: vndbId }),
    })

    if (!response.ok) {
      return null
    }

    const data: VideoParseResult = await response.json()
    
    if (data.success && data.video_url) {
      return data.video_url
    }
    
    return null
  } catch {
    return null
  }
}

export const ENABLE_VNDB_IMAGE_PROXY = true

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
  character: {
    id: string
    name: string
  }
}

export interface VndbTag {
  id: string
  name: string
  rating: number
  spoiler: number
  category: string
}

export interface VndbTitleEntry {
  lang: string
  title: string
  official?: boolean
  main?: boolean
}


export interface VndbScreenshot {
  url: string
  sexual: number
  violence: number
  votecount?: number
}

export interface VndbDeveloper {
  id: string
  name: string
  original?: string
}

export interface VndbRelation {
  id: string
  title: string
  relation: string
  relation_official: boolean
}

export interface VndbExtLink {
  url: string
  label: string
  name: string
  id?: string
}

export interface VndbApiItem {
  name: string
  url: string
}

export interface VndbInfo {
  id?: string
  names: string[]
  aliases?: string[]
  mainName: string
  originalTitle: string
  alttitle?: string
  mainImageUrl: string | null
  screenshotUrl: string | null
  screenshots: string[]
  description: string | null
  translatedDescription: string | null
  va: VndbVoiceActor[]
  tags: VndbTag[]
  relations: VndbRelation[]
  extlinks: VndbExtLink[]
  play_hours: number
  length_minute: number
  length_votes: number
  length_color: string
  book_length: string
  rating?: number
  average?: number
  votecount?: number
  released?: string
  developers?: VndbDeveloper[]
  platforms?: string[]
  languages?: string[]
  olang?: string
  devstatus?: number
  characters?: VndbCharacter[]
  quotes?: VndbQuote[]
}

export interface VndbCharacter {
  id: string
  name: string
  original?: string
  image?: string
  sex?: string
  description?: string
  age?: number
}

export interface VndbQuote {
  id: string
  quote: string
  character?: {
    id: string
    name: string
    original?: string
  }
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
    const response = await fetch(`${getVndbApiBaseUrl()}/vn`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: ['search', '=', gameName],
        fields:
          'id, title, alttitle, aliases, titles{lang, title, official, main}, description, image{url, sexual, violence}, screenshots{url, sexual, violence, votecount}, length_minutes, length_votes, rating, average, votecount, released, developers{id, name, original}, platforms, languages, olang, devstatus, tags{id, name, rating, spoiler, category}, relations{id, title, relation, relation_official}, extlinks{url, label, name}, va{note, character{id, name, original}, staff{id, name, original}}',
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
    const developers: VndbDeveloper[] = result.developers
      ? result.developers.map((dev: { id: string; name: string; original?: string }) => ({
          id: dev.id,
          name: dev.name,
          original: dev.original,
        }))
      : []

    // 提取标签信息 - 按评分排序，过滤掉剧透标签
    const tags: VndbTag[] = result.tags
      ? result.tags
          .filter((tag: { spoiler: number }) => tag.spoiler === 0)
          .sort((a: { rating: number }, b: { rating: number }) => b.rating - a.rating)
          .slice(0, 20)
          .map((tag: { id: string; name: string; rating: number; spoiler: number; category: string }) => ({
            id: tag.id,
            name: tag.name,
            rating: tag.rating,
            spoiler: tag.spoiler,
            category: tag.category,
          }))
      : []

    // 提取声优信息
    const va: VndbVoiceActor[] = result.va
      ? result.va.map(
          (v: {
            note: string | null
            character: { id: string; name: string; original?: string }
            staff: { id: string; name: string; original?: string }
          }) => ({
            note: v.note,
            character: v.character,
            staff: v.staff,
          }),
        )
      : []

    // 提取相关作品
    const relations: VndbRelation[] = result.relations
      ? result.relations.map((r: { id: string; title: string; relation: string; relation_official: boolean }) => ({
          id: r.id,
          title: r.title,
          relation: r.relation,
          relation_official: r.relation_official,
        }))
      : []

    // 提取外部链接
    const extlinks: VndbExtLink[] = result.extlinks
      ? result.extlinks.map((link: { url: string; label: string; name: string }) => ({
          url: link.url,
          label: link.label,
          name: link.name,
        }))
      : []

    // 提取别名
    const aliases: string[] = result.aliases || []

    const finalResult: VndbInfo = {
      id: result.id || undefined,
      names: [...new Set(names)],
      aliases: aliases.length > 0 ? aliases : undefined,
      mainName,
      originalTitle: result.title,
      alttitle: result.alttitle || undefined,
      mainImageUrl,
      screenshotUrl,
      screenshots,
      description: result.description || null,
      translatedDescription: null,
      va,
      tags,
      relations,
      extlinks,
      play_hours,
      length_minute,
      length_votes,
      length_color,
      book_length,
      rating: result.rating || undefined,
      average: result.average || undefined,
      votecount: result.votecount || undefined,
      released: result.released || undefined,
      developers: developers.length > 0 ? developers : undefined,
      platforms: result.platforms || undefined,
      languages: result.languages || undefined,
      olang: result.olang || undefined,
      devstatus: result.devstatus,
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
 * 获取 VNDB 角色列表
 * @param vnId - 游戏 ID（如 "v19073"）
 * @returns 角色列表
 */
export async function fetchVndbCharacters(vnId: string): Promise<VndbCharacter[]> {
  try {
    const response = await fetch(`${getVndbApiBaseUrl()}/character`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: ['vn', '=', ['id', '=', vnId]],
        fields: 'id, name, original, image{url, sexual, violence}, sex, description, age',
        results: 15,
      }),
    })

    if (!response.ok) {
      throw new Error(`VNDB Character API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return []
    }

    // 转换角色数据，过滤不安全图片
    const characters: VndbCharacter[] = data.results.map(
      (c: {
        id: string
        name: string
        original?: string
        image?: { url: string; sexual: number; violence: number }
        sex?: [string, string]
        description?: string
        age?: number
      }) => {
        let imageUrl: string | undefined
        if (c.image && c.image.url && c.image.sexual <= 1 && c.image.violence === 0) {
          imageUrl = c.image.url
        }

        return {
          id: c.id,
          name: c.name,
          original: c.original,
          image: imageUrl,
          sex: c.sex?.[0],
          description: c.description,
          age: c.age,
        }
      },
    )

    // 使用代理替换 URL
    if (ENABLE_VNDB_IMAGE_PROXY && isProxyAvailable) {
      characters.forEach((char) => {
        if (char.image && char.image.startsWith('https://t.vndb.org/')) {
          char.image = proxyUrl(char.image)
        }
      })
    }

    return characters
  } catch (error) {
    return []
  }
}

/**
 * 获取 VNDB 名言列表
 * @param vnId - 游戏 ID（如 "v19073"）
 * @returns 名言列表
 */
export async function fetchVndbQuotes(vnId: string): Promise<VndbQuote[]> {
  try {
    const response = await fetch(`${getVndbApiBaseUrl()}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: ['vn', '=', ['id', '=', vnId]],
        fields: 'id, quote, character{id, name, original}',
        // 获取更多名言以提供更丰富的内容（用户反馈 10 条不够）
        results: 25,
      }),
    })

    if (!response.ok) {
      throw new Error(`VNDB Quote API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return []
    }

    // 转换名言数据
    const quotes: VndbQuote[] = data.results.map(
      (q: {
        id: string
        quote: string
        character?: { id: string; name: string; original?: string }
      }) => ({
        id: q.id,
        quote: q.quote,
        character: q.character,
      }),
    )

    return quotes
  } catch (error) {
    return []
  }
}

// 翻译模式类型
export type TranslateMode = 'description' | 'tags' | 'quotes'

// 简介翻译提示词
const DESCRIPTION_PROMPT = `你是一名专业的视觉小说（Galgame/AVG）本地化专家。请将游戏简介精准翻译为简体中文。

【翻译规范】
1. 格式净化：清除所有 HTML、Markdown、BBCode 等标记，仅保留纯文本
2. 结构保留：保持原文段落划分，段落间用换行分隔
3. 术语处理：使用视觉小说领域通用的中文术语
4. 人名处理：优先使用中文圈广泛接受的译名，无通用译名时保留原名
5. 内容控制：禁止添加剧透、解释性文字或主观评价

【输出要求】
仅输出翻译后的纯文本，无需任何说明`

// 标签翻译提示词
const TAGS_PROMPT = `你是一名视觉小说（Galgame/AVG）专家，精通 VNDB 标签体系。请将以下游戏标签翻译为简体中文。

【输入格式】
每行一个英文标签

【翻译规范】
1. 使用 VNDB 中文社区或 Bangumi 等平台的通用译法
2. 游戏机制类标签直译（如 Multiple Endings → 多结局）
3. 角色属性类标签使用二次元圈常用说法（如 Tsundere → 傲娇）
4. 无通用译法的专有名词可保留英文或音译
5. 保持简洁，每个标签译文不超过 10 个字

【输出要求】
每行输出一个翻译结果，与输入行数严格一一对应
仅输出译文，无需编号、原文或解释`

// 名言翻译提示词
const QUOTES_PROMPT = `你是一名专业的视觉小说（Galgame/AVG）本地化专家。请将游戏中的经典台词/名言翻译为简体中文。

【输入格式】
每行一条英文/日文台词

【翻译规范】
1. 保留原文的情感色彩和语气特点
2. 台词中的人名保留原文或使用通用译名
3. 注意口语化表达，符合角色说话习惯
4. 保持原文的文学性和感染力
5. 不要添加引号或其他标点修饰

【输出要求】
每行输出一条翻译结果，与输入行数严格一一对应
仅输出译文，无需编号、原文或解释`

// 合并翻译提示词
const COMBINED_PROMPT = `你是一名专业的视觉小说（Galgame/AVG）本地化专家。请将以下内容翻译为简体中文。

输入格式使用 ===SECTION=== 分隔三个部分：
1. 游戏简介
2. 游戏标签（每行一个）
3. 经典台词（每行一条）

【翻译规范】
- 简介：清除HTML标记，保持段落结构，使用通用中文术语
- 标签：使用二次元圈常用说法，保持简洁
- 台词：保留情感色彩和语气，注意口语化

【输出格式】
严格按以下格式输出，使用相同的分隔符：
===SECTION===
翻译后的简介
===SECTION===
翻译后的标签（每行一个，与输入行数对应）
===SECTION===
翻译后的台词（每行一条，与输入行数对应）

仅输出翻译结果，无需任何说明`

/**
 * AI 翻译文本
 * @param text - 要翻译的文本
 * @param mode - 翻译模式：description（简介）、tags（标签）或 quotes（名言）
 * @param maxRetries - 最大重试次数
 * @returns 翻译后的文本，失败返回 null
 */
export async function translateText(
  text: string, 
  mode: TranslateMode = 'description',
  maxRetries: number = 2,
): Promise<string | null> {
  if (!text || text.trim().length === 0) {
    return null
  }

  // 根据模式选择提示词和参数（针对 Qwen2.5 优化）
  const modeConfig = {
    description: { prompt: DESCRIPTION_PROMPT, maxLength: 3000, maxTokens: 2000, temperature: 0.1 },
    tags: { prompt: TAGS_PROMPT, maxLength: 1500, maxTokens: 1000, temperature: 0.05 },
    quotes: { prompt: QUOTES_PROMPT, maxLength: 2000, maxTokens: 1500, temperature: 0.2 },
  }
  
  const config = modeConfig[mode]
  const systemPrompt = config.prompt
  const maxLength = config.maxLength
  const maxTokens = config.maxTokens
  const temperature = config.temperature

  const textToTranslate = text.length > maxLength ? text.substring(0, maxLength) + '...' : text

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(getAiTranslateApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAiTranslateApiKey()}`,
        },
        body: JSON.stringify({
          model: getAiTranslateModel(),
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: textToTranslate,
            },
          ],
          temperature,
          max_tokens: maxTokens,
          top_p: 0.9,
          top_k: 50,
          repetition_penalty: 1.05,
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

/**
 * 合并翻译：一次 API 请求翻译描述、标签和名言
 */
export interface TranslateAllResult {
  description: string | null
  tags: string[] | null
  quotes: string[] | null
}

export async function translateAllContent(
  description: string | null,
  tags: string[] | null,
  quotes: string[] | null,
  maxRetries: number = 2,
): Promise<TranslateAllResult> {
  const result: TranslateAllResult = {
    description: null,
    tags: null,
    quotes: null,
  }

  // 构建输入文本
  const descText = description?.trim() || ''
  const tagsText = tags?.join('\n') || ''
  const quotesText = quotes?.join('\n') || ''

  // 如果没有任何内容需要翻译
  if (!descText && !tagsText && !quotesText) {
    return result
  }

  const inputText = [descText, tagsText, quotesText].join('\n===SECTION===\n')

  // 限制总长度
  const maxLength = 6000
  const textToTranslate = inputText.length > maxLength 
    ? inputText.substring(0, maxLength) + '...' 
    : inputText

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(getAiTranslateApiUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAiTranslateApiKey()}`,
        },
        body: JSON.stringify({
          model: getAiTranslateModel(),
          messages: [
            { role: 'system', content: COMBINED_PROMPT },
            { role: 'user', content: textToTranslate },
          ],
          temperature: 0.15,      // 低温度保证翻译准确性
          max_tokens: 4000,
          top_p: 0.9,             // 核采样，平衡多样性和准确性
          top_k: 50,              // 限制候选词范围
          repetition_penalty: 1.05, // 轻微惩罚重复
          stream: false,
        }),
      })

      if (!response.ok) {
        if (attempt === maxRetries) return result
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content?.trim()

      if (content) {
        // 解析返回结果
        const parts = content.split(/===SECTION===/).map((s: string) => s.trim()).filter((s: string) => s)
        
        if (parts.length >= 1 && descText) {
          result.description = parts[0] || null
        }
        if (parts.length >= 2 && tagsText) {
          result.tags = parts[1]?.split('\n').map((s: string) => s.trim()).filter((s: string) => s) || null
        }
        if (parts.length >= 3 && quotesText) {
          result.quotes = parts[2]?.split('\n').map((s: string) => s.trim()).filter((s: string) => s) || null
        }
        
        return result
      }

      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
        continue
      }

      return result
    } catch {
      if (attempt === maxRetries) return result
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)))
    }
  }

  return result
}

async function checkProxyAvailability() {
  // 始终启用代理，不进行可用性检查
  // 因为代理服务器可能不支持 HEAD 请求
  isProxyAvailable = true
}

// 生成代理 URL
function proxyUrl(url: string): string {
  return getVndbImageProxyUrl() + url
}

function replaceVndbUrls(vndbInfo: VndbInfo) {
  if (!ENABLE_VNDB_IMAGE_PROXY || !isProxyAvailable) {
    return
  }

  // 替换封面图片 URL
  if (vndbInfo.mainImageUrl && vndbInfo.mainImageUrl.startsWith('https://t.vndb.org/')) {
    vndbInfo.mainImageUrl = proxyUrl(vndbInfo.mainImageUrl)
  }

  // 替换主截图 URL
  if (vndbInfo.screenshotUrl && vndbInfo.screenshotUrl.startsWith('https://t.vndb.org/')) {
    vndbInfo.screenshotUrl = proxyUrl(vndbInfo.screenshotUrl)
  }

  // 替换所有截图 URL
  if (vndbInfo.screenshots && vndbInfo.screenshots.length > 0) {
    vndbInfo.screenshots = vndbInfo.screenshots.map((url) => {
      if (url.startsWith('https://t.vndb.org/')) {
        return proxyUrl(url)
      }
      return url
    })
  }
}
