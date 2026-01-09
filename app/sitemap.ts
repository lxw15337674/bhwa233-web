import { MetadataRoute } from 'next'
import { Categories } from './RouterConfig'

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://tools.bhwa233.com'
    const locales = ['en', 'zh', 'zh-tw']
    const lastModified = new Date()

    // 从 RouterConfig 动态生成所有工具页面路径
    const toolPages = Categories.flatMap(category =>
        category.items.map(item => ({
            path: item.url,
            priority: 0.9, // 工具页面高优先级
            changeFreq: 'weekly' as const
        }))
    )

    // 定义所有页面路径（包括首页和从 RouterConfig 提取的工具页面）
    const pages = [
        { path: '', priority: 1, changeFreq: 'daily' as const }, // 首页最高优先级
        ...toolPages,
        // 可以添加其他静态页面
    ]

    // 为每个页面生成多语言版本
    const sitemapEntries: MetadataRoute.Sitemap = []

    pages.forEach(page => {
        locales.forEach(locale => {
            // 英文作为默认语言，不添加 /en 前缀
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
