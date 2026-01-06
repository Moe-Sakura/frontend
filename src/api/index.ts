/**
 * API 模块统一导出
 * 
 * 使用方式：
 * import { fetchVndbData, translateText, searchGameStream } from '@/api'
 */

// 配置函数
export {
  getVndbApiBaseUrl,
  getAiTranslateApiUrl,
  getAiTranslateApiKey,
  getAiTranslateModel,
  getVndbImageProxyUrl,
  getVideoParseApiUrl,
} from './config'

// VNDB API
export {
  ENABLE_VNDB_IMAGE_PROXY,
  fetchVndbData,
  fetchVndbCharacters,
  fetchVndbQuotes,
  fetchGameVideoUrl,
} from './vndb'

// 翻译 API
export {
  translateText,
  translateAllContent,
} from './translate'

// 搜索 API
export {
  searchGameStream,
} from './search'

// 类型导出
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
  SearchResult,
  PlatformData,
  VideoParseResult,
  TranslateMode,
  TranslateAllResult,
} from '@/types/vndb'

