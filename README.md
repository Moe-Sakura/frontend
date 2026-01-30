# SearchGal Frontend

> Galgame 聚合搜索前端 - 基于 Vue 3 + TypeScript + Tailwind CSS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-brightgreen.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8.svg)](https://tailwindcss.com/)

🌐 **在线访问**: [searchgal.top](https://www.searchgal.top)

## ✨ 特性

- 🎮 **聚合搜索** - 整合多个 Galgame 资源站点的搜索结果
- 🚀 **流式响应** - SSE 实时流式显示搜索进度和结果
- 🏷️ **智能标签** - 自动标注资源特性（直接下载、需登录、BT/磁力等）
- 📚 **游戏信息** - 集成 VNDB 数据库，显示游戏详情和截图
- 🤖 **AI 翻译** - 自动翻译游戏简介为中文
- 💬 **评论系统** - 基于 Artalk 的评论功能
- 🖼️ **随机背景** - IndexedDB 缓存的随机背景图片系统
- 📱 **响应式设计** - 完美适配桌面和移动设备
- ⚡ **性能优化** - NProgress 进度条、Fancybox 图片预览
- 📲 **PWA 支持** - 可安装为桌面/移动应用，支持离线访问

## 🛠️ 技术栈

### 核心框架
- **Vue 3.5** - 渐进式 JavaScript 框架
- **TypeScript 5.9** - 类型安全的 JavaScript 超集
- **Vite 7** - 下一代前端构建工具
- **Pinia 3** - Vue 状态管理库

### UI 框架
- **Tailwind CSS 4.1** - 实用优先的 CSS 框架
- **Lucide Icons** - 现代化 SVG 图标库

### 功能库
- **Artalk 2.9** - 评论系统
- **Fancybox 6** - 图片和内容预览
- **NProgress** - 页面加载进度条

### API 集成
- **Cloudflare Workers API** - 搜索聚合后端
- **VNDB API** - 游戏数据库
- **AI Translation API** - 智能翻译服务

## 📦 安装

### 前置要求
- Node.js 18+
- pnpm 8+ (推荐) 或 npm

### 克隆项目
```bash
git clone https://github.com/Moe-Sakura/frontend.git
cd frontend
```

### 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 根据需要修改 .env 文件中的配置
# 详见 docs/ENV_GUIDE.md
```

### 安装依赖
```bash
pnpm install
```

## 🚀 开发

### 启动开发服务器
```bash
pnpm dev
```

### 构建生产版本
```bash
pnpm build
```

### 预览生产构建
```bash
pnpm preview
```

## 📁 项目结构

```
frontend/
├── public/              # 静态资源
│   ├── favicon-*.png   # 网站图标
│   └── sw.js           # Service Worker
├── src/
│   ├── api/            # API 接口
│   │   └── search.ts   # 搜索和 VNDB API
│   ├── components/     # Vue 组件
│   │   ├── SearchHeader.vue      # 搜索头部
│   │   ├── SearchResults.vue     # 搜索结果
│   │   ├── PlatformNav.vue       # 平台导航
│   │   ├── FloatingButtons.vue   # 浮动按钮
│   │   ├── CommentsModal.vue     # 评论弹窗
│   │   └── VndbPanel.vue         # 游戏信息面板
│   ├── stores/         # Pinia 状态管理
│   │   └── search.ts   # 搜索状态
│   ├── utils/          # 工具函数
│   │   └── imageDB.ts  # IndexedDB 图片缓存
│   ├── types/          # TypeScript 类型定义
│   │   ├── pace-js.d.ts
│   │   └── artalk.d.ts
│   ├── App.vue         # 根组件
│   └── main.ts         # 入口文件
├── index.html          # HTML 模板
├── vite.config.ts      # Vite 配置
├── package.json        # 项目配置
└── tsconfig.json       # TypeScript 配置
```

## 🎯 核心功能

### 1. 聚合搜索
- 支持游戏和补丁两种搜索模式
- SSE 流式实时显示搜索进度
- 多平台并行搜索，结果即时展示

### 2. 智能标签系统
根据 [Cloudflare Workers API](https://github.com/Moe-Sakura/SearchGal) 规范，自动标注资源特性：

| 标签 | 含义 | 说明 |
|------|------|------|
| 🟢 直接下载 | NoReq | 无需登录/回复即可下载 |
| 🔵 需登录 | Login | 需要账号登录 |
| 🟡 需付费 | LoginPay | 需登录且支付积分 |
| 🟣 登录+回复 | LoginRep | 需登录并回复/评论 |
| 🔷 需回复 | Rep | 需回复但无需登录 |
| 🎀 自建盘 | SuDrive | 自建网盘盘源 |
| ⚡ 不限速 | NoSplDrive | 不限速网盘（Onedrive/Mega） |
| 🟠 限速盘 | SplDrive | 限速网盘（百度/夸克/天翼） |
| 🔵 混合盘 | MixDrive | 混合网盘盘源 |
| 🟣 BT/磁力 | BTmag | BT 或磁力链接 |
| 🔴 需代理 | magic | 需要代理访问 |

### 3. 游戏信息展示
- 集成 VNDB 数据库
- 显示游戏封面、截图、标题、别名
- 游戏时长评估
- AI 自动翻译简介

### 4. 随机背景系统
- 每秒从 API 获取新图片
- 每 5 秒自动切换背景
- IndexedDB 本地缓存（最多 9999 张）
- Fisher-Yates 洗牌算法确保完整遍历
- 预加载机制避免白屏闪烁

### 5. 评论系统
- 基于 Artalk 的现代化评论系统
- 支持 Markdown 语法
- 表情包支持
- 嵌套回复

## 🔧 配置

### API 端点配置

默认使用 Cloudflare Workers API：
```typescript
// src/api/search.ts
const apiUrl = 'https://cf.api.searchgal.top'
```

支持自定义 API 地址，在搜索页面输入框中填写即可。

### 本地开发 API
如果使用本地 API 进行开发：
```bash
# 在 SearchGal 项目中
npx wrangler dev --local
```

然后在前端使用：`http://127.0.0.1:8787`

## 🌐 部署

### Vercel
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

### Netlify
```bash
# 安装 Netlify CLI
npm i -g netlify-cli

# 部署
netlify deploy --prod
```

### Cloudflare Pages
```bash
# 构建
pnpm run build

# 上传 dist 目录到 Cloudflare Pages
```

## 📝 环境变量

项目不需要环境变量配置，所有 API 端点都在代码中硬编码或支持用户自定义。

## 🤖 LLM 友好

本项目遵循 [llms.txt](https://llmstxt.org/) 规范，为 AI 助手和大语言模型提供了结构化的项目文档。

- 📄 访问 `/llms.txt` 获取项目的 LLM 友好文档
- 🔗 在线地址: [searchgal.top/llms.txt](https://www.searchgal.top/llms.txt)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范
- 使用 TypeScript 编写代码
- 遵循 Vue 3 Composition API 风格
- 使用 Tailwind CSS 进行样式编写
- 保持代码简洁和可读性

## 📝 环境变量

项目使用环境变量进行配置管理，所有配置项都可以通过 `.env` 文件进行自定义。

### 快速配置

```bash
# 复制模板文件
cp .env.example .env

# 编辑配置（可选）
vim .env
```

### 主要配置项

- **API 地址**：`VITE_API_BASE_URL`
- **功能开关**：`VITE_ENABLE_COMMENTS`、`VITE_ENABLE_VNDB` 等
- **主题颜色**：`VITE_THEME_PRIMARY`、`VITE_THEME_ACCENT`
- **性能配置**：缓存时长、搜索冷却时间等

详细配置说明请查看：
- 📘 [环境变量配置指南](./docs/ENV_GUIDE.md)
- 📘 [环境变量使用示例](./docs/ENV_USAGE_EXAMPLES.md)

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 🙏 致谢

- [Asuna](https://saop.cc/) - 提供服务器和技术支持
- [VNDB](https://vndb.org/) - 游戏数据库
- [Artalk](https://artalk.js.org/) - 评论系统
- 所有 Galgame 资源站点

## 📮 联系方式

- GitHub: [@Moe-Sakura](https://github.com/Moe-Sakura)
- 项目主页: [searchgal.top](https://www.searchgal.top)

---

⭐ 如果这个项目对你有帮助，请给个 Star！
