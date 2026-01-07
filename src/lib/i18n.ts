// 语言配置（客户端和服务端都可用）
export const locales = ['en', 'zh', 'zh-tw'] as const
export type Locale = typeof locales[number]
export const defaultLocale: Locale = 'en'

// 格式化文件大小，根据语言环境
export function formatFileSize(bytes: number, locale: Locale): string {
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(2)} MB`
}

// 格式化日期，根据语言环境
export function formatDate(timestamp: number, locale: Locale): string {
    const date = new Date(timestamp)

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }

    // 根据语言环境返回不同的本地化格式
    const localeMap: Record<string, string> = {
        'zh': 'zh-CN',
        'zh-tw': 'zh-TW',
        'en': 'en-US'
    }

    return date.toLocaleString(localeMap[locale] || 'en-US', options)
}
