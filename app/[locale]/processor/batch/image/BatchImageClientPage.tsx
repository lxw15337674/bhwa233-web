'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ProcessorLayout } from '@/components/media-processor/layout/ProcessorLayout';
import { BatchTaskGrid } from '@/components/media-processor/batch/BatchTaskGrid';
import { BatchControlPanel } from '@/components/media-processor/batch/BatchControlPanel';

interface BatchImageClientPageProps {
    seoContent?: {
        title: string;
        description: string;
        features: string[];
    };
}

export default function BatchImageClientPage({ seoContent }: BatchImageClientPageProps) {
    const t = useTranslations();

    const leftColumn = (
        <BatchTaskGrid />
    );

    const rightColumn = (
        <BatchControlPanel />
    );

    return (
        <ProcessorLayout
            title={t('mediaProcessor.functions.imageBatch.label')}
            description={t('mediaProcessor.functions.imageBatch.description')}
            leftColumn={leftColumn}
            rightColumn={rightColumn}
            seoContent={seoContent}
        />
    );
}
