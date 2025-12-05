import { useProcessingTask } from './common/useProcessingTask';
import { ProcessingState as AppProcessingState } from '@/types/media-processor';
import { useCallback } from 'react';

export const useMediaProcessing = () => {
  const {
    state,
    start,
    updateProgress: updateTaskProgress,
    complete,
    fail,
    reset
  } = useProcessingTask<{ file: Blob; name: string }>();

  const processingState: AppProcessingState = {
    isProcessing: state.status === 'processing',
    progress: state.progress,
    currentStep: state.message,
    error: state.error?.message || null,
    outputFile: state.result?.file || null,
    outputFileName: state.result?.name || '',
    remainingTime: null, // Info merged into currentStep (message)
  };

  const startProcessing = useCallback(() => {
    start('准备处理...');
  }, [start]);

  const finishProcessing = useCallback((outputFile: Blob, outputFileName: string) => {
    complete({ file: outputFile, name: outputFileName }, '处理完成！');
  }, [complete]);

  const setError = useCallback((error: string) => {
    fail(new Error(error), '处理失败');
  }, [fail]);

  const updateProgress = useCallback((progress: number, step: string, remainingTime?: string) => {
    const message = remainingTime ? `${step} (剩余: ${remainingTime})` : step;
    updateTaskProgress(progress, message);
  }, [updateTaskProgress]);

  const resetState = useCallback(() => {
    reset();
  }, [reset]);

  return {
    processingState,
    startProcessing,
    finishProcessing,
    setError,
    updateProgress,
    resetState
  };
};
