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
| 语言 | TypeScript | 5.9 |
| 构建 | Vite | 7.2 |
| 状态管理 | Pinia | 3.0 |
| 样式 | Tailwind CSS | 4.1 |
| 动画 | motion-v | 1.7 |
| 图标 | lucide-vue-next | 0.561 |
| 音效 | snd-lib | 1.2 |
| 评论 | Artalk | 2.9 |
| 图片预览 | @fancyapps/ui | 6.1 |
| 代码编辑 | vue-prism-editor + prismjs | - |

## 项目结构

```
src/
├── api/              # API 请求
│   └── search.ts     # SSE 流式搜索、VNDB、AI 翻译
├── components/       # Vue 组件
│   ├── SearchHeader.vue      # 搜索框 + 模式切换
│   ├── SearchResults.vue     # 搜索结果列表
│   ├── VndbPanel.vue         # VNDB 游戏信息面板
│   ├── SettingsModal.vue     # 设置面板
│   ├── CommentsModal.vue     # Artalk 评论
│   ├── SearchHistoryModal.vue # 搜索历史
│   ├── FloatingButtons.vue   # 浮动按钮 + 站点导航
│   ├── TopToolbar.vue        # 顶部工具栏
│   ├── StatsCorner.vue       # 统计角标
│   ├── UpdateToast.vue       # SW 更新提示
│   └── LiquidGlass.vue       # 液态玻璃组件
├── composables/      # 组合式函数
│   ├── useSound.ts           # snd-lib 音效封装
│   ├── useKeyboardShortcuts.ts # 全局快捷键
│   ├── usePerformance.ts     # 性能工具
│   ├── useProgress.ts        # 进度条
│   ├── useScrollLock.ts      # 滚动锁定
│   ├── useDebounce.ts        # 防抖
│   └── useClickEffect.ts     # 点击涟漪效果
├── stores/           # Pinia 状态管理
│   ├── search.ts     # 搜索状态
│   ├── ui.ts         # UI 状态 (模态框、暗色模式)
│   ├── settings.ts   # 用户设置
│   ├── history.ts    # 搜索历史
│   └── cache.ts      # 缓存管理
├── styles/           # 全局样式
│   ├── base.css      # 基础样式 + 性能工具类
│   ├── glassmorphism.css # 液态玻璃效果
│   ├── theme.css     # 主题变量
│   └── nprogress.css # 进度条样式
├── utils/            # 工具函数
│   ├── imageDB.ts    # IndexedDB 图片缓存
│   ├── persistence.ts # LocalStorage 持久化
│   ├── theme.ts      # 主题管理
│   ├── icons.ts      # 图标集中管理
│   └── urlParams.ts  # URL 参数处理
├── config/           # 配置
│   ├── index.ts      # 统一配置入口
│   └── env.ts        # 环境变量
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
import { playTap, playButton, playToggle, playSwipe, playNotification, playCelebration, playCaution, playTransitionUp, playTransitionDown, playType, playSelect } from '@/composables/useSound'

// 点击普通按钮
playTap()

// 重要按钮/功能按钮
playButton()

// 开关切换
playToggle()

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

// 通知
playNotification()

// 输入文字 (需节流 80ms)
playType()

// 选择列表项
playSelect()
```

### 液态玻璃效果

```html
<!-- 使用 CSS 类 -->
<div class="liquid-glass">
  <div class="liquid-glass-effect"></div>
  <div class="liquid-glass-tint"></div>
  <div class="liquid-glass-content">
    <!-- 内容 -->
  </div>
</div>

<!-- 或使用伪元素方式 (推荐用于简单元素) -->
<button class="liquid-glass-btn">按钮</button>
```

### 动画

```vue
<script setup>
import { Motion, AnimatePresence } from 'motion-v'
</script>

<template>
  <!-- 淡入动画 -->
  <Motion
    :initial="{ opacity: 0, y: 20 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="{ duration: 0.3 }"
  >
    内容
  </Motion>

  <!-- 条件渲染动画 -->
  <AnimatePresence>
    <Motion
      v-if="visible"
      :initial="{ opacity: 0 }"
      :animate="{ opacity: 1 }"
      :exit="{ opacity: 0 }"
    >
      内容
    </Motion>
  </AnimatePresence>
</template>
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

编辑 `src/composables/useKeyboardShortcuts.ts`:

```typescript
case 'x':
  if (!hasModifier) {
    e.preventDefault()
    playButton()
    // 执行操作
  }
  break
```

## 环境变量

主要配置在 `.env` 文件:

```bash
# API 端点
VITE_API_BASE_URL=https://api.example.com

# VNDB
VITE_VNDB_API_URL=https://api.vndb.org/kana

# Artalk 评论
VITE_ARTALK_SERVER=https://artalk.example.com
VITE_ARTALK_SITE=SearchGal
```

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
| 音效 | `src/composables/useSound.ts` |
| 快捷键 | `src/composables/useKeyboardShortcuts.ts` |
| 液态玻璃 | `src/styles/glassmorphism.css` |
| 主题色 | `src/styles/theme.css` |
| 全局样式 | `src/styles/base.css` |
| Vite 配置 | `vite.config.ts` |
| 入口文件 | `index.html`, `src/main.ts` |
