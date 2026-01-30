/**
 * 环境变量配置工具
 * 提供类型安全的环境变量访问
 */

interface AppConfig {
  // 应用信息
  app: {
    title: string
    description: string
    version: string
  }
  
  // API 配置
  api: {
    baseUrl: string
    timeout: number
    translateUrl: string
    vndbUrl: string
  }
  
  // 外部服务
  services: {
    statusUrl: string
    artalkServer: string
    imageApiUrl: string
  }
  
  // 网站信息
  site: {
    url: string
    name: string
    githubUrl: string
  }
  
  // 功能开关
  features: {
    comments: boolean
    vndb: boolean
    aiTranslate: boolean
    pwa: boolean
    analytics: boolean
  }
  
  // 搜索配置
  search: {
    cooldown: number
    defaultResultsPerPage: number
    loadMoreCount: number
    maxSearchHistory: number
  }
  
  // 缓存配置
  cache: {
    vndbDuration: number
    searchDuration: number
    imageDuration: number
    maxSize: number
  }
  
  // 主题配置
  theme: {
    primary: string
    accent: string
    backgroundLight: string
    backgroundDark: string
  }
  
  // 性能配置
  performance: {
    lazyLoadThreshold: number
  }
  
  // 开发配置
  dev: {
    debug: boolean
    mock: boolean
  }
}

type EnvValue = string | number | boolean

/**
 * 获取环境变量值，支持类型转换
 */
function getEnv<T extends EnvValue>(key: string, defaultValue: T): T {
  const value = import.meta.env[key]
  
  if (value === undefined || value === '') {
    return defaultValue
  }
  
  // 布尔值转换
  if (value === 'true') {
    return true as T
  }
  if (value === 'false') {
    return false as T
  }
  
  // 数字转换
  if (!isNaN(Number(value)) && value !== '') {
    return Number(value) as T
  }
  
  return value as T
}

/**
 * 应用配置对象
 */
export const config: AppConfig = {
  app: {
    title: getEnv('VITE_APP_TITLE', 'SearchGal - Galgame 聚合搜索'),
    description: getEnv('VITE_APP_DESCRIPTION', '多平台 Galgame 资源聚合搜索引擎'),
    version: getEnv('VITE_APP_VERSION', '1.0.0'),
  },
  
  api: {
    baseUrl: getEnv('VITE_API_BASE_URL', 'https://cf.api.searchgal.top'),
    timeout: getEnv('VITE_API_TIMEOUT', 30000),
    translateUrl: getEnv('VITE_TRANSLATE_API_URL', 'https://translate.searchgal.top'),
    vndbUrl: getEnv('VITE_VNDB_API_URL', 'https://api.vndb.org/kana/v1'),
  },
  
  services: {
    statusUrl: getEnv('VITE_STATUS_URL', 'https://status.searchgal.top'),
    artalkServer: getEnv('VITE_ARTALK_SERVER', 'https://artalk.saop.cc'),
    imageApiUrl: getEnv('VITE_IMAGE_API_URL', 'https://api.illlights.com/v1/img'),
  },
  
  site: {
    url: getEnv('VITE_SITE_URL', 'https://www.searchgal.top'),
    name: getEnv('VITE_SITE_NAME', 'SearchGal'),
    githubUrl: getEnv('VITE_GITHUB_URL', 'https://github.com/Moe-Sakura/frontend'),
  },
  
  features: {
    comments: getEnv('VITE_ENABLE_COMMENTS', true),
    vndb: getEnv('VITE_ENABLE_VNDB', true),
    aiTranslate: getEnv('VITE_ENABLE_AI_TRANSLATE', true),
    pwa: getEnv('VITE_ENABLE_PWA', true),
    analytics: getEnv('VITE_ENABLE_ANALYTICS', false),
  },
  
  search: {
    cooldown: getEnv('VITE_SEARCH_COOLDOWN', 30000),
    defaultResultsPerPage: getEnv('VITE_DEFAULT_RESULTS_PER_PAGE', 10),
    loadMoreCount: getEnv('VITE_LOAD_MORE_COUNT', 20),
    maxSearchHistory: getEnv('VITE_MAX_SEARCH_HISTORY', 50),
  },
  
  cache: {
    vndbDuration: getEnv('VITE_CACHE_VNDB_DURATION', 1800000),
    searchDuration: getEnv('VITE_CACHE_SEARCH_DURATION', 600000),
    imageDuration: getEnv('VITE_CACHE_IMAGE_DURATION', 3600000),
    maxSize: getEnv('VITE_MAX_CACHE_SIZE', 100),
  },
  
  theme: {
    primary: getEnv('VITE_THEME_PRIMARY', '#ff1493'),
    accent: getEnv('VITE_THEME_ACCENT', '#d946ef'),
    backgroundLight: getEnv('VITE_THEME_BACKGROUND_LIGHT', '#fff5fa'),
    backgroundDark: getEnv('VITE_THEME_BACKGROUND_DARK', '#1e293b'),
  },
  
  performance: {
    lazyLoadThreshold: getEnv('VITE_LAZY_LOAD_THRESHOLD', 0.5),
  },
  
  dev: {
    debug: getEnv('VITE_ENABLE_DEBUG', false),
    mock: getEnv('VITE_ENABLE_MOCK', false),
  },
}

/**
 * 判断是否为开发环境
 */
export const isDev = import.meta.env.DEV

/**
 * 判断是否为生产环境
 */
export const isProd = import.meta.env.PROD

/**
 * 获取当前模式
 */
export const mode = import.meta.env.MODE

/**
 * 开发环境日志
 */
export function devLog(...args: unknown[]) {
  if (config.dev.debug && isDev) {
    console.info('[Dev]', ...args)
  }
}

/**
 * 开发环境警告
 */
export function devWarn(...args: unknown[]) {
  if (config.dev.debug && isDev) {
    console.warn('[Dev]', ...args)
  }
}

/**
 * 开发环境错误
 */
export function devError(...args: unknown[]) {
  if (config.dev.debug && isDev) {
    console.error('[Dev]', ...args)
  }
}

// 开发环境打印配置信息
if (isDev && config.dev.debug) {
  console.info('🔧 Application Config:', config)
  console.info('🌍 Environment:', mode)
}
