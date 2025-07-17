import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { TextProcessorState, TextProcessorActions } from './types';
import { getDefaultFunction } from '../../config/processor-functions';

const initialProcessingState = {
  isProcessing: false,
  progress: 0,
};

const initialState: TextProcessorState = {
  // 处理状态
  isProcessing: false,
  processingState: initialProcessingState,
  // 文本功能
  inputText: '',
};

export const useTextProcessorStore = create<TextProcessorState & TextProcessorActions>()(
  devtools(
    immer((set) => ({
      ...initialState,
      resetProcessing: () => set((state) => {
        state.processingState = initialProcessingState;
        state.isProcessing = false;
      }),
      setInputText: (text) => set((state) => {
        state.inputText = text;
      }),

      clearTextData: () => set((state) => {
        state.inputText = '';
      }),

      reset: () => set(initialState),
    })),
    {
      name: 'text-processor-store',
    }
  )
);