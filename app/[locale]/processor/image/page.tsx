import type { Metadata } from 'next';
import { Locale } from '@/lib/i18n';
import { generateToolMetadata } from '@/lib/seo';
import { ToolPageStructuredData } from '@/components/structured-data';
import { generateToolBreadcrumbs } from '@/lib/seo';
import { TOOL_SEO_CONFIGS } from '@/lib/tool-seo-configs';
import ImageProcessorClientPage from './ImageProcessorClientPage';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
    const { locale } = await params;
    return generateToolMetadata(TOOL_SEO_CONFIGS.imageProcess, '/processor/image', locale);
}

export default async function ImageProcessorPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    const content = TOOL_SEO_CONFIGS.imageProcess[locale];

    const breadcrumbs = generateToolBreadcrumbs(
        locale,
        content.title.split(' - ')[0],
        '/processor/image',
        {
            name: locale === 'en' ? 'Media Processor' : locale === 'zh' ? '媒体处理' : '媒體處理',
            path: '/media-processor'
        }
    );

    const appConfig = {
        name: content.title.split(' - ')[0],
        description: content.description,
        url: `https://tools.bhwa233.com/${locale}/processor/image`,
        applicationCategory: 'DesignApplication' as const,
        featureList: content.features || [],
        browserRequirements: 'HTML5, JavaScript enabled',
        operatingSystem: 'Any'
    };

    return (
        <>
            <ToolPageStructuredData breadcrumbs={breadcrumbs} appConfig={appConfig} />
            <ImageProcessorClientPage seoContent={content} />
        </>
    );
}
