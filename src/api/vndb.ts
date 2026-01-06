/**
 * VNDB API
 * 处理与 VNDB 数据库的交互
 */

import { getVndbApiBaseUrl, getVndbImageProxyUrl, getVideoParseApiUrl } from './config'
import type { 
  VndbInfo, 
  VndbCharacter, 
  VndbQuote, 
  VndbTag,
  VndbVoiceActor,
  VndbDeveloper,
  VndbRelation,
  VndbExtLink,
  VndbTitleEntry,
  VndbScreenshot,
  VideoParseResult,
} from '@/types/vndb'

// 重新导出类型
export type { VndbInfo, VndbCharacter, VndbQuote }

// 常量
export const ENABLE_VNDB_IMAGE_PROXY = true

let isProxyAvailable = false

// ============================================
// 辅助函数
// ============================================

async function checkProxyAvailability() {
  isProxyAvailable = true
}

function proxyUrl(url: string): string {
  return getVndbImageProxyUrl() + url
}

function replaceVndbUrls(vndbInfo: VndbInfo) {
  if (!ENABLE_VNDB_IMAGE_PROXY || !isProxyAvailable) {return}

  if (vndbInfo.mainImageUrl?.startsWith('https://t.vndb.org/')) {
    vndbInfo.mainImageUrl = proxyUrl(vndbInfo.mainImageUrl)
  }

  if (vndbInfo.screenshotUrl?.startsWith('https://t.vndb.org/')) {
    vndbInfo.screenshotUrl = proxyUrl(vndbInfo.screenshotUrl)
  }

  if (vndbInfo.screenshots && vndbInfo.screenshots.length > 0) {
    vndbInfo.screenshots = vndbInfo.screenshots.map((url) => {
      if (url.startsWith('https://t.vndb.org/')) {
        return proxyUrl(url)
      }
      return url
    })
  }
}

// ============================================
// API 函数
// ============================================

/**
 * 获取游戏 PV 视频 URL
 */
export async function fetchGameVideoUrl(vndbId: string): Promise<string | null> {
  if (!vndbId) {return null}

  try {
    const response = await fetch(getVideoParseApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vndb_id: vndbId }),
    })

    if (!response.ok) {return null}

    const data: VideoParseResult = await response.json()
    return data.success && data.video_url ? data.video_url : null
  } catch {
    return null
  }
}

/**
 * 获取 VNDB 数据
 */
export async function fetchVndbData(gameName: string): Promise<VndbInfo | null> {
  try {
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

    // 获取封面图片
    let mainImageUrl: string | null = null
    if (result.image?.url) {
      if ((result.image.sexual === 0 || result.image.sexual === 1) && result.image.violence === 0) {
        mainImageUrl = result.image.url
      }
    }

    // 获取游戏截图
    let screenshotUrl: string | null = null
    const screenshots: string[] = []

    if (result.screenshots && Array.isArray(result.screenshots) && result.screenshots.length > 0) {
      const sortedScreenshots = [...result.screenshots]
        .filter((s: VndbScreenshot) => s.url && (s.sexual === 0 || s.sexual === 1) && s.violence === 0)
        .sort((a: VndbScreenshot, b: VndbScreenshot) => (b.votecount || 0) - (a.votecount || 0))

      if (sortedScreenshots.length > 0) {
        screenshotUrl = sortedScreenshots[0].url
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

    // 提取标签信息
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
  } catch {
    return null
  }
}

/**
 * 获取 VNDB 角色列表
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
        if (c.image?.url && c.image.sexual <= 1 && c.image.violence === 0) {
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
        if (char.image?.startsWith('https://t.vndb.org/')) {
          char.image = proxyUrl(char.image)
        }
      })
    }

    return characters
  } catch {
    return []
  }
}

/**
 * 获取 VNDB 名言列表
 */
export async function fetchVndbQuotes(vnId: string): Promise<VndbQuote[]> {
  try {
    const response = await fetch(`${getVndbApiBaseUrl()}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: ['vn', '=', ['id', '=', vnId]],
        fields: 'id, quote, character{id, name, original}',
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
  } catch {
    return []
  }
}

