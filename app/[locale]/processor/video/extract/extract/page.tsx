'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/components/TranslationProvider';
import { ProcessorLayout } from '@/components/media-processor/layout/ProcessorLayout';
import { UnifiedFileUploadArea } from '@/components/media-processor/UnifiedFileUploadArea';
import { UnifiedMediaMetadataCard } from '@/components/media-processor/UnifiedMediaMetadataCard';
import { UnifiedProgressDisplay } from '@/components/media-processor/UnifiedProgressDisplay';
import { UnifiedOutputPreview } from '@/components/media-processor/UnifiedOutputPreview';
import { AudioExtractControlPanel } from '@/components/media-processor/control-panels/AudioExtractControlPanel';
import { useFFmpegManager } from '@/hooks/useFFmpeg';
import { useAppStore } from '@/stores/media-processor/app-store';
import { FunctionSelector } from '@/components/media-processor/FunctionSelector';

export default function AudioExtractPage() {
  const { t } = useTranslation();
  
  // FFmpeg 初始化
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
      <AudioExtractControlPanel />
      <UnifiedProgressDisplay />
      <UnifiedOutputPreview />
    </>
  );

  return (
    <ProcessorLayout
      title={t('audioControlPanels.extract.title')}
      description={t('audioControlPanels.extract.description')}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
      category="audio"
    />
  );
}
