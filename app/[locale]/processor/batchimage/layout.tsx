import type { Metadata } from 'next';
import { Locale, getTranslations } from '@/lib/i18n';
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
  en: 'Batch Image Processor',
  zh: '批量图片处理',
  'zh-tw': '批次圖片處理',
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
  const t = await getTranslations(locale);
  const safeLocale = (locale as SupportedLocale) || 'en';

  return generatePageMetadata({
    title: t.batchImageProcessor.title,
    description: t.batchImageProcessor.description,
    keywords: ['batch image', 'bulk image processor', 'batch convert', 'batch resize', '批量图片', '批量处理'],
    path: '/processor/batchimage',
    locale: safeLocale,
  });
}

export default async function BatchImageProcessorLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getTranslations(locale);
  const safeLocale = (locale as SupportedLocale) || 'en';

  const breadcrumbs = generateToolBreadcrumbs(
    safeLocale,
    toolNames[safeLocale],
    '/processor/batchimage',
    parentCategory[safeLocale]
  );

  const appSchema = generateSoftwareAppSchema({
    name: toolNames[safeLocale],
    description: t.batchImageProcessor.description,
    url: `https://tools.bhwa233.com/${locale}/processor/batchimage`,
    applicationCategory: 'MultimediaApplication',
    datePublished: '2024-01-01',
    dateModified: '2024-12-01',
    featureList: [
      'Process multiple images at once',
      'Batch format conversion',
      'Batch resize and compress',
      'Consistent output settings',
      'Download as ZIP archive',
      'No upload required - process locally',
    ],
  });

  const combinedSchema = generateCombinedSchema([
    generateBreadcrumbSchema(breadcrumbs),
    appSchema,
  ]);

  return (
    <>
      <StructuredData data={combinedSchema} id="batch-image-structured-data" />
      {children}
    </>
  );
}
