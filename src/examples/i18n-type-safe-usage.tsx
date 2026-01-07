/**
 * next-intl 类型安全使用示例
 * 
 * 配置完成后，你将获得以下优势：
 * 1. 翻译 key 的自动完成
 * 2. 编译时的类型检查
 * 3. 避免拼写错误
 */

import { useTranslations } from 'next-intl';

export function TypeSafeExample() {
    // ✅ 推荐：使用命名空间获得更好的自动完成
    const t = useTranslations('common');

    // 现在 t() 函数会提供自动完成：
    // t('loading')       ✅ 有效
    // t('error')         ✅ 有效
    // t('invalid-key')   ❌ TypeScript 会报错

    return (
        <div>
            <h1>{t('loading')}</h1>
            <p>{t('errors.ffmpegNotReady')}</p>
        </div>
    );
}

// 对于嵌套的翻译，可以使用命名空间
export function NestedExample() {
    const t = useTranslations('mediaProcessor.videoToGif');

    // 自动完成会显示 videoToGif 命名空间下的所有 key
    return <h1>{t('title')}</h1>;
}

// 对于带参数的翻译
export function ParameterExample() {
    const t = useTranslations('common.progress');

    return (
        <div>
            {/* TypeScript 会检查参数名称是否正确 */}
            <p>{t('remainingSeconds', { seconds: 30 })}</p>
            <p>{t('remainingMinutes', { minutes: 5 })}</p>
        </div>
    );
}

// 服务端组件示例
export async function ServerComponentExample() {
    const { getTranslations } = await import('next-intl/server');
    const t = await getTranslations('home');

    return <h1>{t('title')}</h1>;
}
