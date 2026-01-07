# next-intl 类型安全配置说明

## 📝 配置概述

项目已配置 TypeScript 类型声明，现在你可以享受完整的类型安全和自动完成功能。

## 🎯 配置文件

### 1. `src/i18n/global.d.ts`
```typescript
import en from './en.json';

type Messages = typeof en;

declare global {
  interface IntlMessages extends Messages {}
}
```

这个文件定义了全局的翻译消息类型，基于 `en.json` 作为类型源。

### 2. `tsconfig.json`
已更新 `include` 配置以包含类型声明文件。

## ✨ 使用方式

### 基础用法（带自动完成）

```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('common');
  
  // ✅ 自动完成会显示所有可用的 key
  return <div>{t('loading')}</div>;
  
  // ❌ TypeScript 会提示错误
  // return <div>{t('invalid-key')}</div>;
}
```

### 推荐：使用命名空间

```tsx
// ✅ 推荐 - 获得更精确的自动完成
const t = useTranslations('mediaProcessor.videoToGif');
t('title')  // 只显示 videoToGif 下的 key

// ⚠️ 不推荐 - 需要输入完整路径
const t = useTranslations();
t('mediaProcessor.videoToGif.title')
```

### 带参数的翻译

```tsx
const t = useTranslations('common.progress');

// TypeScript 会检查参数是否正确
t('remainingSeconds', { seconds: 30 })  // ✅
t('remainingSeconds', { minutes: 30 })  // ❌ 参数名错误
```

### 服务端组件

```tsx
import { getTranslations } from 'next-intl/server';

export default async function ServerPage() {
  const t = await getTranslations('home');
  return <h1>{t('title')}</h1>;
}
```

### 带类型的 Metadata

```tsx
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ namespace: 'home' });
  
  return {
    title: t('title'),
    description: t('description')
  };
}
```

## 🔍 IDE 支持

### VS Code
- 安装 **TypeScript and JavaScript Language Features**（内置）
- 重启 TypeScript 服务器：`Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### 验证配置
在组件中输入 `t('` 后应该看到：
- 所有可用的翻译 key
- 嵌套对象的路径提示
- 参数类型提示

## 🎨 自动完成示例

当你输入：
```tsx
const t = useTranslations('common');
t('
```

IDE 会显示：
- `loading`
- `error`
- `success`
- `unknown`
- `save`
- `cancel`
- `errors.ffmpegNotReady`
- `errors.analysisFailed`
- `progress.initializing`
- ...等等

## 🛠️ 维护指南

### 添加新翻译

1. 在 `src/i18n/en.json` 中添加新 key（这是类型源）
2. 在其他语言文件中添加相同的 key
3. TypeScript 会自动识别新的 key
4. 如果 IDE 没有更新，重启 TS Server

### 命名空间组织

推荐按功能模块组织翻译：

```json
{
  "common": { ... },           // 通用文本
  "navigation": { ... },       // 导航栏
  "home": { ... },            // 首页
  "mediaProcessor": {         // 媒体处理器
    "videoToGif": { ... },    // 视频转 GIF
    "audioExtract": { ... }   // 音频提取
  }
}
```

使用时：
```tsx
const t = useTranslations('mediaProcessor.videoToGif');
t('title')  // 简洁且类型安全
```

## ⚡ 性能优化

使用命名空间不仅提供更好的类型提示，还能：
- 减少打包体积（只加载需要的翻译）
- 提高运行时性能
- 使代码更易维护

## 🐛 常见问题

### Q: 为什么没有自动完成？
A: 
1. 确保 `src/i18n/global.d.ts` 文件存在
2. 重启 TypeScript Server
3. 检查 `tsconfig.json` 是否包含该文件
4. 确保使用 `useTranslations()` 而不是旧的 API

### Q: 类型提示不准确？
A: 
- 确保所有语言文件的结构一致
- `en.json` 是类型源，其他语言应保持相同的 key 结构
- 重新构建项目：`pnpm run build`

### Q: 如何处理动态 key？
A: 
对于动态 key，可以使用类型断言：
```tsx
const key = someCondition ? 'key1' : 'key2';
t(key as any)  // 或者使用联合类型
```

## 📚 参考资源

- [next-intl 官方文档](https://next-intl-docs.vercel.app/)
- [TypeScript 类型安全](https://next-intl-docs.vercel.app/docs/workflows/typescript)
- [示例代码](./examples/i18n-type-safe-usage.tsx)

## ✅ 配置完成检查清单

- [x] `src/i18n/global.d.ts` 已创建
- [x] `tsconfig.json` 已更新
- [x] 所有组件已迁移到 `useTranslations()`
- [x] IDE 显示自动完成（需重启 TS Server）
- [x] 构建通过（`pnpm run build`）

享受类型安全的国际化开发体验！🎉
