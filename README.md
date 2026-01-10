# Toolbox Web

一个基于 Next.js 构建的在线工具箱，包含媒体处理（图片/音频/视频）与部分娱乐小工具，支持多语言（`next-intl`）与 PWA（`serwist`）。

## 开发环境

### 环境要求
- Node.js 20+（建议）
- pnpm

### 快速开始
```bash
# 安装依赖
pnpm install

# 开发环境运行
pnpm dev

# 构建
pnpm build

# 生产环境运行
pnpm start
```

## 功能特性

### 媒体工具
- 图片处理（转换/压缩/裁剪/EXIF 读取等）
- 图片编辑（基于 `react-filerobot-image-editor`）
- 批量图片处理
- 音频提取、格式转换、倍速调整
- 视频转 GIF

### 其他
- 摸鱼办 / FishingTime（部分中文内容）

## 技术栈

- Next.js（App Router）
- React + TypeScript
- Tailwind CSS
- Zustand
