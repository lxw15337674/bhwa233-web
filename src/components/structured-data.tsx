import Script from 'next/script';
import {
  organizationSchema,
  websiteSchema,
  generateBreadcrumbSchema,
  generateSoftwareAppSchema,
  generateCombinedSchema,
  type BreadcrumbItem,
  type SoftwareAppConfig,
} from '@/lib/seo';

interface StructuredDataProps {
  data: object;
  id?: string;
}

/**
 * 通用结构化数据组件
 */
export function StructuredData({ data, id = 'structured-data' }: StructuredDataProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * 全站基础结构化数据（Organization + WebSite）
 * 应放在根 layout 中
 */
export function GlobalStructuredData() {
  const combinedSchema = generateCombinedSchema([
    organizationSchema,
    websiteSchema,
  ]);

  return (
    <Script
      id="global-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedSchema) }}
    />
  );
}

/**
 * 面包屑结构化数据组件
 */
export function BreadcrumbStructuredData({ items }: { items: BreadcrumbItem[] }) {
  const schema = generateBreadcrumbSchema(items);

  return (
    <Script
      id="breadcrumb-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * 软件应用结构化数据组件
 */
export function SoftwareAppStructuredData({ config }: { config: SoftwareAppConfig }) {
  const schema = generateSoftwareAppSchema(config);

  return (
    <Script
      id="software-app-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * 工具页面完整结构化数据（面包屑 + 软件应用）
 */
export function ToolPageStructuredData({
  breadcrumbs,
  appConfig,
}: {
  breadcrumbs: BreadcrumbItem[];
  appConfig: SoftwareAppConfig;
}) {
  const combinedSchema = generateCombinedSchema([
    generateBreadcrumbSchema(breadcrumbs),
    generateSoftwareAppSchema(appConfig),
  ]);

  return (
    <Script
      id="tool-page-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(combinedSchema) }}
    />
  );
}

// 保留旧的导出以保持向后兼容
export const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '工具箱',
  url: 'https://tools.bhwa233.com',
  description: '集成摸鱼办、热榜资讯、媒体处理等多功能的在线工具箱',
  applicationCategory: 'Utility',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Person',
    name: '233tools',
  },
  publisher: {
    '@type': 'Organization',
    name: '工具箱',
  },
};
