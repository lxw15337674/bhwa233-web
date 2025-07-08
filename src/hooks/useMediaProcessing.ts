import { useState, useCallback } from 'react';
import { ProcessingState } from '@/types/media-processor';

export const useMediaProcessing = () => {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    error: null,
    outputFile: null,
    outputFileName: '',
    remainingTime: null
  });

  const startProcessing = useCallback(() => {
    setProcessingState({
      isProcessing: true,
      progress: 0,
      currentStep: '准备处理...',
      error: null,
      outputFile: null,
      outputFileName: '',
      remainingTime: null
    });
  }, []);

  const finishProcessing = useCallback((outputFile: Blob, outputFileName: string) => {
    setProcessingState(prev => ({
      ...prev,
      isProcessing: false,
      progress: 100,
      currentStep: '处理完成！',
      outputFile,
      outputFileName,
      remainingTime: null
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setProcessingState(prev => ({
      ...prev,
      isProcessing: false,
      error,
      currentStep: '处理失败'
    }));
  }, []);

  const updateProgress = useCallback((progress: number, step: string, remainingTime?: string) => {
    setProcessingState(prev => ({
      ...prev,
      progress,
      currentStep: step,
      remainingTime: remainingTime || null
    }));
  }, []);

  const resetState = useCallback(() => {
    setProcessingState({
      isProcessing: false,
      progress: 0,
      currentStep: '',
      error: null,
      outputFile: null,
      outputFileName: '',
      remainingTime: null
    });
  }, []);

  return {
    processingState,
    startProcessing,
    finishProcessing,
    setError,
    updateProgress,
    resetState
  };
};