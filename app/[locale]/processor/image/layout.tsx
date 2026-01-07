import type { Metadata } from 'next';
import { Locale } from '@/lib/i18n';
import { getTranslations } from 'next-intl/server';
import {
  generateToolBreadcrumbs,
  generateSoftwareAppSchema,
  generateCombinedSchema,
  generateBreadcrumbSchema,
  generatePageMetadata,
  type SupportedLocale,
} from '@/lib/seo';
import { StructuredData } from '@/components/structured-data';

const toolNames: Record<SupportedLocale, string> = {
  en: 'Image Processor',
  zh: '图片处理',
  'zh-tw': '圖片處理',
};

const parentCategory: Record<SupportedLocale, { name: string; path: string }> = {
  en: { name: 'Media Tools', path: '/processor' },
  zh: { name: '媒体工具', path: '/processor' },
  'zh-tw': { name: '媒體工具', path: '/processor' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'imageProcessor' });
  const safeLocale = (locale as SupportedLocale) || 'en';

  return generatePageMetadata({
    title: t('title'),
    description: t('description'),
    keywords: ['image processor', 'image converter', 'resize image', 'compress image', '图片处理', '图片压缩'],
    path: '/processor/image',
    locale: safeLocale,
  });
}

export default async function ImageProcessorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'imageProcessor' });
  const safeLocale = (locale as SupportedLocale) || 'en';

  const breadcrumbs = generateToolBreadcrumbs(
    safeLocale,
    toolNames[safeLocale],
    '/processor/image',
    parentCategory[safeLocale]
  );

  const appSchema = generateSoftwareAppSchema({
    name: toolNames[safeLocale],
    description: t('description'),
    url: `https://tools.bhwa233.com/${locale}/processor/image`,
    applicationCategory: 'MultimediaApplication',
    datePublished: '2024-01-01',
    dateModified: '2024-12-01',
    featureList: [
      'Convert image formats (PNG, JPG, WebP, GIF, etc.)',
      'Resize and scale images',
      'Compress images',
      'Rotate and flip images',
      'Batch processing support',
      'No upload required - process locally',
    ],
  });

  const combinedSchema = generateCombinedSchema([
    generateBreadcrumbSchema(breadcrumbs),
    appSchema,
  ]);

  return (
    <>
      <StructuredData data={combinedSchema} id="image-processor-structured-data" />
      {children}
    </>
  );
}
