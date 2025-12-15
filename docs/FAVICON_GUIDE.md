# Favicon 生成指南

本项目使用 `gamepad-solid.svg` 作为网站图标。

## 当前图标文件

- `logo.svg` - 主图标（SVG 格式，带粉紫渐变）
- `gamepad-solid.svg` - 原始 Font Awesome 图标
- `favicon-32x32.png` - 32x32 PNG 图标（需要生成）
- `favicon-16x16.png` - 16x16 PNG 图标（需要生成）
- `apple-touch-icon.png` - 180x180 Apple 触摸图标（需要生成）

## 如何生成 PNG 图标

### 方法 1: 使用在线工具

1. 访问 [RealFaviconGenerator](https://realfavicongenerator.net/)
2. 上传 `logo.svg`
3. 自定义设置（建议使用粉紫渐变背景）
4. 生成并下载所有尺寸的图标
5. 将文件放到 `public/` 目录

### 方法 2: 使用 ImageMagick (命令行)

```bash
# 安装 ImageMagick
brew install imagemagick  # macOS
# 或
sudo apt-get install imagemagick  # Linux

# 生成 PNG 图标
convert -background none logo.svg -resize 32x32 favicon-32x32.png
convert -background none logo.svg -resize 16x16 favicon-16x16.png
convert -background none logo.svg -resize 180x180 apple-touch-icon.png
```

### 方法 3: 使用 Inkscape

```bash
# 安装 Inkscape
brew install inkscape  # macOS

# 生成 PNG 图标
inkscape logo.svg --export-filename=favicon-32x32.png --export-width=32 --export-height=32
inkscape logo.svg --export-filename=favicon-16x16.png --export-width=16 --export-height=16
inkscape logo.svg --export-filename=apple-touch-icon.png --export-width=180 --export-height=180
```

## 图标说明

- **SVG 格式**: 现代浏览器优先使用，支持自适应缩放
- **PNG 格式**: 作为后备选项，兼容旧浏览器
- **渐变色**: 粉色 (#ec4899) 到紫色 (#8b5cf6)
- **设计**: Font Awesome 游戏手柄图标

## 浏览器支持

- ✅ Chrome/Edge: 优先使用 SVG
- ✅ Firefox: 优先使用 SVG
- ✅ Safari: 优先使用 SVG
- ✅ iOS Safari: 使用 apple-touch-icon.png
- ✅ 旧浏览器: 降级到 PNG 格式

