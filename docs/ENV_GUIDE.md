# 环境变量配置指南

SearchGal Frontend 使用环境变量来管理各种配置项，实现开发和生产环境的分离。

## 文件说明

- `.env` - 所有环境的默认配置
- `.env.development` - 开发环境特定配置
- `.env.production` - 生产环境特定配置
- `.env.example` - 配置模板文件（供参考）

## 快速开始

1. 复制示例文件：
```bash
cp .env.example .env
```

2. 根据需要修改 `.env` 文件中的配置

3. 启动开发服务器：
```bash
pnpm dev
```

## 配置项说明

### 应用信息

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_APP_TITLE` | 应用标题 | SearchGal - Galgame 聚合搜索 |
| `VITE_APP_DESCRIPTION` | 应用描述 | 多平台 Galgame 资源聚合搜索引擎 |
| `VITE_APP_VERSION` | 应用版本 | 1.0.0 |

### API 配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 搜索 API 地址 | https://cfapi.searchgal.homes |
| `VITE_API_TIMEOUT` | API 超时时间（毫秒） | 30000 |
| `VITE_TRANSLATE_API_URL` | 翻译 API 地址 | https://translate.searchgal.homes |
| `VITE_VNDB_API_URL` | VNDB API 地址 | https://api.vndb.org/kana/v1 |

### 外部服务

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_STATUS_URL` | 状态检查 URL | https://status.searchgal.homes |
| `VITE_ARTALK_SERVER` | Artalk 评论服务器 | https://artalk.saop.cc |
| `VITE_IMAGE_API_URL` | 随机图片 API | https://api.illlights.com/v1/img |

### 网站信息

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_SITE_URL` | 网站 URL | https://searchgal.homes |
| `VITE_SITE_NAME` | 网站名称 | SearchGal |
| `VITE_GITHUB_URL` | GitHub 仓库 | https://github.com/Moe-Sakura/frontend |

### 功能开关

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_ENABLE_COMMENTS` | 启用评论功能 | true |
| `VITE_ENABLE_VNDB` | 启用 VNDB 集成 | true |
| `VITE_ENABLE_AI_TRANSLATE` | 启用 AI 翻译 | true |
| `VITE_ENABLE_PWA` | 启用 PWA 功能 | true |
| `VITE_ENABLE_ANALYTICS` | 启用统计分析 | false |

### 搜索配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_SEARCH_COOLDOWN` | 搜索冷却时间（毫秒） | 30000 |
| `VITE_DEFAULT_RESULTS_PER_PAGE` | 默认每页结果数 | 10 |
| `VITE_LOAD_MORE_COUNT` | 加载更多数量 | 20 |
| `VITE_MAX_SEARCH_HISTORY` | 最大历史记录数 | 50 |

### 缓存配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_CACHE_VNDB_DURATION` | VNDB 缓存时长（毫秒） | 1800000 (30分钟) |
| `VITE_CACHE_SEARCH_DURATION` | 搜索缓存时长（毫秒） | 600000 (10分钟) |
| `VITE_CACHE_IMAGE_DURATION` | 图片缓存时长（毫秒） | 3600000 (60分钟) |
| `VITE_MAX_CACHE_SIZE` | 最大缓存项数 | 100 |

### 主题配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_THEME_PRIMARY` | 主色调 | #ff1493 |
| `VITE_THEME_ACCENT` | 强调色 | #d946ef |
| `VITE_THEME_BACKGROUND_LIGHT` | 浅色背景 | #fff5fa |
| `VITE_THEME_BACKGROUND_DARK` | 深色背景 | #1e293b |

### 性能配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_QUICKLINK_DELAY` | Quicklink 延迟（毫秒） | 500 |
| `VITE_QUICKLINK_LIMIT` | Quicklink 限制数 | 10 |
| `VITE_LAZY_LOAD_THRESHOLD` | 懒加载阈值 | 0.5 |

### 开发配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `VITE_ENABLE_DEBUG` | 启用调试模式 | false |
| `VITE_ENABLE_MOCK` | 启用 Mock 数据 | false |

## 使用方法

### 1. 在代码中使用配置

```typescript
import { config } from '@/config'

// 使用 API 地址
const apiUrl = config.api.baseUrl

// 检查功能开关
if (config.features.comments) {
  // 启用评论功能
}

// 使用搜索配置
const cooldown = config.search.cooldown
```

### 2. 使用工具函数

```typescript
import { devLog, devWarn, devError, isDev, isProd } from '@/config'

// 开发环境日志（只在 VITE_ENABLE_DEBUG=true 时显示）
devLog('Debug message')
devWarn('Warning message')
devError('Error message')

// 环境判断
if (isDev) {
  console.log('Running in development mode')
}

if (isProd) {
  console.log('Running in production mode')
}
```

### 3. 直接访问环境变量

```typescript
// 不推荐：直接访问（无类型安全）
const apiUrl = import.meta.env.VITE_API_BASE_URL

// 推荐：通过 config 对象访问（有类型安全）
const apiUrl = config.api.baseUrl
```

## 环境变量优先级

Vite 环境变量加载优先级（从高到低）：

1. `.env.[mode].local` (如 `.env.development.local`)
2. `.env.[mode]` (如 `.env.development`)
3. `.env.local`
4. `.env`

**注意**：`.local` 文件会被 `.gitignore` 忽略，不会提交到仓库。

## 本地开发配置

如果需要本地特定配置，创建 `.env.local` 文件：

```bash
# .env.local (不会被提交到 Git)
VITE_API_BASE_URL=http://localhost:8787
VITE_ENABLE_DEBUG=true
```

## 生产环境配置

在 CI/CD 或服务器上设置环境变量，或使用 `.env.production` 文件。

## 注意事项

1. **只有 `VITE_` 前缀的变量会被暴露到客户端代码**
2. **不要在环境变量中存储敏感信息**（如密钥、密码）
3. **修改环境变量后需要重启开发服务器**
4. **`.env.local` 文件不会被提交到仓库**

## 故障排查

### 环境变量没有生效

1. 检查变量名是否以 `VITE_` 开头
2. 重启开发服务器 (`pnpm dev`)
3. 检查 `.env` 文件语法是否正确
4. 使用 `console.log(config)` 查看加载的配置

### 类型错误

确保 `src/vite-env.d.ts` 文件存在并包含正确的类型定义。

## 相关文件

- `src/config/index.ts` - 配置工具类
- `src/vite-env.d.ts` - TypeScript 类型定义
- `.env` - 默认配置文件
- `.env.example` - 配置模板

## 更多信息

- [Vite 环境变量文档](https://vitejs.dev/guide/env-and-mode.html)
- [SearchGal 项目文档](./README.md)

