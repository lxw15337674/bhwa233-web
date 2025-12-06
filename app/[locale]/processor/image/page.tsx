import type { Metadata } from 'next';
import { Locale, getTranslations } from '@/lib/i18n';
import ImageProcessorClientPage from './ImageProcessorClientPage';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations(locale);
    const baseUrl = 'https://233tools.vercel.app';
    const path = '/processor/image';

    return {
        title: t.imageProcessor?.title || 'Image Processor',
        description: t.imageProcessor?.description || 'Online image processing tool',
        alternates: {
            canonical: locale === 'en' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`,
            languages: {
                'en': `${baseUrl}${path}`,
                'zh': `${baseUrl}/zh${path}`,
                'zh-tw': `${baseUrl}/zh-tw${path}`,
            }
        },
        openGraph: {
            title: t.imageProcessor?.title || 'Image Processor',
            description: t.imageProcessor?.description || 'Online image processing tool',
            type: 'website',
        },
    };
}

export default function ImageProcessorPage() {
    return <ImageProcessorClientPage />;
}
