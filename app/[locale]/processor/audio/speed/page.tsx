import type { Metadata } from 'next';
import { Locale } from '@/lib/i18n';
import { generateToolMetadata, generateToolBreadcrumbs } from '@/lib/seo';
import { ToolPageStructuredData } from '@/components/structured-data';
import { TOOL_SEO_CONFIGS } from '@/lib/tool-seo-configs';
import { getFullUrl } from '@/lib/site-config';
import AudioSpeedClientPage from './AudioSpeedClientPage';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generateToolMetadata(TOOL_SEO_CONFIGS.audioSpeed, '/processor/audio/speed', locale);
}

export default async function AudioSpeedPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const content = TOOL_SEO_CONFIGS.audioSpeed[locale];

  const breadcrumbs = generateToolBreadcrumbs(
    locale,
    content.title.split(' - ')[0],
    '/processor/audio/speed',
    {
      name: locale === 'en' ? 'Audio Tools' : locale === 'zh' ? '音频工具' : '音訊工具',
      path: '/processor/audio'
    }
  );

  const appConfig = {
    name: content.title.split(' - ')[0],
    description: content.description,
    url: getFullUrl('/processor/audio/speed', locale),
    applicationCategory: 'MultimediaApplication' as const,
    featureList: content.features || [],
    browserRequirements: 'HTML5, JavaScript enabled',
    operatingSystem: 'Any'
  };

  return (
    <>
      <ToolPageStructuredData breadcrumbs={breadcrumbs} appConfig={appConfig} />
      <AudioSpeedClientPage seoContent={content} />
    </>
  );
}