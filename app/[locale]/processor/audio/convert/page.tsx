import type { Metadata } from 'next';
import { Locale } from '@/lib/i18n';
import { generateToolMetadata } from '@/lib/seo';
import { ToolPageStructuredData } from '@/components/structured-data';
import { generateToolBreadcrumbs } from '@/lib/seo';
import { TOOL_SEO_CONFIGS } from '@/lib/tool-seo-configs';
import AudioConvertClientPage from './AudioConvertClientPage';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateToolMetadata(TOOL_SEO_CONFIGS.audioConvert, '/processor/audio/convert', locale);
}

export default async function AudioConvertPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const content = TOOL_SEO_CONFIGS.audioConvert[locale];

  const breadcrumbs = generateToolBreadcrumbs(
    locale,
    content.title.split(' - ')[0],
    '/processor/audio/convert',
    {
      name: locale === 'en' ? 'Audio Tools' : locale === 'zh' ? '音频工具' : '音訊工具',
      path: '/processor/audio'
    }
  );

  const appConfig = {
    name: content.title.split(' - ')[0],
    description: content.description,
    url: `https://tools.bhwa233.com/${locale}/processor/audio/convert`,
    applicationCategory: 'MultimediaApplication' as const,
    featureList: content.features || [],
    browserRequirements: 'HTML5, JavaScript enabled',
    operatingSystem: 'Any'
  };

  return (
    <>
      <ToolPageStructuredData breadcrumbs={breadcrumbs} appConfig={appConfig} />
      <AudioConvertClientPage seoContent={content} />
    </>
  );
}