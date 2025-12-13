import type { Metadata } from 'next';

// 基础配置
export const SEO_CONFIG = {
  siteName: 'Toolbox',
  siteNameCn: '工具箱',
  baseUrl: 'https://tools.bhwa233.com',
  logo: '/icons/icon-256.png',
  author: '233tools',
  defaultImage: '/icons/icon-256.png',
};

// 支持的语言
export type SupportedLocale = 'en' | 'zh' | 'zh-tw';

// 语言对应的 Open Graph locale
const OG_LOCALES: Record<SupportedLocale, string> = {
  en: 'en_US',
  zh: 'zh_CN',
  'zh-tw': 'zh_TW',
};

// ==================== 结构化数据 ====================

/**
 * Organization Schema - 组织/品牌信息
 */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SEO_CONFIG.baseUrl}/#organization`,
  name: SEO_CONFIG.siteName,
  alternateName: SEO_CONFIG.siteNameCn,
  url: SEO_CONFIG.baseUrl,
  logo: {
    '@type': 'ImageObject',
    url: `${SEO_CONFIG.baseUrl}${SEO_CONFIG.logo}`,
    width: 256,
    height: 256,
  },
  sameAs: [],
};

/**
 * WebSite Schema - 网站信息
 */
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SEO_CONFIG.baseUrl}/#website`,
  name: SEO_CONFIG.siteName,
  alternateName: SEO_CONFIG.siteNameCn,
  url: SEO_CONFIG.baseUrl,
  publisher: {
    '@id': `${SEO_CONFIG.baseUrl}/#organization`,
  },
  inLanguage: ['en', 'zh-CN', 'zh-TW'],
};

/**
 * 面包屑项类型
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * 生成 BreadcrumbList Schema
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * SoftwareApplication 配置类型
 */
export interface SoftwareAppConfig {
  name: string;
  description: string;
  url: string;
  applicationCategory: 'UtilityApplication' | 'MultimediaApplication' | 'DesignApplication' | 'DeveloperApplication';
  featureList: string[];
  softwareVersion?: string;
  datePublished?: string;
  dateModified?: string;
  operatingSystem?: string;
  browserRequirements?: string;
  screenshot?: string;
}

/**
 * 生成 SoftwareApplication Schema
 */
export function generateSoftwareAppSchema(config: SoftwareAppConfig) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: config.name,
    description: config.description,
    url: config.url,
    applicationCategory: config.applicationCategory,
    operatingSystem: config.operatingSystem || 'Any',
    browserRequirements: config.browserRequirements || 'HTML5, JavaScript enabled',
    softwareVersion: config.softwareVersion || '1.0',
    ...(config.datePublished && { datePublished: config.datePublished }),
    ...(config.dateModified && { dateModified: config.dateModified }),
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
    featureList: config.featureList,
    ...(config.screenshot && {
      screenshot: {
        '@type': 'ImageObject',
        url: config.screenshot,
      },
    }),
    author: {
      '@type': 'Person',
      name: SEO_CONFIG.author,
    },
    publisher: {
      '@id': `${SEO_CONFIG.baseUrl}/#organization`,
    },
  };
}

/**
 * 生成包含多个 schema 的 JSON-LD 数组
 */
export function generateCombinedSchema(schemas: object[]) {
  return {
    '@context': 'https://schema.org',
    '@graph': schemas.map(schema => {
      // 移除单独的 @context，因为已在顶层定义
      const { '@context': _, ...rest } = schema as Record<string, unknown>;
      return rest;
    }),
  };
}

// ==================== Metadata 工具函数 ====================

/**
 * 页面 Metadata 配置类型
 */
export interface PageMetaConfig {
  title: string;
  description: string;
  keywords?: string[];
  path: string;
  locale: SupportedLocale;
  imageAlt?: string;
}

/**
 * 生成页面 Metadata
 */
export function generatePageMetadata(config: PageMetaConfig): Metadata {
  const { title, description, keywords, path, locale, imageAlt } = config;
  const canonicalUrl = `${SEO_CONFIG.baseUrl}/${locale}${path}`;
  const ogLocale = OG_LOCALES[locale];

  return {
    title,
    description,
    ...(keywords && { keywords }),
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${SEO_CONFIG.baseUrl}/en${path}`,
        'zh': `${SEO_CONFIG.baseUrl}/zh${path}`,
        'zh-TW': `${SEO_CONFIG.baseUrl}/zh-tw${path}`,
        'x-default': `${SEO_CONFIG.baseUrl}/en${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: locale === 'en' ? SEO_CONFIG.siteName : SEO_CONFIG.siteNameCn,
      locale: ogLocale,
      type: 'website',
      images: [
        {
          url: SEO_CONFIG.defaultImage,
          width: 256,
          height: 256,
          alt: imageAlt || title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [SEO_CONFIG.defaultImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * 多语言 Metadata 映射类型
 */
export interface LocalizedMetaMap {
  en: {
    title: string;
    description: string;
    keywords: string[];
  };
  zh: {
    title: string;
    description: string;
    keywords: string[];
  };
  'zh-tw': {
    title: string;
    description: string;
    keywords: string[];
  };
}

/**
 * 根据语言生成 Metadata（简化版）
 */
export function generateLocalizedMetadata(
  metaMap: LocalizedMetaMap,
  path: string,
  locale: SupportedLocale
): Metadata {
  const meta = metaMap[locale] || metaMap.en;
  return generatePageMetadata({
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    path,
    locale,
  });
}

// ==================== 预定义的面包屑生成器 ====================

/**
 * 生成工具页面的面包屑
 */
export function generateToolBreadcrumbs(
  locale: SupportedLocale,
  toolName: string,
  toolPath: string,
  parentCategory?: { name: string; path: string }
): BreadcrumbItem[] {
  const homeNames: Record<SupportedLocale, string> = {
    en: 'Home',
    zh: '首页',
    'zh-tw': '首頁',
  };

  const items: BreadcrumbItem[] = [
    { name: homeNames[locale], url: `${SEO_CONFIG.baseUrl}/${locale}` },
  ];

  if (parentCategory) {
    items.push({
      name: parentCategory.name,
      url: `${SEO_CONFIG.baseUrl}/${locale}${parentCategory.path}`,
    });
  }

  items.push({
    name: toolName,
    url: `${SEO_CONFIG.baseUrl}/${locale}${toolPath}`,
  });

  return items;
}
