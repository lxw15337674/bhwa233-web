import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Locale, getTranslations } from '@/lib/i18n';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations(locale);
    const baseUrl = 'https://233tools.vercel.app';
    const path = '/audio-format-converter';
    
    return {
        title: t.audioFormatConverter.title,
        description: t.audioFormatConverter.description,
        alternates: {
            canonical: locale === 'en' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`,
            languages: {
                'en': `${baseUrl}${path}`,
                'zh': `${baseUrl}/zh${path}`,
                'zh-tw': `${baseUrl}/zh-tw${path}`,
            }
        },
        openGraph: {
            title: t.audioFormatConverter.title,
            description: t.audioFormatConverter.description,
            url: locale === 'en' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`,
            type: 'website',
        },
    };
}

export default async function AudioFormatConverterPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    // 重定向到新的统一媒体处理器，保持音频转换功能
    redirect(`/${locale}/media-processor?category=audio&function=audio-convert`);
}
