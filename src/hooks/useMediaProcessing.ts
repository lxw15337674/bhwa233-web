import { useState, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { ProcessingState } from '@/types/media-processor';

export const useMediaProcessing = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    error: null,
    outputFile: null,
    outputFileName: '',
    remainingTime: null,
  });

  const updateState = useCallback((updates: Partial<ProcessingState>) => {
    setProcessingState(prev => ({ ...prev, ...updates }));
  }, []);

  const resetState = useCallback(() => {
    setProcessingState({
      isProcessing: false,
      progress: 0,
      currentStep: '',
      error: null,
      outputFile: null,
      outputFileName: '',
      remainingTime: null,
    });
  }, []);

  const startProcessing = useCallback(() => {
    updateState({
      isProcessing: true,
      progress: 0,
      currentStep: '准备开始...',
      error: null,
      outputFile: null,
      outputFileName: '',
      remainingTime: null,
    });
  }, [updateState]);

  const finishProcessing = useCallback((outputFile: Blob, outputFileName: string) => {
    updateState({
      isProcessing: false,
      progress: 100,
      currentStep: '转换完成',
      outputFile,
      outputFileName,
      remainingTime: null,
    });
  }, [updateState]);

  const setError = useCallback((error: string) => {
    updateState({
      isProcessing: false,
      error,
      progress: 0,
      currentStep: '处理失败',
      remainingTime: null,
    });
  }, [updateState]);

  const updateProgress = useCallback((progress: number, step: string, remainingTime?: string) => {
    updateState({
      progress,
      currentStep: step,
      remainingTime: remainingTime || null,
    });
  }, [updateState]);

  return {
    processingState,
    updateState,
    resetState,
    startProcessing,
    finishProcessing,
    setError,
    updateProgress,
  };
}; 