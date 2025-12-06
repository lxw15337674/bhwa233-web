import { redirect } from 'next/navigation';
import { Locale } from '@/lib/i18n';

export default async function AudioConverterPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    // 重定向到新的统一媒体处理器，保持音频提取功能
    redirect(`/${locale}/media-processor?category=video&function=audio-extract`);
}
