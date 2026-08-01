/**
 * 搜索错误的归类与文案
 *
 * 后端 SSE 与 fetch 抛出的错误只是一个字符串，这里把它翻译成用户能看懂的
 * 标题、说明、错误码与一个用于配图标的分类。
 *
 * 迁移前这些逻辑（约 120 行）散在 SearchErrorCard.vue 里，由五个函数各自
 * 把同一个字符串重新 toLowerCase 再重新匹配一遍互相重叠的条件。这里合并成
 * 一次解析，组件只负责渲染。
 */

/** 错误大类，组件据此选图标与配色 */
export type SearchErrorKind = 'network' | 'timeout' | 'server' | 'unknown'

export interface SearchErrorInfo {
  kind: SearchErrorKind
  /** 卡片标题 */
  title: string
  /** 给用户看的说明 */
  message: string
  /** 技术细节（堆栈 / JSON 片段），没有就是 null */
  details: string | null
  /** 形如 HTTP 502 或 ERR_TIMEOUT */
  code: string
  /** 错误码的英文说明 */
  description: string
  /** 仅当能从错误串里解析出 4xx/5xx 时有值 */
  httpStatus?: number
}

/** 关键字 → 用户可读说明。按顺序匹配，先命中先返回。 */
const MESSAGE_BY_KEYWORD: [needle: string, message: string][] = [
  ['failed to fetch', '无法连接到服务器，请检查网络连接'],
  ['network error', '网络错误，请检查您的网络连接'],
  ['timeout', '请求超时，服务器响应过慢'],
  ['cors', '跨域请求被阻止，请联系管理员'],
  ['500', '服务器内部错误，请稍后重试'],
  ['502', '网关错误，后端服务可能不可用'],
  ['503', '服务暂时不可用，请稍后重试'],
  ['504', '网关超时，请稍后重试'],
  ['404', '请求的资源不存在'],
  ['403', '访问被拒绝'],
  ['401', '未授权访问'],
  ['429', '请求过于频繁，请稍后重试'],
]

const HTTP_STATUS_TEXT: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
}

/** 非 HTTP 类错误的识别规则，顺序即优先级 */
const ERROR_CODE_RULES: [needles: string[], code: string, description: string][] = [
  [['fetch', 'network', '连接'], 'ERR_NETWORK', 'Network Error'],
  [['timeout', '超时'], 'ERR_TIMEOUT', 'Request Timeout'],
  [['cors'], 'ERR_CORS', 'Cross-Origin Blocked'],
  [['abort', '取消'], 'ERR_ABORTED', 'Request Aborted'],
  [['dns', 'resolve'], 'ERR_DNS', 'DNS Resolution Failed'],
  [['ssl', 'certificate', '证书'], 'ERR_SSL', 'SSL Certificate Error'],
  [['parse', 'json', '解析'], 'ERR_PARSE', 'Response Parse Error'],
  [['stream', '流'], 'ERR_STREAM', 'Stream Error'],
]

/** 技术细节的识别模式：JSON 块、Error: 开头的段落、堆栈帧 */
const DETAIL_PATTERNS = [/\{[\s\S]*\}/, /Error:[\s\S]*/, /at\s+[\w.]+\s+\(/]

const MAX_MESSAGE_LENGTH = 200
const MAX_DETAIL_LENGTH = 300
/** 短于这个长度的匹配多半是正文的一部分，不算「技术细节」 */
const MIN_DETAIL_LENGTH = 50

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some(n => haystack.includes(n))
}

function pickMessage(raw: string, lower: string): string {
  for (const [needle, message] of MESSAGE_BY_KEYWORD) {
    if (lower.includes(needle)) { return message }
  }
  return raw.length > MAX_MESSAGE_LENGTH
    ? `${raw.slice(0, MAX_MESSAGE_LENGTH)}...`
    : raw
}

function pickDetails(raw: string): string | null {
  for (const pattern of DETAIL_PATTERNS) {
    const match = pattern.exec(raw)
    if (match && match[0].length > MIN_DETAIL_LENGTH) {
      const text = match[0]
      return text.length > MAX_DETAIL_LENGTH
        ? `${text.slice(0, MAX_DETAIL_LENGTH)}...`
        : text
    }
  }
  return null
}

function pickKind(lower: string): SearchErrorKind {
  if (hasAny(lower, ['fetch', 'network', '连接'])) { return 'network' }
  if (hasAny(lower, ['timeout', '超时'])) { return 'timeout' }
  if (hasAny(lower, ['500', '502', '503', 'server'])) { return 'server' }
  return 'unknown'
}

function pickTitle(lower: string): string {
  if (hasAny(lower, ['fetch', 'network'])) { return '网络连接失败' }
  if (hasAny(lower, ['timeout', '超时'])) { return '请求超时' }
  if (lower.includes('500')) { return '服务器内部错误' }
  if (hasAny(lower, ['502', '503'])) { return '服务暂时不可用' }
  if (lower.includes('404')) { return '资源不存在' }
  if (lower.includes('429')) { return '请求频率过高' }
  return '搜索遇到问题'
}

/** 把一条搜索错误解析成展示所需的全部信息 */
export function describeSearchError(error: string): SearchErrorInfo {
  const lower = error.toLowerCase()

  // HTTP 状态码优先：它比关键字更明确
  const statusMatch = /\b(4\d{2}|5\d{2})\b/.exec(error)
  const status = statusMatch?.[1] ? Number(statusMatch[1]) : null

  const base = {
    kind: pickKind(lower),
    title: pickTitle(lower),
    message: pickMessage(error, lower),
    details: pickDetails(error),
  }

  if (status !== null) {
    return {
      ...base,
      code: `HTTP ${status}`,
      httpStatus: status,
      description: HTTP_STATUS_TEXT[status] ?? 'Server Error',
    }
  }

  for (const [needles, code, description] of ERROR_CODE_RULES) {
    if (hasAny(lower, needles)) {
      return { ...base, code, description }
    }
  }

  return { ...base, code: 'ERR_UNKNOWN', description: 'Unknown Error' }
}
