import { redirect } from 'next/navigation';
import { Locale } from '@/lib/i18n';

export default async function MediaProcessorPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;
    redirect(`/${locale}/processor/audio/convert`);
}
