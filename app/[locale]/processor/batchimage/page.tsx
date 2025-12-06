'use client';

import React from 'react';
import { BatchTaskGrid } from '@/components/media-processor/batch/BatchTaskGrid';
import { BatchControlPanel } from '@/components/media-processor/batch/BatchControlPanel';
import { PageHeader } from '@/components/media-processor/PageHeader';
import { useTranslation } from '@/components/TranslationProvider';

export default function BatchImageProcessorPage() {
    const { t } = useTranslation();

    return (
        <div className=" container mx-auto px-4 py-8 ">
            <PageHeader
                title={t('batchImageProcessor.title')}
                description={t('batchImageProcessor.description')}
            />

            <div className="flex gap-6">
                {/* Left Side: Task Grid (Main Content) */}
                <div className="flex-1 min-w-0">
                    <BatchTaskGrid />
                </div>

                {/* Right Side: Controls (Sidebar) */}
                <div className="w-80 flex-shrink-0">
                    <BatchControlPanel />
                </div>
            </div>
        </div>
    );
}
