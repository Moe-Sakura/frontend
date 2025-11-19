# 响应式设计指南

本项目采用移动优先（Mobile-First）的响应式设计策略，使用 Tailwind CSS 的断点系统确保在所有设备上都有出色的用户体验。

## 📱 断点系统

### Tailwind CSS 断点

| 断点 | 最小宽度 | 设备类型 | 说明 |
|------|---------|---------|------|
| `默认` | 0px | 移动设备（竖屏） | 320px - 639px |
| `sm:` | 640px | 移动设备（横屏）/ 小平板 | 640px - 767px |
| `md:` | 768px | 平板设备 | 768px - 1023px |
| `lg:` | 1024px | 笔记本电脑 | 1024px - 1279px |
| `xl:` | 1280px | 桌面显示器 | 1280px - 1535px |
| `2xl:` | 1536px | 大屏显示器 | 1536px+ |

### 常见设备尺寸参考

#### 移动设备
- iPhone SE: 375 x 667
- iPhone 12/13/14: 390 x 844
- iPhone 14 Pro Max: 430 x 932
- Samsung Galaxy S21: 360 x 800
- Google Pixel 5: 393 x 851

#### 平板设备
- iPad Mini: 768 x 1024
- iPad Air: 820 x 1180
- iPad Pro 11": 834 x 1194
- iPad Pro 12.9": 1024 x 1366

#### 桌面设备
- 笔记本: 1366 x 768, 1440 x 900, 1920 x 1080
- 显示器: 1920 x 1080, 2560 x 1440, 3840 x 2160

## 🎨 响应式设计原则

### 1. 移动优先（Mobile-First）

从最小屏幕开始设计，逐步增强到大屏幕：

```vue
<!-- ❌ 错误：桌面优先 -->
<div class="text-2xl sm:text-xl md:text-base">

<!-- ✅ 正确：移动优先 -->
<div class="text-base sm:text-xl md:text-2xl">
```

### 2. 渐进增强（Progressive Enhancement）

基础功能在所有设备上可用，高级功能在大屏幕上增强：

```vue
<!-- 基础布局 + 渐进增强 -->
<div class="p-3 sm:p-4 md:p-6 lg:p-8">
  <h1 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
```

### 3. 触摸友好（Touch-Friendly）

移动设备上的点击目标至少 44x44 像素：

```vue
<!-- 按钮尺寸 -->
<button class="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14">

<!-- 间距 -->
<div class="gap-2 sm:gap-3 md:gap-4">
```

### 4. 内容优先（Content-First）

移动端隐藏次要内容，桌面端显示完整内容：

```vue
<!-- 条件显示 -->
<div class="hidden md:block">桌面端额外内容</div>
<div class="block md:hidden">移动端简化内容</div>
```

## 📐 组件响应式设计

### SearchHeader 组件

```vue
<!-- 容器 -->
<div class="container mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">

<!-- 标题 -->
<h1 class="text-3xl sm:text-4xl lg:text-5xl font-bold">

<!-- 输入框 -->
<input class="pl-10 sm:pl-12 pr-4 py-3 sm:py-4 text-sm sm:text-base">

<!-- 按钮 -->
<button class="py-3 sm:py-4 text-base sm:text-lg">
```

**设计要点：**
- 移动端：紧凑布局，减小间距
- 平板端：适中尺寸，平衡空间
- 桌面端：宽松布局，增大字号

### SearchResults 组件

```vue
<!-- 容器 -->
<div class="px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">

<!-- 卡片 -->
<div class="p-3 sm:p-4 md:p-6">

<!-- 标题 -->
<h3 class="text-lg sm:text-xl font-bold">

<!-- 列表项 -->
<div class="p-2 sm:p-3">
```

**设计要点：**
- 移动端：单列布局，全宽卡片
- 平板端：适当间距，优化阅读
- 桌面端：最大宽度限制，居中对齐

### VndbPanel 组件

```vue
<!-- 面板定位 -->
<div class="
  fixed 
  inset-x-2 bottom-20           /* 移动端：左右留白，底部固定 */
  sm:inset-x-auto sm:bottom-24  /* 小屏：自动宽度 */
  sm:right-6 sm:w-96            /* 小屏：右侧固定，固定宽度 */
  md:w-[28rem]                  /* 中屏：更宽 */
  lg:w-[32rem]                  /* 大屏：最宽 */
">

<!-- 内容区域 -->
<div class="p-3 sm:p-4 md:p-6">

<!-- 信息卡片 -->
<div class="grid grid-cols-1 gap-3">
```

**设计要点：**
- 移动端：全屏宽度，底部弹出
- 平板端：侧边栏模式，固定宽度
- 桌面端：更宽侧边栏，更多信息

### FloatingButtons 组件

```vue
<!-- 按钮容器 -->
<div class="
  fixed 
  bottom-4 sm:bottom-6          /* 底部间距 */
  right-4 sm:right-6            /* 右侧间距 */
  gap-2 sm:gap-3                /* 按钮间距 */
">
```

**CSS 断点：**
```css
.fab-button {
  width: 44px;   /* 移动端 */
  height: 44px;
  font-size: 18px;
}

@media (min-width: 640px) {
  .fab-button {
    width: 52px;   /* 平板端 */
    height: 52px;
    font-size: 22px;
  }
}

@media (min-width: 1024px) {
  .fab-button {
    width: 56px;   /* 桌面端 */
    height: 56px;
    font-size: 24px;
  }
}
```

### PlatformNav 组件

```vue
<!-- 导航容器 -->
<div class="
  hidden md:block              /* 移动端隐藏 */
  fixed 
  left-2 lg:left-4             /* 左侧间距 */
  top-1/2 -translate-y-1/2     /* 垂直居中 */
">

<!-- 按钮 -->
<button class="
  p-3 lg:p-4                   /* 内边距 */
  text-lg lg:text-xl           /* 字号 */
">
```

**设计要点：**
- 移动端：完全隐藏（节省空间）
- 平板端：显示导航，紧凑样式
- 桌面端：完整导航，宽松样式

## 🔧 常用响应式模式

### 1. 间距系统

```vue
<!-- 内边距 -->
<div class="p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8">

<!-- 外边距 -->
<div class="m-2 sm:m-3 md:m-4 lg:m-6 xl:m-8">

<!-- 间隙 -->
<div class="gap-2 sm:gap-3 md:gap-4 lg:gap-6">
```

### 2. 字体大小

```vue
<!-- 标题 -->
<h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">
<h2 class="text-xl sm:text-2xl md:text-3xl lg:text-4xl">
<h3 class="text-lg sm:text-xl md:text-2xl lg:text-3xl">

<!-- 正文 -->
<p class="text-sm sm:text-base md:text-lg">

<!-- 小字 -->
<span class="text-xs sm:text-sm">
```

### 3. 布局切换

```vue
<!-- 垂直 → 水平 -->
<div class="flex flex-col sm:flex-row">

<!-- 单列 → 多列 -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">

<!-- 隐藏 → 显示 -->
<div class="hidden sm:block">
<div class="block sm:hidden">
```

### 4. 宽度控制

```vue
<!-- 全宽 → 固定宽 -->
<div class="w-full sm:w-96 md:w-[28rem] lg:w-[32rem]">

<!-- 最大宽度 -->
<div class="max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl xl:max-w-7xl">

<!-- 计算宽度 -->
<div class="w-[calc(100vw-1rem)] sm:w-96">
```

### 5. 圆角和阴影

```vue
<!-- 圆角 -->
<div class="rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl">

<!-- 阴影 -->
<div class="shadow-md sm:shadow-lg md:shadow-xl lg:shadow-2xl">
```

## 📊 性能优化

### 1. 图片响应式

```vue
<!-- 响应式图片 -->
<img 
  src="image.jpg"
  srcset="image-320w.jpg 320w,
          image-640w.jpg 640w,
          image-1024w.jpg 1024w"
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 50vw,
         33vw"
  loading="lazy"
  alt="描述"
>
```

### 2. 条件加载

```vue
<script setup>
import { computed } from 'vue'

// 根据屏幕尺寸加载不同内容
const isMobile = computed(() => window.innerWidth < 640)
const isTablet = computed(() => window.innerWidth >= 640 && window.innerWidth < 1024)
const isDesktop = computed(() => window.innerWidth >= 1024)
</script>

<template>
  <MobileComponent v-if="isMobile" />
  <TabletComponent v-else-if="isTablet" />
  <DesktopComponent v-else />
</template>
```

### 3. 媒体查询

```css
/* 移动端优先 */
.component {
  /* 基础样式 */
}

@media (min-width: 640px) {
  .component {
    /* 平板样式 */
  }
}

@media (min-width: 1024px) {
  .component {
    /* 桌面样式 */
  }
}
```

## ✅ 测试检查清单

### 移动设备测试
- [ ] iPhone SE (375px)
- [ ] iPhone 12/13/14 (390px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] Android 小屏 (360px)
- [ ] Android 大屏 (412px)

### 平板设备测试
- [ ] iPad Mini (768px)
- [ ] iPad Air (820px)
- [ ] iPad Pro 11" (834px)
- [ ] iPad Pro 12.9" (1024px)

### 桌面设备测试
- [ ] 笔记本 (1366px, 1440px)
- [ ] 显示器 (1920px)
- [ ] 2K 显示器 (2560px)
- [ ] 4K 显示器 (3840px)

### 功能测试
- [ ] 导航菜单在所有设备上可用
- [ ] 表单输入在移动端易于操作
- [ ] 按钮大小符合触摸标准（44x44px+）
- [ ] 文字大小在所有设备上可读
- [ ] 图片在所有设备上正确显示
- [ ] 布局在横屏和竖屏都正常
- [ ] 滚动流畅，无性能问题
- [ ] 浮动元素不遮挡重要内容

## 🎯 最佳实践

### 1. 使用相对单位
```css
/* ✅ 推荐 */
font-size: 1rem;
padding: 1em;
width: 100%;
max-width: 48rem;

/* ❌ 避免 */
font-size: 16px;
padding: 16px;
width: 768px;
```

### 2. 触摸目标尺寸
```vue
<!-- 最小 44x44 像素 -->
<button class="min-w-[44px] min-h-[44px]">
```

### 3. 文字可读性
```vue
<!-- 行高 -->
<p class="leading-relaxed sm:leading-loose">

<!-- 字间距 -->
<p class="tracking-normal sm:tracking-wide">

<!-- 最大宽度（提高可读性） -->
<p class="max-w-prose">
```

### 4. 避免固定定位冲突
```vue
<!-- 确保浮动元素不重叠 -->
<div class="fixed bottom-20 sm:bottom-24">  <!-- 避开底部按钮 -->
<div class="fixed bottom-4 sm:bottom-6">    <!-- 底部按钮 -->
```

### 5. 使用语义化 HTML
```vue
<!-- ✅ 语义化 -->
<nav>
<main>
<article>
<section>

<!-- ❌ 过度使用 div -->
<div class="nav">
<div class="main">
```

## 📚 参考资源

- [Tailwind CSS 响应式设计](https://tailwindcss.com/docs/responsive-design)
- [MDN 响应式设计](https://developer.mozilla.org/zh-CN/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Google Web Fundamentals](https://developers.google.com/web/fundamentals/design-and-ux/responsive)
- [Material Design 响应式布局](https://m3.material.io/foundations/layout/applying-layout/window-size-classes)

---

最后更新：2025-01-19

