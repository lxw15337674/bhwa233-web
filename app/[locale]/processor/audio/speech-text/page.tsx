'use client';

import React, { useEffect } from 'react';
import { useTranslation } from '@/components/TranslationProvider';
import { ProcessorLayout } from '@/components/media-processor/layout/ProcessorLayout';
import { UnifiedFileUploadArea } from '@/components/media-processor/UnifiedFileUploadArea';
import { UnifiedMediaMetadataCard } from '@/components/media-processor/UnifiedMediaMetadataCard';
import { UnifiedProgressDisplay } from '@/components/media-processor/UnifiedProgressDisplay';
import { SpeechToTextControlPanel } from '@/components/media-processor/control-panels/SpeechToTextControlPanel';

import { useFFmpegManager } from '@/hooks/useFFmpeg';
import { useSpeechToTextStore } from '@/stores/media-processor/speech-to-text-store';
import { useAppStore } from '@/stores/media-processor/app-store'; // Import useAppStore for reset
import { ProcessingState } from '@/types/media-processor'; // Import ProcessingState

export default function SpeechToTextPage() {
  const { t } = useTranslation();
  
  useFFmpegManager(); // Ensure FFmpeg is loaded for metadata analysis

  // From useSpeechToTextStore for specific progress
  const isProcessingSpeech = useSpeechToTextStore(state => state.isProcessing);
  const progressSpeech = useSpeechToTextStore(state => state.progress);
  const currentStepSpeech = useSpeechToTextStore(state => state.currentStep);
  const errorSpeech = useSpeechToTextStore(state => state.error); // Error from speech store
  const resultSpeech = useSpeechToTextStore(state => state.result);
  const outputFileNameSpeech = useSpeechToTextStore(state => state.outputFileName);
  const resetSpeechStore = useSpeechToTextStore(state => state.resetState);

  // From useAppStore for reset and general file handling if needed
  const resetAppStore = useAppStore(state => state.reset);

  useEffect(() => {
    return () => {
      resetAppStore();
      resetSpeechStore();
    };
  }, [resetAppStore, resetSpeechStore]);

  // 左侧内容
  const leftColumn = (
    <>
      <UnifiedFileUploadArea category="audio" />
      <UnifiedMediaMetadataCard />
    </>
  );

  // 将 SpeechToTextStore 的状态映射到 ProcessingState
  const speechProcessingState: ProcessingState = {
    isProcessing: isProcessingSpeech,
    progress: progressSpeech,
    currentStep: currentStepSpeech,
    error: errorSpeech,
    outputFile: resultSpeech ? new Blob([resultSpeech], { type: 'text/plain' }) : null,
    outputFileName: outputFileNameSpeech,
    remainingTime: null
  };

  // 右侧内容
  const rightColumn = (
    <>
      <SpeechToTextControlPanel />

      {(isProcessingSpeech || progressSpeech > 0 || errorSpeech) && (
        <UnifiedProgressDisplay processingState={speechProcessingState} />
      )}
    </>
  );

  return (
    <ProcessorLayout
      title={t('mediaProcessor.functions.speechToText.label')}
      description={t('mediaProcessor.functions.speechToText.description')}
      leftColumn={leftColumn}
      rightColumn={rightColumn}
    />
  );
}
