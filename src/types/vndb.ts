/**
 * VNDB API 类型定义
 * 统一管理 VNDB 相关的接口类型
 */

// ============================================
// 基础类型
// ============================================

export interface VndbVoiceActor {
  note: string | null
  character: { id: string; name: string; original?: string }
  staff: { id: string; name: string; original?: string }
}

export interface VndbTag {
  id: string
  name: string
  rating?: number
  spoiler?: number
  category?: string
}

export interface VndbRelation {
  id: string
  title: string
  relation: string
  relation_official?: boolean
}

export interface VndbExtLink {
  url: string
  label: string
  name: string
  id?: string
}

export interface VndbDeveloper {
  id?: string
  name: string
  original?: string
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

export interface VndbScreenshot {
  url: string
  sexual: number
  violence: number
  votecount?: number
}

export interface VndbTitleEntry {
  lang: string
  title: string
  official?: boolean
  main?: boolean
}

// ============================================
// 主要数据结构
// ============================================

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

// ============================================
// API 响应类型
// ============================================

export interface VndbApiItem {
  name: string
  url: string
}

// ============================================
// 搜索结果类型
// ============================================

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

export interface PlatformData extends PlatformResult {
  displayedCount: number
}

// ============================================
// 视频解析类型
// ============================================

export interface VideoParseResult {
  success: boolean
  game_result: number
  video_url: string
  error: string
}

// ============================================
// 翻译类型
// ============================================

export type TranslateMode = 'description' | 'tags' | 'quotes'

export interface TranslateAllResult {
  description: string | null
  tags: string[] | null
  quotes: string[] | null
}

