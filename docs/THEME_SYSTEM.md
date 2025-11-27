# 主题系统说明

## 概述

本项目采用简化的主题系统，**自动跟随操作系统主题设置**。

## 自动跟随系统

### 工作原理

应用会自动检测并应用操作系统的主题偏好：
- 🌞 系统为浅色模式 → 应用显示浅色主题
- 🌙 系统为深色模式 → 应用显示深色主题
- 🔄 系统主题变化 → 应用自动切换

### 实现原理

使用 Tailwind CSS 的 `dark:` 变体来定义暗色模式样式：

```css
/* 浅色模式样式 */
.bg-white { background: white; }

/* 深色模式样式 */
.dark .bg-white { background: rgb(15, 23, 42); }
```

当 `<html>` 元素添加 `dark` class 时，所有使用 `dark:` 前缀的样式会自动生效。

### 系统监听

使用 `prefers-color-scheme` 媒体查询监听系统主题变化：

```javascript
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', (e) => {
  applyTheme(e.matches ? 'dark' : 'light')
})
```

## 自定义样式

### 使用方法

用户可以在"设置"中添加自定义 CSS 代码来个性化界面：

```css
/* 自定义按钮样式 */
.my-custom-button {
  background: linear-gradient(to right, #ec4899, #8b5cf6);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
}

/* 深色模式下的样式 */
.dark .my-custom-button {
  background: linear-gradient(to right, #a855f7, #8b5cf6);
}
```

### 存储和应用

- 自定义 CSS 保存在 `localStorage` 中（key: `searchgal_custom_css`）
- 页面加载时自动应用到 `<style id="custom-user-styles">` 标签中
- 支持完整的 CSS 语法和 Tailwind 暗色模式变体

## 技术实现

### 核心文件

- `src/utils/theme.ts` - 主题管理工具
- `src/styles/base.css` - 基础样式和暗色模式定义
- `src/components/SettingsModal.vue` - 自定义CSS编辑器

### API

```typescript
// 获取系统主题
getSystemTheme(): 'light' | 'dark'

// 应用主题
applyTheme(theme: 'light' | 'dark'): void

// 监听系统主题变化
watchSystemTheme(callback): () => void

// 加载自定义CSS
loadCustomCSS(): string

// 应用自定义CSS
applyCustomCSS(css: string): void

// 保存自定义CSS
saveCustomCSS(css: string): void
```

## 背景图片

- 浅色模式：显示粉色纹理背景
- 深色模式：显示深色纹理背景，透明度允许背景图片显示
- 随机图片切换：每10秒自动切换一张随机动漫图片

## 如何更改系统主题

### macOS
1. 打开"系统设置"
2. 点击"外观"
3. 选择"浅色"、"深色"或"自动"

### Windows 11
1. 打开"设置"
2. 点击"个性化" → "颜色"
3. 选择"浅色"、"深色"或"自定义"

### Linux (GNOME)
1. 打开"设置"
2. 点击"外观"
3. 选择"浅色"或"深色"

## 最佳实践

1. 使用 Tailwind 的 `dark:` 变体定义暗色样式
2. 避免硬编码颜色，优先使用语义化的 Tailwind 类名
3. 自定义CSS应该同时定义浅色和深色两种样式
4. 测试两种模式下的显示效果，确保可读性

