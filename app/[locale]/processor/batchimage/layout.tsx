import type { Metadata } from 'next';
import { Locale, getTranslations } from '@/lib/i18n';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
    const { locale } = await params;
    const t = await getTranslations(locale);
    
    return {
        title: t.batchImageProcessor.title,
        description: t.batchImageProcessor.description,
    };
}

export default function BatchImageProcessorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
