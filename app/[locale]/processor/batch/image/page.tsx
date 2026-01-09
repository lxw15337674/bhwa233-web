import type { Metadata } from 'next';
import { Locale } from '@/lib/i18n';
import { generateToolMetadata, type ToolSEOConfig } from '@/lib/seo';
import { ToolPageStructuredData } from '@/components/structured-data';
import { generateToolBreadcrumbs, generateSoftwareAppSchema } from '@/lib/seo';
import BatchImageClientPage from './BatchImageClientPage';

const toolSEO: ToolSEOConfig = {
  en: {
    title: 'Batch Image Processing - Compress & Convert Multiple Images | Toolbox',
    description: 'Free online batch image processor. Compress, resize, and convert multiple images at once. Support for JPG, PNG, WebP formats. Process up to 20 images simultaneously.',
    keywords: [
      'batch image processing',
      'bulk image converter',
      'compress multiple images',
      'batch image resizer',
      'convert images online',
      'batch photo editor',
      'image compression tool',
      'JPG to PNG converter',
      'PNG to WebP',
      'online image optimizer'
    ],
    features: [
      'Batch compress images',
      'Batch format conversion',
      'Batch resize images',
      'Support JPG, PNG, WebP, GIF',
      'Process up to 20 images',
      'Quality adjustment',
      'Dimension scaling',
      'Privacy protected - local processing'
    ]
  },
  zh: {
    title: '批量图片处理 - 在线批量压缩转换图片 | 工具箱',
    description: '免费在线批量图片处理工具。一次性压缩、调整大小、转换多张图片。支持 JPG、PNG、WebP 格式。最多可同时处理20张图片。',
    keywords: [
      '批量图片处理',
      '批量图片压缩',
      '批量图片转换',
      '批量图片调整大小',
      '在线图片批处理',
      '图片批量转换工具',
      '批量压缩图片',
      'JPG转PNG批量',
      'PNG转WebP批量',
      '在线批量图片优化'
    ],
    features: [
      '批量压缩图片',
      '批量格式转换',
      '批量调整尺寸',
      '支持 JPG、PNG、WebP、GIF',
      '最多同时处理20张',
      '质量调节',
      '尺寸缩放',
      '本地处理保护隐私'
    ]
  },
  'zh-tw': {
    title: '批次圖片處理 - 線上批次壓縮轉換圖片 | 工具箱',
    description: '免費線上批次圖片處理工具。一次性壓縮、調整大小、轉換多張圖片。支援 JPG、PNG、WebP 格式。最多可同時處理20張圖片。',
    keywords: [
      '批次圖片處理',
      '批次圖片壓縮',
      '批次圖片轉換',
      '批次圖片調整大小',
      '線上圖片批次處理',
      '圖片批次轉換工具',
      '批次壓縮圖片',
      'JPG轉PNG批次',
      'PNG轉WebP批次',
      '線上批次圖片優化'
    ],
    features: [
      '批次壓縮圖片',
      '批次格式轉換',
      '批次調整尺寸',
      '支援 JPG、PNG、WebP、GIF',
      '最多同時處理20張',
      '品質調節',
      '尺寸縮放',
      '本地處理保護隱私'
    ]
  }
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateToolMetadata(toolSEO, '/processor/batch/image', locale);
}

export default async function BatchImagePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const content = toolSEO[locale];

  const breadcrumbs = generateToolBreadcrumbs(
    locale,
    content.title.split(' - ')[0],
    '/processor/batch/image',
    {
      name: locale === 'en' ? 'Image Processing' : locale === 'zh' ? '图片处理' : '圖片處理',
      path: '/processor/image'
    }
  );

  const appConfig = {
    name: content.title.split(' - ')[0],
    description: content.description,
    url: `https://tools.bhwa233.com/${locale}/processor/batch/image`,
    applicationCategory: 'MultimediaApplication' as const,
    featureList: content.features || [],
    browserRequirements: 'HTML5, JavaScript enabled',
    operatingSystem: 'Any'
  };

  return (
    <>
      <ToolPageStructuredData breadcrumbs={breadcrumbs} appConfig={appConfig} />
      <BatchImageClientPage />
    </>
  );
}

