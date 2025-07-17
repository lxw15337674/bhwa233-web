// 文本处理器状态（精简版，仅与 text-store.ts 保持一致）
export interface TextProcessorState {
  isProcessing: boolean;
  processingState: {
    isProcessing: boolean;
    progress: number;
  };
  inputText: string;
}

export interface TextProcessorActions {
  setInputText: (text: string) => void;
  clearTextData: () => void;
  reset: () => void;
  resetProcessing: () => void;
}