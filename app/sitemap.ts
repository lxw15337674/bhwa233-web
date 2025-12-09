import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://233tools.vercel.app'
    const locales = ['en', 'zh', 'zh-tw']
    const lastModified = new Date()

    // 定义所有页面路径
    const pages = [
        { path: '', priority: 1, changeFreq: 'daily' as const },
        { path: '/fishingTime', priority: 0.9, changeFreq: 'daily' as const },
        { path: '/upload', priority: 0.8, changeFreq: 'weekly' as const },
        { path: '/media-processor', priority: 0.9, changeFreq: 'weekly' as const },
        { path: '/audio-converter', priority: 0.8, changeFreq: 'weekly' as const },
        { path: '/audio-format-converter', priority: 0.8, changeFreq: 'weekly' as const },
        { path: '/processor/image', priority: 0.8, changeFreq: 'weekly' as const },
        { path: '/processor/editor', priority: 0.8, changeFreq: 'weekly' as const },
        { path: '/processor/batchimage', priority: 0.8, changeFreq: 'weekly' as const },
    ]

    // 为每个页面生成多语言版本
    const sitemapEntries: MetadataRoute.Sitemap = []

    pages.forEach(page => {
        locales.forEach(locale => {
            const url = locale === 'en'
                ? `${baseUrl}${page.path}`
                : `${baseUrl}/${locale}${page.path}`

            sitemapEntries.push({
                url,
                lastModified,
                changeFrequency: page.changeFreq,
                priority: page.priority,
                alternates: {
                    languages: {
                        en: `${baseUrl}${page.path}`,
                        zh: `${baseUrl}/zh${page.path}`,
                        'zh-tw': `${baseUrl}/zh-tw${page.path}`,
                    }
                }
            })
        })
    })

    return sitemapEntries
}
