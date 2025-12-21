/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface Window {
  Pace: {
    restart(): void
    options: {
      ajax?: boolean
      document?: boolean
      eventLag?: boolean
      elements?: boolean
      restartOnPushState?: boolean
      restartOnRequestAfter?: boolean
    }
  }
}

// 环境变量类型定义
interface ImportMetaEnv {
  // API 配置
  readonly VITE_DEFAULT_API_URL: string
  readonly VITE_VNDB_API_URL: string
  readonly VITE_TRANSLATE_API_URL: string
  readonly VITE_STATUS_API_URL: string
  readonly VITE_RANDOM_IMAGE_API: string
  
  // 应用配置
  readonly VITE_APP_NAME: string
  readonly VITE_APP_TITLE: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_APP_URL: string
  
  // 功能开关
  readonly VITE_ENABLE_PWA: string
  readonly VITE_ENABLE_SW: string
  readonly VITE_ENABLE_COMMENTS: string
  readonly VITE_ENABLE_VNDB: string
  readonly VITE_ENABLE_TRANSLATE: string
  readonly VITE_ENABLE_HISTORY: string
  readonly VITE_ENABLE_CACHE: string
  readonly VITE_ENABLE_PERFORMANCE: string
  readonly VITE_ENABLE_DEV_LOGS: string
  
  // 搜索配置
  readonly VITE_DEFAULT_SEARCH_MODE: string
  readonly VITE_SEARCH_COOLDOWN: string
  readonly VITE_DEFAULT_RESULTS_PER_PAGE: string
  readonly VITE_LOAD_MORE_COUNT: string
  readonly VITE_MAX_HISTORY_ITEMS: string
  
  // 缓存配置
  readonly VITE_VNDB_CACHE_DURATION: string
  readonly VITE_SEARCH_CACHE_DURATION: string
  readonly VITE_IMAGE_CACHE_DURATION: string
  readonly VITE_MAX_CACHE_SIZE: string
  
  // UI 配置
  readonly VITE_THEME_PRIMARY: string
  readonly VITE_THEME_ACCENT: string
  readonly VITE_TOAST_DURATION: string
  readonly VITE_SCROLL_OFFSET: string
  readonly VITE_SCROLL_TOP_THRESHOLD: string
  
  // 第三方服务
  readonly VITE_ARTALK_SERVER: string
  readonly VITE_ARTALK_SITE: string
  readonly VITE_BUSUANZI_ENABLED: string
  
  // 性能配置
  readonly VITE_STATUS_CHECK_INTERVAL: string
  readonly VITE_STATUS_CHECK_TIMEOUT: string
  
  // 开发配置
  readonly VITE_DEV_PORT: string
  readonly VITE_HMR: string
  readonly VITE_SOURCEMAP: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

