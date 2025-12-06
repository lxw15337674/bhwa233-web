import type { Metadata } from 'next';
import { Suspense } from 'react';
import MediaProcessorView from '@/components/media-processor/MediaProcessorView';
import { Locale, getTranslations } from '@/lib/i18n';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations(locale);
    const baseUrl = 'https://233tools.vercel.app';
    const path = '/media-processor';
    
    return {
        title: t.mediaProcessor.title,
        description: t.mediaProcessor.description,
        alternates: {
            canonical: locale === 'en' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`,
            languages: {
                'en': `${baseUrl}${path}`,
                'zh': `${baseUrl}/zh${path}`,
                'zh-tw': `${baseUrl}/zh-tw${path}`,
            }
        },
        openGraph: {
            title: t.mediaProcessor.title,
            description: t.mediaProcessor.description,
            url: locale === 'en' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`,
            type: 'website',
            locale: locale === 'zh-tw' ? 'zh_TW' : locale === 'zh' ? 'zh_CN' : 'en_US',
        },
        twitter: {
            card: 'summary',
            title: t.mediaProcessor.title,
            description: t.mediaProcessor.description,
        },
    };
}

export default function MediaProcessorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MediaProcessorView />
        </Suspense>
    );
}
