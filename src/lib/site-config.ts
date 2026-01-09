/**
 * 站点配置
 * 集中管理站点的基础配置信息
 */

export const SITE_CONFIG = {
  /**
   * 站点基础 URL
   * 用于生成绝对链接、sitemap、OpenGraph 等
   */
  baseUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://tools.bhwa233.com',

  /**
   * 站点名称
   */
  name: 'Toolbox',

  /**
   * 支持的语言
   */
  locales: ['en', 'zh', 'zh-tw'] as const,

  /**
   * 默认语言
   */
  defaultLocale: 'en' as const,
} as const;

/**
 * 生成完整的 URL
 * @param path - 路径（如 /processor/image）
 * @param locale - 语言（如 'zh'）
 * @returns 完整的 URL
 */
export function getFullUrl(path: string, locale?: string): string {
  const { baseUrl, defaultLocale } = SITE_CONFIG;

  if (!locale || locale === defaultLocale) {
    return `${baseUrl}${path}`;
  }

  return `${baseUrl}/${locale}${path}`;
}

/**
 * 生成多语言链接
 * @param path - 路径（如 /processor/image）
 * @returns 多语言链接对象
 */
export function getAlternateLanguages(path: string) {
  const { baseUrl, locales } = SITE_CONFIG;

  return Object.fromEntries(
    locales.map(locale => [
      locale === 'zh-tw' ? 'zh-tw' : locale,
      locale === 'en' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`
    ])
  );
}
