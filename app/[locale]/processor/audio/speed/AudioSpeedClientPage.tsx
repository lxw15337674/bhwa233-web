'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ProcessorLayout } from '@/components/media-processor/layout/ProcessorLayout';
import { UnifiedFileUploadArea } from '@/components/media-processor/UnifiedFileUploadArea';
import { UnifiedMediaMetadataCard } from '@/components/media-processor/UnifiedMediaMetadataCard';
import { UnifiedProgressDisplay } from '@/components/media-processor/UnifiedProgressDisplay';
import { UnifiedOutputPreview } from '@/components/media-processor/UnifiedOutputPreview';
import { AudioSpeedControlPanel } from '@/components/media-processor/control-panels/AudioSpeedControlPanel';
import { useFFmpegManager } from '@/hooks/useFFmpeg';
import { useAppStore } from '@/stores/media-processor/app-store';
import { FunctionSelector } from '../../../../../src/components/media-processor/FunctionSelector';

export default function AudioSpeedClientPage() {
    const t = useTranslations();

    useFFmpegManager();

    const resetAppStore = useAppStore(state => state.reset);

    useEffect(() => {
        return () => {
            resetAppStore();
        };
    }, [resetAppStore]);

    const leftColumn = (
        <>
            <UnifiedFileUploadArea category="audio" />
            <UnifiedMediaMetadataCard />
        </>
    );

    const rightColumn = (
        <>
            <FunctionSelector />
            <AudioSpeedControlPanel />
            <UnifiedProgressDisplay />
            <UnifiedOutputPreview mediaType="audio" />
        </>
    );

    return (
        <ProcessorLayout
            title={t('mediaProcessor.functions.audioSpeedChange.label')}
            description={t('mediaProcessor.functions.audioSpeedChange.description')}
            leftColumn={leftColumn}
            rightColumn={rightColumn}
        />
    );
}
