import { useRouter } from 'next/router';

// 加载翻译文件的函数
export async function getTranslations(locale: string) {
    try {
        const translations = await import(`../i18n/${locale}.json`);
        return translations.default;
    } catch (error) {
        // 如果找不到对应语言文件，回退到英文
        const fallback = await import('../i18n/en.json');
        return fallback.default;
    }
}

// 翻译函数，支持插值
export function t(translations: any, key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return key; // 如果找不到翻译，返回原key
        }
    }

    if (typeof value !== 'string') {
        return key;
    }

    // 简单的插值处理
    if (params) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
            return params[paramKey]?.toString() || match;
        });
    }

    return value;
}

// 格式化文件大小，根据语言环境
export function formatFileSize(bytes: number, locale: string): string {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
}

// 格式化日期，根据语言环境
export function formatDate(timestamp: number, locale: string): string {
    const date = new Date(timestamp);

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    };

    // 根据语言环境返回不同的本地化格式
    const localeMap: Record<string, string> = {
        'zh': 'zh-CN',
        'zh-tw': 'zh-TW',
        'en': 'en-US'
    };

    return date.toLocaleString(localeMap[locale] || 'en-US', options);
}
