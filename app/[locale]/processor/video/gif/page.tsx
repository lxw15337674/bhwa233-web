'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/components/TranslationProvider';
import { ProcessorLayout } from '@/components/media-processor/layout/ProcessorLayout';
import { UnifiedFileUploadArea } from '@/components/media-processor/UnifiedFileUploadArea';
import { UnifiedMediaMetadataCard } from '@/components/media-processor/UnifiedMediaMetadataCard';
import { UnifiedProgressDisplay } from '@/components/media-processor/UnifiedProgressDisplay';
import { UnifiedOutputPreview } from '@/components/media-processor/UnifiedOutputPreview';
import { VideoToGifControlPanel } from '@/components/media-processor/control-panels/VideoToGifControlPanel';
import { VideoPreviewCard } from '@/components/media-processor/VideoPreviewCard';
import { useFFmpegManager } from '@/hooks/useFFmpeg';
import { useAppStore } from '@/stores/media-processor/app-store';
import { FunctionSelector } from '@/components/media-processor/FunctionSelector';

export default function VideoGifPage() {
  const { t } = useTranslation();
  
  // FFmpeg initialization
  useFFmpegManager();

  const resetAppStore = useAppStore(state => state.reset);
  
  useEffect(() => {
    return () => {
      resetAppStore();
    };
  }, [resetAppStore]);

  const leftColumn = (
    <>
      <UnifiedFileUploadArea category="video" />
      <VideoPreviewCard />
      <UnifiedMediaMetadataCard />
    </>
  );

  const rightColumn = (
    <>
      <FunctionSelector />
      <VideoToGifControlPanel />
      <UnifiedProgressDisplay />
    </>
  );

  return (
    <ProcessorLayout
      title={t('mediaProcessor.functions.videoGif.label')}
      description={t('mediaProcessor.functions.videoGif.description')}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      category="video"
    />
  );
}
