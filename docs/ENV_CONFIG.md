# 环境变量配置指南

SearchGal 使用 `.env` 文件进行全局配置管理。

## 快速开始

1. 复制示例文件：
```bash
cp .env.example .env
```

2. 根据需要修改 `.env` 文件中的配置

3. 重启开发服务器使配置生效

## 配置文件

- `.env` - 本地环境配置（不提交到 Git）
- `.env.example` - 配置示例（提交到 Git）
- `src/config/env.ts` - 配置读取和类型定义

## 使用方法

### 方式 1：直接导入配置对象（推荐）

```typescript
import { CONFIG } from '@/config'

// 使用 API 配置
const apiUrl = CONFIG.api.defaultApiUrl
console.log(apiUrl) // https://cf.api.searchgal.homes

// 使用功能开关
if (CONFIG.features.enableComments) {
  // 初始化评论系统
}

// 使用搜索配置
const cooldown = CONFIG.search.cooldown
console.log(cooldown) // 30000
```

### 方式 2：按需导入

```typescript
import { API_CONFIG, FEATURE_FLAGS, SEARCH_CONFIG } from '@/config'

// API 配置
console.log(API_CONFIG.defaultApiUrl)

// 功能开关
console.log(FEATURE_FLAGS.enableVndb)

// 搜索配置
console.log(SEARCH_CONFIG.defaultMode)
```

### 方式 3：直接访问环境变量（不推荐）

```typescript
// ❌ 不推荐：需要手动处理类型和默认值
const apiUrl = import.meta.env.VITE_DEFAULT_API_URL

// ✅ 推荐：使用配置对象，有类型提示和默认值
import { API_CONFIG } from '@/config'
const apiUrl = API_CONFIG.defaultApiUrl
```

## 配置分类

### 1. API 配置 (`API_CONFIG`)

```typescript
API_CONFIG.defaultApiUrl      // 默认搜索 API
API_CONFIG.vndbApiUrl          // VNDB API
API_CONFIG.translateApiUrl     // AI 翻译 API
API_CONFIG.statusApiUrl        // 状态检查 API
API_CONFIG.randomImageApi      // 随机背景图片 API
```

### 2. 应用配置 (`APP_CONFIG`)

```typescript
APP_CONFIG.name                // 应用名称
APP_CONFIG.title               // 应用标题
APP_CONFIG.description         // 应用描述
APP_CONFIG.url                 // 网站 URL
```

### 3. 功能开关 (`FEATURE_FLAGS`)

```typescript
FEATURE_FLAGS.enablePwa        // PWA 支持
FEATURE_FLAGS.enableSw         // Service Worker
FEATURE_FLAGS.enableComments   // 评论系统
FEATURE_FLAGS.enableVndb       // VNDB 集成
FEATURE_FLAGS.enableTranslate  // AI 翻译
FEATURE_FLAGS.enableHistory    // 搜索历史
FEATURE_FLAGS.enableCache      // 缓存系统
FEATURE_FLAGS.enablePerformance // 性能监控
FEATURE_FLAGS.enableDevLogs    // 开发日志
```

### 4. 搜索配置 (`SEARCH_CONFIG`)

```typescript
SEARCH_CONFIG.defaultMode          // 默认搜索模式
SEARCH_CONFIG.cooldown             // 搜索冷却时间（毫秒）
SEARCH_CONFIG.defaultResultsPerPage // 默认显示结果数
SEARCH_CONFIG.loadMoreCount        // 每次加载更多的数量
SEARCH_CONFIG.maxHistoryItems      // 最大历史记录数
```

### 5. 缓存配置 (`CACHE_CONFIG`)

```typescript
CACHE_CONFIG.vndbCacheDuration     // VNDB 缓存时长（毫秒）
CACHE_CONFIG.searchCacheDuration   // 搜索结果缓存时长（毫秒）
CACHE_CONFIG.imageCacheDuration    // 图片缓存时长（毫秒）
CACHE_CONFIG.maxCacheSize          // 最大缓存数量
```

### 6. UI 配置 (`UI_CONFIG`)

```typescript
UI_CONFIG.themePrimary         // 主题主色调
UI_CONFIG.themeAccent          // 主题强调色
UI_CONFIG.toastDuration        // Toast 通知默认时长（毫秒）
UI_CONFIG.scrollOffset         // 滚动偏移量（像素）
UI_CONFIG.scrollTopThreshold   // 回到顶部按钮显示阈值（像素）
```

### 7. 第三方服务 (`THIRD_PARTY_CONFIG`)

```typescript
THIRD_PARTY_CONFIG.artalkServer    // Artalk 服务器地址
THIRD_PARTY_CONFIG.artalkSite      // Artalk 站点名称
THIRD_PARTY_CONFIG.busuanziEnabled // 不蒜子统计
```

### 8. 性能配置 (`PERFORMANCE_CONFIG`)

```typescript
PERFORMANCE_CONFIG.statusCheckInterval  // 状态检查间隔（毫秒）
PERFORMANCE_CONFIG.statusCheckTimeout   // 状态检查超时（毫秒）
```

### 9. 开发配置 (`DEV_CONFIG`)

```typescript
DEV_CONFIG.port        // 开发服务器端口
DEV_CONFIG.hmr         // 热更新
DEV_CONFIG.sourcemap   // Source Map
DEV_CONFIG.isDev       // 是否开发环境
DEV_CONFIG.isProd      // 是否生产环境
DEV_CONFIG.mode        // 运行模式
```

## 实际使用示例

### 示例 1：在 Store 中使用

```typescript
// src/stores/cache.ts
import { CACHE_CONFIG } from '@/config'

export const useCacheStore = defineStore('cache', () => {
  const vndbCacheDuration = ref(CACHE_CONFIG.vndbCacheDuration)
  const searchCacheDuration = ref(CACHE_CONFIG.searchCacheDuration)
  const maxCacheSize = ref(CACHE_CONFIG.maxCacheSize)
  
  // ...
})
```

### 示例 2：在组件中使用

```vue
<script setup lang="ts">
import { FEATURE_FLAGS, UI_CONFIG } from '@/config'

// 功能开关
const enableComments = FEATURE_FLAGS.enableComments

// UI 配置
const toastDuration = UI_CONFIG.toastDuration
</script>
```

### 示例 3：在 API 调用中使用

```typescript
// src/api/search.ts
import { API_CONFIG } from '@/config'

export async function searchGame(query: string) {
  const response = await fetch(`${API_CONFIG.defaultApiUrl}/search`, {
    method: 'POST',
    body: JSON.stringify({ query }),
  })
  return response.json()
}
```

### 示例 4：条件渲染

```vue
<template>
  <button v-if="FEATURE_FLAGS.enableComments" @click="openComments">
    评论
  </button>
</template>

<script setup lang="ts">
import { FEATURE_FLAGS } from '@/config'
</script>
```

## 环境区分

Vite 支持多环境配置：

- `.env` - 所有环境加载
- `.env.local` - 所有环境加载，但会被 git 忽略
- `.env.development` - 开发环境
- `.env.production` - 生产环境

优先级：`.env.[mode].local` > `.env.[mode]` > `.env.local` > `.env`

## 注意事项

1. **环境变量必须以 `VITE_` 开头**才能在客户端代码中访问
2. **修改 .env 后需要重启开发服务器**
3. **不要在 .env 中存储敏感信息**（如密钥、密码）
4. **使用配置对象而不是直接访问环境变量**，获得更好的类型支持
5. **生产环境的配置**应该通过构建工具或部署平台设置

## 类型安全

所有配置都有完整的 TypeScript 类型支持：

```typescript
import type { AppConfig } from '@/config'

// 获取完整配置的类型
const config: AppConfig = CONFIG

// 自动补全和类型检查
config.api.defaultApiUrl // ✅ 类型安全
config.api.invalidKey    // ❌ 编译错误
```

## 调试

开发环境下，配置会自动打印到控制台：

```javascript
// 打开浏览器控制台查看
📦 Application Config: {
  api: {...},
  app: {...},
  features: {...},
  ...
}
```

可以通过 `VITE_ENABLE_DEV_LOGS=false` 关闭此功能。

