/**
 * 环境变量配置
 * 从 .env 文件中读取配置
 */

// API 配置
export const API_CONFIG = {
  defaultApiUrl: import.meta.env.VITE_DEFAULT_API_URL || 'https://cf.api.searchgal.top',
  vndbApiUrl: import.meta.env.VITE_VNDB_API_URL || 'https://api.vndb.org/kana/vn',
  translateApiUrl: import.meta.env.VITE_TRANSLATE_API_URL || 'https://cf.api.searchgal.top/translate',
  statusApiUrl: import.meta.env.VITE_STATUS_API_URL || 'https://status.searchgal.top',
  randomImageApi: import.meta.env.VITE_RANDOM_IMAGE_API || 'https://api.illlights.com/v1/img',
} as const

// 应用配置
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'SearchGal',
  title: import.meta.env.VITE_APP_TITLE || 'SearchGal - Galgame 聚合搜索',
  description: import.meta.env.VITE_APP_DESCRIPTION || 'Galgame 资源聚合搜索引擎',
  url: import.meta.env.VITE_APP_URL || 'https://www.searchgal.top',
} as const

// 功能开关
export const FEATURE_FLAGS = {
  enablePwa: import.meta.env.VITE_ENABLE_PWA === 'true',
  enableSw: import.meta.env.VITE_ENABLE_SW === 'true',
  enableComments: import.meta.env.VITE_ENABLE_COMMENTS === 'true',
  enableVndb: import.meta.env.VITE_ENABLE_VNDB === 'true',
  enableTranslate: import.meta.env.VITE_ENABLE_TRANSLATE === 'true',
  enableHistory: import.meta.env.VITE_ENABLE_HISTORY === 'true',
  enableCache: import.meta.env.VITE_ENABLE_CACHE === 'true',
  enablePerformance: import.meta.env.VITE_ENABLE_PERFORMANCE === 'true',
  enableDevLogs: import.meta.env.VITE_ENABLE_DEV_LOGS === 'true',
} as const

// 搜索配置
export const SEARCH_CONFIG = {
  defaultMode: (import.meta.env.VITE_DEFAULT_SEARCH_MODE as 'game' | 'patch') || 'game',
  cooldown: Number(import.meta.env.VITE_SEARCH_COOLDOWN) || 30000,
  defaultResultsPerPage: Number(import.meta.env.VITE_DEFAULT_RESULTS_PER_PAGE) || 10,
  loadMoreCount: Number(import.meta.env.VITE_LOAD_MORE_COUNT) || 20,
  maxHistoryItems: Number(import.meta.env.VITE_MAX_HISTORY_ITEMS) || 50,
} as const

// 缓存配置
export const CACHE_CONFIG = {
  vndbCacheDuration: Number(import.meta.env.VITE_VNDB_CACHE_DURATION) || 1800000, // 30分钟
  searchCacheDuration: Number(import.meta.env.VITE_SEARCH_CACHE_DURATION) || 600000, // 10分钟
  imageCacheDuration: Number(import.meta.env.VITE_IMAGE_CACHE_DURATION) || 3600000, // 60分钟
  maxCacheSize: Number(import.meta.env.VITE_MAX_CACHE_SIZE) || 100,
} as const

// UI 配置
export const UI_CONFIG = {
  themePrimary: import.meta.env.VITE_THEME_PRIMARY || '#ff1493',
  themeAccent: import.meta.env.VITE_THEME_ACCENT || '#ff69b4',
  toastDuration: Number(import.meta.env.VITE_TOAST_DURATION) || 3000,
  scrollOffset: Number(import.meta.env.VITE_SCROLL_OFFSET) || 80,
  scrollTopThreshold: Number(import.meta.env.VITE_SCROLL_TOP_THRESHOLD) || 200,
} as const

// 第三方服务配置
export const THIRD_PARTY_CONFIG = {
  artalkServer: import.meta.env.VITE_ARTALK_SERVER || 'https://artalk.saop.cc',
  artalkSite: import.meta.env.VITE_ARTALK_SITE || '旮旯聚搜',
  busuanziEnabled: import.meta.env.VITE_BUSUANZI_ENABLED === 'true',
} as const

// 性能配置
export const PERFORMANCE_CONFIG = {
  statusCheckInterval: Number(import.meta.env.VITE_STATUS_CHECK_INTERVAL) || 30000,
  statusCheckTimeout: Number(import.meta.env.VITE_STATUS_CHECK_TIMEOUT) || 5000,
} as const

// 开发配置
export const DEV_CONFIG = {
  port: Number(import.meta.env.VITE_DEV_PORT) || 5500,
  hmr: import.meta.env.VITE_HMR === 'true',
  sourcemap: import.meta.env.VITE_SOURCEMAP === 'true',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const

// 导出所有配置
export const CONFIG = {
  api: API_CONFIG,
  app: APP_CONFIG,
  features: FEATURE_FLAGS,
  search: SEARCH_CONFIG,
  cache: CACHE_CONFIG,
  ui: UI_CONFIG,
  thirdParty: THIRD_PARTY_CONFIG,
  performance: PERFORMANCE_CONFIG,
  dev: DEV_CONFIG,
} as const

// 类型导出
export type AppConfig = typeof CONFIG

// 开发环境下打印配置（方便调试）
if (DEV_CONFIG.isDev && FEATURE_FLAGS.enableDevLogs) {
  console.info('📦 Application Config:', CONFIG)
}

