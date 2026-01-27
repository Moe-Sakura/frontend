# Changelog

所有重要的变更都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2025-01-19

### ✨ 新增

#### 核心功能
- 🎮 **聚合搜索系统**
  - 支持游戏和补丁两种搜索模式
  - SSE 流式实时显示搜索进度
  - 多平台并行搜索，结果即时展示
  - 自定义 API 地址支持

- 🏷️ **智能标签系统**
  - 11 种资源特性标签（NoReq, Login, BTmag 等）
  - 每个标签独特的颜色和图标
  - 中文标签说明
  - 一眼识别资源特性

- 📚 **游戏信息展示**
  - 集成 VNDB 数据库
  - 显示游戏封面、截图、标题、别名
  - 游戏时长评估和分类
  - AI 自动翻译游戏简介为中文

- 🖼️ **随机背景系统**
  - IndexedDB 本地缓存（最多 9999 张）
  - 每秒从 API 获取新图片
  - 每 5 秒自动切换背景
  - Fisher-Yates 洗牌算法确保完整遍历
  - 预加载机制避免白屏闪烁
  - 三层缓存机制（Blob URL + 内存 + IndexedDB）

- 💬 **评论系统**
  - 基于 Artalk 的现代化评论系统
  - 支持 Markdown 语法
  - 表情包支持
  - 嵌套回复功能

#### UI/UX
- 📱 **响应式设计**
  - 完美适配桌面和移动设备
  - Tailwind CSS 实用优先的样式
  - 流畅的动画和过渡效果

- 🎨 **视觉优化**
  - Font Awesome 7 图标库
  - 粉色/紫色渐变主题
  - 毛玻璃效果（backdrop-blur）
  - 自定义滚动条样式

- ⚡ **性能优化**
  - Pace.js 页面加载进度条
  - Fancybox 图片和内容预览
  - 浏览器原生懒加载
  - Service Worker 离线缓存

#### 开发体验
- 🛠️ **技术栈**
  - Vue 3.5 + Composition API
  - TypeScript 5.9 类型安全
  - Vite 7 极速构建
  - Pinia 3 状态管理
  - Tailwind CSS 4.1 样式框架

- 📦 **工具链**
  - pnpm 包管理器
  - EditorConfig 编辑器配置
  - Prettier 代码格式化
  - TypeScript 严格模式

### 🔧 API 集成

- **Cloudflare Workers API**
  - 端点：`https://cf.api.searchgal.top`
  - POST `/gal` - 搜索游戏资源
  - POST `/patch` - 搜索补丁资源
  - SSE 流式响应

- **VNDB API**
  - 游戏数据库查询
  - 图片代理服务
  - 多语言标题支持

- **AI Translation API**
  - Qwen2.5-32B-Instruct 模型
  - 自动翻译游戏简介
  - 智能上下文理解

### 📝 文档

- 📖 完整的 README.md
  - 项目介绍和特性说明
  - 安装和开发指南
  - 项目结构说明
  - 部署指南

- 🤝 CONTRIBUTING.md
  - 贡献指南
  - 代码规范
  - Commit 规范
  - PR 检查清单

- 📄 CODE_OF_CONDUCT.md
  - 社区行为准则
  - 包容性和尊重

- 📋 CHANGELOG.md
  - 版本变更记录
  - 遵循 Keep a Changelog 格式

### 🎯 配置文件

- `.prettierrc` - Prettier 代码格式化配置
- `.editorconfig` - 编辑器统一配置
- `tsconfig.json` - TypeScript 编译配置
- `vite.config.ts` - Vite 构建配置

### 🌐 部署支持

- Vercel 部署支持
- Netlify 部署支持
- Cloudflare Pages 部署支持
- 自定义 Service Worker

### 🔒 安全性

- CORS 跨域请求处理
- XSS 防护
- HTTPS 强制
- Content Security Policy

### ♿ 可访问性

- 语义化 HTML
- ARIA 标签
- 键盘导航支持
- 屏幕阅读器友好

---

## 未来计划

### [1.1.0] - 计划中

- [ ] 搜索历史记录
- [ ] 收藏夹功能
- [ ] 高级搜索过滤
- [ ] 主题切换（暗色模式）
- [ ] 多语言支持（i18n）
- [ ] PWA 离线支持增强
- [ ] 搜索结果导出
- [ ] 批量下载管理

### [1.2.0] - 计划中

- [ ] 用户账号系统
- [ ] 个性化推荐
- [ ] 社区评分系统
- [ ] 游戏标签管理
- [ ] 高级统计分析
- [ ] API 速率限制显示

---

## 版本说明

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能性新增
- **修订号**：向下兼容的问题修正

[1.0.0]: https://github.com/Moe-Sakura/frontend/releases/tag/v1.0.0

