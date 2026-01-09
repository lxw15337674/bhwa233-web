import type { Metadata } from 'next';
import { Locale } from '@/lib/i18n';
import { generateToolMetadata, generateToolBreadcrumbs } from '@/lib/seo';
import { ToolPageStructuredData } from '@/components/structured-data';
import { TOOL_SEO_CONFIGS } from '@/lib/tool-seo-configs';
import { getFullUrl } from '@/lib/site-config';
import BatchImageClientPage from './BatchImageClientPage';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateToolMetadata(TOOL_SEO_CONFIGS.batchImage, '/processor/batch/image', locale);
}

export default async function BatchImagePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const content = TOOL_SEO_CONFIGS.batchImage[locale];

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
    url: getFullUrl('/processor/batch/image', locale),
    applicationCategory: 'MultimediaApplication' as const,
    featureList: content.features || [],
    browserRequirements: 'HTML5, JavaScript enabled',
    operatingSystem: 'Any'
  };

  return (
    <>
      <ToolPageStructuredData breadcrumbs={breadcrumbs} appConfig={appConfig} />
      <BatchImageClientPage seoContent={content} />
    </>
  );
}

