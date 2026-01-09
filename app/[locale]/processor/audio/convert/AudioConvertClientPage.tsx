'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ProcessorLayout } from '@/components/media-processor/layout/ProcessorLayout';
import { UnifiedFileUploadArea } from '@/components/media-processor/UnifiedFileUploadArea';
import { UnifiedMediaMetadataCard } from '@/components/media-processor/UnifiedMediaMetadataCard';
import { UnifiedProgressDisplay } from '@/components/media-processor/UnifiedProgressDisplay';
import { UnifiedOutputPreview } from '@/components/media-processor/UnifiedOutputPreview';
import { AudioConvertControlPanel } from '@/components/media-processor/control-panels/AudioConvertControlPanel';
import { useFFmpegManager } from '@/hooks/useFFmpeg';
import { useAppStore } from '@/stores/media-processor/app-store';
import { FunctionSelector } from '../../../../../src/components/media-processor/FunctionSelector';

interface AudioConvertClientPageProps {
    seoContent?: {
        title: string;
        description: string;
        features: string[];
    };
}

export default function AudioConvertClientPage({ seoContent }: AudioConvertClientPageProps) {
    const t = useTranslations();

    // FFmpeg 初始化 (确保 FFmpeg 在页面加载时开始加载)
    useFFmpegManager();

    // 从 AppStore 获取 reset action
    const resetAppStore = useAppStore(state => state.reset);

    // 页面卸载时重置 Store
    useEffect(() => {
        return () => {
            resetAppStore();
        };
    }, [resetAppStore]);

    // 左侧内容：上传 + 元数据
    const leftColumn = (
        <>
            <UnifiedFileUploadArea category="audio" />
            <UnifiedMediaMetadataCard />
        </>
    );

    // 右侧内容：控制面板 + 进度 + 预览
    const rightColumn = (
        <>
            <FunctionSelector />
            <AudioConvertControlPanel />
            <UnifiedProgressDisplay />
            <UnifiedOutputPreview mediaType="audio" />
        </>
    );

    return (
        <ProcessorLayout
            title={t('mediaProcessor.functions.audioConvert.label')}
            description={t('mediaProcessor.functions.audioConvert.description')}
            leftColumn={leftColumn}
            rightColumn={rightColumn}
            seoContent={seoContent}
        />
    );
}
