import { useState, useCallback } from 'react';

export type ProcessingStatus = 'idle' | 'processing' | 'success' | 'error';

export interface ProcessingState<TResult, TError = Error> {
  status: ProcessingStatus;
  progress: number;
  message: string;
  result: TResult | null;
  error: TError | null;
}

export interface UseProcessingTaskOptions<TResult, TError> {
  initialState?: Partial<ProcessingState<TResult, TError>>;
  onSuccess?: (result: TResult) => void;
  onError?: (error: TError) => void;
}

export function useProcessingTask<TResult = unknown, TError = Error>(
  options: UseProcessingTaskOptions<TResult, TError> = {}
) {
  const [state, setState] = useState<ProcessingState<TResult, TError>>({
    status: 'idle',
    progress: 0,
    message: '',
    result: null,
    error: null,
    ...options.initialState,
  });

  const start = useCallback((message = 'Starting...') => {
    setState((prev) => ({
      ...prev,
      status: 'processing',
      progress: 0,
      message,
      error: null,
      result: null,
    }));
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setState((prev) => ({
      ...prev,
      status: 'processing',
      progress,
      message: message ?? prev.message,
    }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      message,
    }));
  }, []);

  const complete = useCallback((result: TResult, message = 'Completed') => {
    setState((prev) => ({
      ...prev,
      status: 'success',
      progress: 100,
      message,
      result,
    }));
    options.onSuccess?.(result);
  }, [options]);

  const fail = useCallback((error: TError, message = 'Failed') => {
    setState((prev) => ({
      ...prev,
      status: 'error',
      message,
      error,
    }));
    options.onError?.(error);
  }, [options]);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      progress: 0,
      message: '',
      result: null,
      error: null,
      ...options.initialState,
    });
  }, [options.initialState]);

  return {
    state,
    start,
    updateProgress,
    updateMessage,
    complete,
    fail,
    reset,
  };
}
