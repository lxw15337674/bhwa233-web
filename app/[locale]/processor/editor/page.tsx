import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Locale } from '@/lib/i18n';
import { generateToolMetadata, generateToolBreadcrumbs } from '@/lib/seo';
import { ToolPageStructuredData } from '@/components/structured-data';
import { TOOL_SEO_CONFIGS } from '@/lib/tool-seo-configs';
import EditorClientPage from './EditorClientPage';

interface Props {
    params: Promise<{ locale: string }>;
}

const locales = ['en', 'zh', 'zh-tw'];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;

    if (!locales.includes(locale)) {
        notFound();
    }

    return generateToolMetadata(TOOL_SEO_CONFIGS.imageEditor, '/processor/editor', locale as Locale);
}

export default async function EditorPage({ params }: Props) {
    const { locale } = await params;

    if (!locales.includes(locale)) {
        notFound();
    }

    const content = TOOL_SEO_CONFIGS.imageEditor[locale as Locale];

    const breadcrumbs = generateToolBreadcrumbs(
        locale as Locale,
        content.title.split(' - ')[0],
        '/processor/editor',
        {
            name: locale === 'en' ? 'Media Processor' : locale === 'zh' ? '媒体处理' : '媒體處理',
            path: '/media-processor'
        }
    );

    const appConfig = {
        name: content.title.split(' - ')[0],
        description: content.description,
        url: `https://tools.bhwa233.com/${locale}/processor/editor`,
        applicationCategory: 'DesignApplication' as const,
        featureList: content.features || [],
        browserRequirements: 'HTML5, JavaScript enabled',
        operatingSystem: 'Any'
    };

    return (
        <>
            <ToolPageStructuredData breadcrumbs={breadcrumbs} appConfig={appConfig} />
            <EditorClientPage seoContent={content} />
        </>
    );
}
