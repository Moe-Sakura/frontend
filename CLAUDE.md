# SearchGal Frontend - AI 项目上下文

> 本文件帮助 AI 助手理解和管理此项目。请在每次对话开始时参考此文件。

## 项目概述

SearchGal 是一个 Galgame 聚合搜索前端，使用现代 Web 技术构建。

- **主题色**: 艳粉色 `#ff1493`
- **设计风格**: 液态玻璃拟态 (Liquid Glass / Glassmorphism)
- **目标用户**: Galgame 玩家

## 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue 3 (Composition API) | 3.5 |
| 语言 | TypeScript | 6.0 |
| 构建 | Vite | 8.1 |
| 状态管理 | Pinia | 4.0 |
| 样式 | Tailwind CSS | 4.3 |
| 图标 | @lucide/vue | 1.28 |
| 虚拟列表 | @tanstack/vue-virtual | 3.13 |
| 音效 | Web Audio API | - |
| 评论 | Artalk | 2.10 |
| 代码编辑 | vue-prism-editor + prismjs | - |

> 注意：Lucide 自 v1 起移除了全部品牌图标，GitHub 图标改由本地组件
> `src/components/GithubIcon.vue` 提供。

## 项目结构

```
src/
├── api/              # API 请求
│   ├── index.ts      # 统一导出
│   ├── config.ts     # API 配置获取
│   ├── search.ts     # SSE 流式搜索
│   ├── vndb.ts       # VNDB 数据库
│   └── translate.ts  # AI 翻译
├── components/       # Vue 组件
│   ├── SearchHeader.vue      # 搜索框 + 模式切换
│   ├── SearchResults.vue     # 搜索结果列表
│   ├── ResultFilterPanel.vue # 结果筛选栏 (渠道 / 获取方式)
│   ├── ResultItem.vue        # 单条搜索结果
│   ├── SearchErrorCard.vue   # 搜索错误卡片
│   ├── VndbPanel.vue         # VNDB 游戏信息面板
│   ├── SettingsModal.vue     # 设置面板
│   ├── AdvancedApiSettings.vue # 高级 API 设置
│   ├── CommentsModal.vue     # Artalk 评论
│   ├── SearchHistoryModal.vue # 搜索历史
│   ├── KeyboardHelpPanel.vue # 快捷键帮助
│   ├── FloatingButtons.vue   # 浮动按钮 + 站点导航
│   ├── TopToolbar.vue        # 顶部工具栏
│   ├── StatsCorner.vue       # 统计角标
│   ├── UpdateToast.vue       # SW 更新提示
│   ├── ImageViewer.vue       # 全屏图片预览
│   ├── AnimatedBackground.vue # 渐变切换的背景图
│   ├── LazyRender.vue        # 视口内才渲染的懒渲染容器
│   └── GithubIcon.vue        # GitHub 图标 (Lucide v1 已移除品牌图标)
├── composables/      # 组合式函数
│   ├── useSound.ts           # Web Audio API 音效
│   ├── useKeyboardShortcuts.ts # 全局快捷键
│   ├── usePerformance.ts     # 性能工具
│   ├── useProgress.ts        # 进度条 (样式运行时注入)
│   ├── useScrollLock.ts      # 滚动锁定
│   ├── useDebounce.ts        # 防抖
│   ├── useImageViewer.ts     # 图片预览状态
│   ├── useBackgroundImage.ts # 随机背景图
│   ├── useTextScroll.ts      # 文本溢出滚动
│   └── useVndbTranslation.ts # VNDB AI 翻译
├── stores/           # Pinia 状态管理
│   ├── index.ts      # 统一导出
│   ├── search.ts     # 搜索状态
│   ├── ui.ts         # UI 状态 (模态框、暗色模式)
│   ├── settings.ts   # 用户设置
│   ├── history.ts    # 搜索历史
│   ├── cache.ts      # 缓存管理
│   ├── stats.ts      # 站点统计
│   ├── lazyLoad.ts   # 懒加载状态
│   └── plugins.ts    # 自定义 Pinia 插件 (持久化/日志/性能/快照/跨标签同步)
├── styles/           # 全局样式
│   ├── base.css      # 基础样式 + 性能工具类
│   ├── glassmorphism.css # 液态玻璃效果
│   └── theme.css     # 主题变量
├── utils/            # 工具函数
│   ├── persistence.ts # LocalStorage 持久化
│   ├── theme.ts      # 明暗主题 + 自定义 CSS/JS/HTML
│   ├── themeColor.ts # 预设主题色 → CSS 变量
│   └── urlParams.ts  # URL 参数处理
├── directives/       # 自定义指令
│   └── vRipple.ts    # Material Design 涟漪点击效果
├── types/            # 类型声明
│   ├── vndb.ts       # VNDB 类型
│   ├── artalk.d.ts   # Artalk 补充声明
│   └── prismjs.d.ts  # Prism 补充声明
├── data/             # 静态数据
│   ├── api.json      # 搜索源列表
│   ├── friends.json  # 友链
│   └── repository-opengraph.json
├── config/           # 配置
│   ├── index.ts      # 统一配置入口
│   ├── env.ts        # 环境变量
│   ├── themePresets.ts # 预设主题色列表
│   └── resultTags.ts   # 结果标签 (渠道/方式) 文案·图标·配色
├── App.vue           # 根组件
└── main.ts           # 入口文件
```

## 代码规范

### Vue 组件

```vue
<script setup lang="ts">
// 1. 导入
import { ref, computed, watch, onMounted } from 'vue'
import { useSearchStore } from '@/stores/search'
import { playTap } from '@/composables/useSound'

// 2. Props & Emits
const props = defineProps<{ ... }>()
const emit = defineEmits<{ ... }>()

// 3. Stores
const searchStore = useSearchStore()

// 4. 响应式状态
const isLoading = ref(false)

// 5. 计算属性
const hasResults = computed(() => searchStore.results.length > 0)

// 6. 方法
function handleClick() {
  playTap()
  // ...
}

// 7. 生命周期
onMounted(() => { ... })
</script>

<template>
  <!-- 使用 Tailwind CSS 类 -->
</template>

<style scoped>
/* 组件特定样式 */
</style>
```

### 音效使用

```typescript
import { playTap, playButton, playToggleOn, playToggleOff, playSwipe, playNotification, playCelebration, playCaution, playDisabled, playTransitionUp, playTransitionDown, playType, playSelect } from '@/composables/useSound'

// 点击普通按钮
playTap()

// 重要按钮/功能按钮
playButton()

// 开关切换 (分开/关两个音)
playToggleOn()
playToggleOff()

// 滑动/刷新操作
playSwipe()

// 面板打开
playTransitionUp()

// 面板关闭
playTransitionDown()

// 成功操作
playCelebration()

// 警告/错误
playCaution()

// 禁用态点击
playDisabled()

// 通知
playNotification()

// 输入文字 (需节流 80ms)
playType()

// 选择列表项
playSelect()
```

另有循环音 `playProgressLoop()` / `playRingtoneLoop()`。

> 以上即全部可用音效。旧命名别名（`playClick`、`playSuccess`、`playError`、
> `playToggle` 等 19 个）连同 `LegacySoundType` / `playLegacySound` 已删除，
> 不要再引用。

### 液态玻璃效果

样式定义在 `src/styles/glassmorphism.css`，直接加单个类即可，无需嵌套结构：

```html
<div class="glassmorphism-card">卡片</div>
<input class="glassmorphism-input" />
<nav class="glassmorphism-navbar">导航栏</nav>
```

可用类只有三个：`glassmorphism-card`、`glassmorphism-input`、
`glassmorphism-navbar`（均自带亮/暗两套样式，无需额外加 `dark:`）。

> 早期还定义过 `glass`、`glass-gpu`、`glassmorphism-button/modal/panel/fab/
> overlay/toolbar-button/search-button/mode-switch` 等 10 个类，因长期无引用已删除。
> 新增玻璃拟态元素时，优先复用上面三个类或直接用 Tailwind 组合。

### 主题色

主题色变量集中定义在 `src/styles/theme.css`，**全部是 RGB 三元组**
（`255, 20, 147`）而不是十六进制：

```css
color: rgb(var(--color-primary));              /* 实色 */
border-color: rgba(var(--color-primary), .15); /* 带透明度 */
```

写成 `#ff1493` 会让 `rgba()` 语法非法、整条声明被丢弃，务必保持三元组。
Tailwind 侧在 `App.vue` 的 `@theme inline` 里接了同一批变量，因此
`text-theme-primary`、`bg-theme-accent/10`、`shadow-theme-primary/30`
这类工具类同样会跟随主题色变化。可用色阶：

`theme-primary` / `-light` / `-lighter` / `-pale` / `-dark` / `-darker`、
`theme-accent` / `-light` / `-dark`。

新增主题色请改 `src/config/themePresets.ts`（只需给主色与辅助色，其余色阶由
`utils/themeColor.ts` 按 HSL 明度推导），切换入口在设置面板的「外观」卡片。

> 注意：根目录 `tailwind.config.js` 是 Tailwind v3 时代的遗留文件，v4 未经
> `@config` 引入，**不会生效**；颜色以 `App.vue` 的 `@theme inline` 为准。

组件里写死颜色前先想想：这个颜色应该跟随主题色吗？跟随就用变量；
像结果标签（自建盘=粉、直接下载=绿）那种彼此需要区分的语义色才写死。

### 动画

项目**不使用动画库**，统一用 Vue 内置 `<Transition>` / `<TransitionGroup>`
搭配 Tailwind 过渡类实现；复杂的循环动画写在组件的 `<style scoped>` 里用
`@keyframes`。

```vue
<template>
  <!-- 进出场动画：把 Tailwind 类挂到 Transition 的各个钩子上 -->
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4 scale-95"
    enter-to-class="opacity-100 translate-y-0 scale-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0 scale-100"
    leave-to-class="opacity-0 translate-y-4 scale-95"
  >
    <div v-if="visible">内容</div>
  </Transition>
</template>

<style scoped>
/* 持续动画用 keyframes */
@keyframes pulse-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
```

## 常用操作

### 添加新组件

1. 在 `src/components/` 创建 `.vue` 文件
2. 使用 `<script setup lang="ts">` 语法
3. 导入必要的音效函数
4. 使用 Tailwind CSS + 液态玻璃样式

### 添加新 Store

```typescript
// src/stores/example.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useExampleStore = defineStore('example', () => {
  // 状态
  const items = ref<string[]>([])
  
  // 计算属性
  const count = computed(() => items.value.length)
  
  // 方法
  function addItem(item: string) {
    items.value.push(item)
  }
  
  return { items, count, addItem }
})
```

### 添加模态框

1. 在 `src/stores/ui.ts` 添加状态
2. 创建组件，使用 `<Teleport to="body">`
3. 使用 `playTransitionUp()` / `playTransitionDown()` 音效
4. 移动端全屏显示 (`@media (max-width: 768px)`)

### 添加快捷键

编辑 `src/composables/useKeyboardShortcuts.ts` 的 `switch (key)` 块。
该函数已在前面统一处理了 Escape、输入框聚焦、以及带 Ctrl/Meta 的组合键，
因此 `case` 里只需要写按键本身的逻辑：

```typescript
case 'x':
  event.preventDefault()
  playButton()
  togglePanel('settings')   // 或其它操作
  break
```

有前置条件的按键在 `case` 内部自行判断，例如 `case 'v'` 需要
`searchStore.vndbInfo` 存在时才响应。

## 环境变量

**完整变量清单以 `.env.example` 为准**（约 60 个 `VITE_*` 键），读取与默认值
集中在 `src/config/env.ts`，业务代码请从 `src/config/index.ts` 导入 `config`
取值，不要在组件里直接读 `import.meta.env.VITE_*`
（`isDev` / `isProd` 同样由该文件导出）。

变量按用途分组：

| 分组 | 示例键 |
|------|--------|
| 应用信息 | `VITE_APP_TITLE`、`VITE_APP_VERSION` |
| API 配置 | `VITE_API_BASE_URL`、`VITE_API_TIMEOUT`、`VITE_VNDB_API_URL`、`VITE_TRANSLATE_API_URL` |
| 外部服务 | `VITE_ARTALK_SERVER`、`VITE_STATUS_URL`、`VITE_IMAGE_API_URL` |
| 功能开关 | `VITE_ENABLE_COMMENTS`、`VITE_ENABLE_VNDB`、`VITE_ENABLE_AI_TRANSLATE`、`VITE_ENABLE_PWA` |
| 搜索配置 | `VITE_SEARCH_COOLDOWN`、`VITE_LOAD_MORE_COUNT`、`VITE_MAX_SEARCH_HISTORY` |
| 缓存配置 | `VITE_CACHE_VNDB_DURATION`、`VITE_CACHE_SEARCH_DURATION`、`VITE_MAX_CACHE_SIZE` |
| 主题配置 | `VITE_THEME_PRIMARY`、`VITE_THEME_ACCENT` |

环境文件：`.env`（本地）、`.env.development`、`.env.production`、
`.env.example`（模板，新增变量时请同步）。

## 注意事项

1. **不要使用 `position: fixed` 在有 `transform` 的父元素内** - 使用 `<Teleport to="body">`
2. **打字音效需要节流** - 使用 80ms 间隔
3. **模态框滚动锁定** - 使用 `useScrollLock()` composable
4. **图片懒加载** - 使用原生 `loading="lazy"` 属性
5. **暗色模式** - 使用 `dark:` Tailwind 前缀
6. **移动端适配** - 使用 `md:` 断点 (768px)

## 常见问题

### Q: 模态框位置异常？
A: 检查父元素是否有 `transform`，改用 `<Teleport to="body">`

### Q: 动画不流畅？
A: 使用 CSS `will-change` 或 `transform: translate3d(0,0,0)` 启用 GPU 加速

### Q: 音效不播放？
A: 确保导入了正确的音效函数，检查浏览器是否允许自动播放

### Q: 样式被覆盖？
A: 使用 `!important` 或增加选择器特异性，检查 CSS 加载顺序

## 文件快速参考

| 需求 | 文件 |
|------|------|
| 搜索逻辑 | `src/stores/search.ts`, `src/api/search.ts` |
| UI 状态 | `src/stores/ui.ts` |
| Pinia 插件 (持久化等) | `src/stores/plugins.ts` |
| 音效 | `src/composables/useSound.ts` |
| 快捷键 | `src/composables/useKeyboardShortcuts.ts` |
| 环境变量 / 配置 | `src/config/env.ts`, `src/config/index.ts`, `.env.example` |
| 搜索源列表 | `src/data/api.json` |
| 液态玻璃 | `src/styles/glassmorphism.css` |
| 主题色变量 | `src/styles/theme.css`, `src/App.vue` 的 `@theme inline` |
| 预设主题色 | `src/config/themePresets.ts`, `src/utils/themeColor.ts` |
| 结果标签 / 筛选 | `src/config/resultTags.ts`, `src/components/ResultFilterPanel.vue` |
| 全局样式 | `src/styles/base.css` |
| 自定义指令 | `src/directives/vRipple.ts` |
| Vite 配置 / 分包 | `vite.config.ts` |
| 入口文件 | `index.html`, `src/main.ts` |
