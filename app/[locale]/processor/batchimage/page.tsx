import type { Metadata } from 'next';
import { Locale } from '@/lib/i18n';
import { getTranslations } from 'next-intl/server';
import BatchImageProcessorClientPage from './BatchImageProcessorClientPage';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations({ locale, namespace: 'batchImageProcessor' });
    const baseUrl = 'https://tools.bhwa233.com';
    const path = '/processor/batchimage';

    return {
        title: t('title') || 'Batch Image Processor',
        description: t('description') || 'Batch image processing tool',
        alternates: {
            canonical: locale === 'en' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`,
            languages: {
                'en': `${baseUrl}${path}`,
                'zh': `${baseUrl}/zh${path}`,
                'zh-tw': `${baseUrl}/zh-tw${path}`,
            }
        },
        openGraph: {
            title: t('title') || 'Batch Image Processor',
            description: t('description') || 'Batch image processing tool',
            type: 'website',
        },
    };
}

export default function BatchImageProcessorPage() {
    return <BatchImageProcessorClientPage />;
}
