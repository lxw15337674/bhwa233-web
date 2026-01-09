import type { Metadata } from 'next';
import { Locale } from '@/lib/i18n';
import { generateToolMetadata } from '@/lib/seo';
import { ToolPageStructuredData } from '@/components/structured-data';
import { generateToolBreadcrumbs } from '@/lib/seo';
import { TOOL_SEO_CONFIGS } from '@/lib/tool-seo-configs';
import AudioExtractClientPage from './AudioExtractClientPage';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return generateToolMetadata(TOOL_SEO_CONFIGS.videoExtract, '/processor/video/extract', locale);
}

export default async function AudioExtractPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    const content = TOOL_SEO_CONFIGS.videoExtract[locale];

    const breadcrumbs = generateToolBreadcrumbs(
        locale,
        content.title.split(' - ')[0],
        '/processor/video/extract',
        {
            name: locale === 'en' ? 'Video Tools' : locale === 'zh' ? '视频工具' : '影片工具',
            path: '/processor/video'
        }
    );

    const appConfig = {
        name: content.title.split(' - ')[0],
        description: content.description,
        url: `https://tools.bhwa233.com/${locale}/processor/video/extract`,
        applicationCategory: 'MultimediaApplication' as const,
        featureList: content.features || [],
        browserRequirements: 'HTML5, JavaScript enabled',
        operatingSystem: 'Any'
    };

    return (
        <>
          <ToolPageStructuredData breadcrumbs={breadcrumbs} appConfig={appConfig} />
          <AudioExtractClientPage seoContent={content} />
      </>
  );
}