# 环境变量使用示例

## 迁移现有代码到使用环境变量

### 1. API 调用

**之前（硬编码）：**
```typescript
const response = await fetch('https://cf.api.searchgal.top/search')
```

**之后（使用配置）：**
```typescript
import { config } from '@/config'

const response = await fetch(`${config.api.baseUrl}/search`)
```

### 2. 搜索冷却时间

**之前：**
```typescript
const COOLDOWN_MS = 30 * 1000
```

**之后：**
```typescript
import { config } from '@/config'

const cooldown = config.search.cooldown
```

### 3. Store 初始化

**在 stores/cache.ts 中：**
```typescript
import { config } from '@/config'

export const useCacheStore = defineStore('cache', () => {
  const vndbCacheDuration = ref(config.cache.vndbDuration)
  const searchCacheDuration = ref(config.cache.searchDuration)
  const maxCacheSize = ref(config.cache.maxSize)
  // ...
})
```

**在 stores/history.ts 中：**
```typescript
import { config } from '@/config'

export const useHistoryStore = defineStore('history', () => {
  const maxHistoryItems = ref(config.search.maxSearchHistory)
  // ...
})
```

**在 stores/search.ts 中：**
```typescript
import { config } from '@/config'

export const useSearchStore = defineStore('search', () => {
  const searchDisabled = computed(() => {
    const now = Date.now()
    return isSearching.value || (now - lastSearchTime.value < config.search.cooldown)
  })
  // ...
})
```

### 4. Artalk 评论系统

**在 CommentsModal.vue 中：**
```typescript
import { config } from '@/config'

function initArtalk() {
  if (!config.features.comments) {
    return // 如果评论功能被禁用，不初始化
  }
  
  artalkInstance = Artalk.init({
    el: '#Comments',
    pageKey: config.site.url,
    pageTitle: config.app.title,
    server: config.services.artalkServer,
    site: config.site.name,
    darkMode: 'auto',
  })
}
```

### 5. 状态检查

**在 SearchHeader.vue 中：**
```typescript
import { config } from '@/config'

async function checkStatus() {
  try {
    const controller = new window.AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    await fetch(config.services.statusUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    statusOnline.value = true
  } catch (_error) {
    statusOnline.value = false
  }
}
```

### 7. 随机背景图片

**在 App.vue 中：**
```typescript
import { config } from '@/config'

async function loadRandomImage() {
  try {
    const timestamp = Date.now()
    const imageUrl = `${config.services.imageApiUrl}?t=${timestamp}`
    // ...
  } catch (error) {
    // ...
  }
}
```

### 8. 调试日志

**使用工具函数：**
```typescript
import { devLog, devWarn, devError } from '@/config'

// 这些日志只在开发环境且 VITE_ENABLE_DEBUG=true 时显示
devLog('Fetching data from API...')
devWarn('API response is slow')
devError('API request failed')
```

### 9. 功能开关

**条件渲染：**
```vue
<script setup lang="ts">
import { config } from '@/config'

const showComments = config.features.comments
const showVndb = config.features.vndb
const showAiTranslate = config.features.aiTranslate
</script>

<template>
  <button v-if="showComments" @click="toggleComments">
    评论
  </button>
  
  <button v-if="showVndb" @click="toggleVndb">
    作品介绍
  </button>
  
  <button v-if="showAiTranslate" @click="handleTranslate">
    AI 翻译
  </button>
</template>
```

### 10. 主题颜色

**使用环境变量定义的颜色：**
```typescript
import { config } from '@/config'

// 动态设置 CSS 变量
document.documentElement.style.setProperty('--theme-primary', config.theme.primary)
document.documentElement.style.setProperty('--theme-accent', config.theme.accent)
```

## 完整示例：API 工具类

```typescript
// src/utils/request.ts
import { config, devLog, devError } from '@/config'

class ApiClient {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = config.api.baseUrl
    this.timeout = config.api.timeout
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`
    
    devLog('API Request:', url, options)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      
      devLog('API Response:', response.status, response.statusText)
      
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      devError('API Error:', error)
      throw error
    }
  }
}

export const apiClient = new ApiClient()
```

## 环境特定逻辑

```typescript
import { isDev, isProd, config } from '@/config'

// 开发环境特定逻辑
if (isDev) {
  // 启用 Vue DevTools
  if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
    window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue = app
  }
}

// 生产环境特定逻辑
if (isProd && config.features.analytics) {
  // 初始化统计工具
  initAnalytics()
}

// Mock 数据
if (config.dev.mock) {
  import('./mocks').then(({ setupMocks }) => {
    setupMocks()
  })
}
```

