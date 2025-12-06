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
    
    return {
        title: t.mediaProcessor.title,
        description: t.mediaProcessor.description,
    };
}

export default function MediaProcessorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <MediaProcessorView />
        </Suspense>
    );
}
