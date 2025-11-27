/// <reference types="vite/client" />

interface ImportMetaEnv {
  // 应用信息
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_APP_VERSION: string
  
  // API 配置
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT: string
  readonly VITE_TRANSLATE_API_URL: string
  readonly VITE_VNDB_API_URL: string
  
  // 外部服务
  readonly VITE_STATUS_URL: string
  readonly VITE_ARTALK_SERVER: string
  readonly VITE_IMAGE_API_URL: string
  
  // 网站信息
  readonly VITE_SITE_URL: string
  readonly VITE_SITE_NAME: string
  readonly VITE_GITHUB_URL: string
  
  // 功能开关
  readonly VITE_ENABLE_COMMENTS: string
  readonly VITE_ENABLE_VNDB: string
  readonly VITE_ENABLE_AI_TRANSLATE: string
  readonly VITE_ENABLE_PWA: string
  readonly VITE_ENABLE_ANALYTICS: string
  
  // 搜索配置
  readonly VITE_SEARCH_COOLDOWN: string
  readonly VITE_DEFAULT_RESULTS_PER_PAGE: string
  readonly VITE_LOAD_MORE_COUNT: string
  readonly VITE_MAX_SEARCH_HISTORY: string
  
  // 缓存配置
  readonly VITE_CACHE_VNDB_DURATION: string
  readonly VITE_CACHE_SEARCH_DURATION: string
  readonly VITE_CACHE_IMAGE_DURATION: string
  readonly VITE_MAX_CACHE_SIZE: string
  
  // 主题配置
  readonly VITE_THEME_PRIMARY: string
  readonly VITE_THEME_ACCENT: string
  readonly VITE_THEME_BACKGROUND_LIGHT: string
  readonly VITE_THEME_BACKGROUND_DARK: string
  
  // 性能配置
  readonly VITE_QUICKLINK_DELAY: string
  readonly VITE_QUICKLINK_LIMIT: string
  readonly VITE_LAZY_LOAD_THRESHOLD: string
  
  // 开发配置
  readonly VITE_ENABLE_DEBUG: string
  readonly VITE_ENABLE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

