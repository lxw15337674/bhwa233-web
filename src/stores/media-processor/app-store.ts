import { create } from 'zustand';
import { ProcessingState } from '@/types/media-processor';
import { MediaMetadata, AudioInfo, analyzeMediaFile } from '@/utils/audioConverter';
import { useFFmpegStore } from '../ffmpeg-store';

// 定义 AppStore 的状态类型
interface AppStore {
  // --- 文件状态 ---
  selectedFile: File | null;
  dragOver: boolean;
  
  // --- 媒体元数据 ---
  mediaMetadata: MediaMetadata | null;
  audioInfo: AudioInfo | null;
  
  // --- 分析状态 ---
  isAnalyzing: boolean;
  analyzeError: string | null;

  // --- 处理状态 (Progress & Result) ---
  processingState: ProcessingState;

  // --- Actions ---
  // 文件操作
  setSelectedFile: (file: File | null) => void;
  setDragOver: (isDragOver: boolean) => void;
  
  // 分析操作
  analyzeMedia: (file: File) => Promise<void>;
  
  // 处理操作
  updateProcessingState: (updates: Partial<ProcessingState>) => void;
  setProcessingError: (error: string) => void;
  startProcessing: () => void;
  finishProcessing: (outputFile: Blob, outputFileName: string) => void;

  // 重置
  reset: () => void;
}

const initialProcessingState: ProcessingState = {
  isProcessing: false,
  progress: 0,
  currentStep: '',
  error: null,
  outputFile: null,
  outputFileName: '',
  remainingTime: null
};

export const useAppStore = create<AppStore>((set, get) => ({
  // --- Initial State ---
  selectedFile: null,
  dragOver: false,
  mediaMetadata: null,
  audioInfo: null,
  isAnalyzing: false,
  analyzeError: null,
  processingState: initialProcessingState,

  // --- Actions ---

  setSelectedFile: (file) => {
    set({ selectedFile: file });
    // 当文件改变时，重置相关状态
    set({ 
      mediaMetadata: null, 
      audioInfo: null, 
      analyzeError: null,
      processingState: initialProcessingState
    });
    // 只对音频文件自动触发分析，视频文件由各自的功能组件处理
    if (file && file.type.startsWith('audio/')) {
      get().analyzeMedia(file);
    }
  },

  setDragOver: (isDragOver) => set({ dragOver: isDragOver }),

  analyzeMedia: async (file) => {
    const { ffmpeg, isLoaded } = useFFmpegStore.getState();

    if (!isLoaded || !ffmpeg) {
      set({ analyzeError: 'FFmpeg 未就绪' });
      return;
    }

    set({ isAnalyzing: true, analyzeError: null });

    try {
      console.log(`[Store] 开始分析文件: ${file.name}`);
      const result = await analyzeMediaFile(file, ffmpeg);
      
      set({ 
        mediaMetadata: result.metadata,
        audioInfo: result.audioInfo,
        isAnalyzing: false 
      });
    } catch (error: any) {
      console.error('[Store] 分析失败:', error);
      set({ 
        isAnalyzing: false, 
        analyzeError: error.message || '文件分析失败' 
      });
    }
  },

  updateProcessingState: (updates) => {
    set((state) => ({
      processingState: { ...state.processingState, ...updates }
    }));
  },

  setProcessingError: (error) => {
    set((state) => ({
      processingState: { 
        ...state.processingState, 
        isProcessing: false, 
        error 
      }
    }));
  },

  startProcessing: () => {
    set((state) => ({
      processingState: { 
        ...initialProcessingState, 
        isProcessing: true 
      }
    }));
  },

  finishProcessing: (outputFile, outputFileName) => {
    set((state) => ({
      processingState: {
        ...state.processingState,
        isProcessing: false,
        progress: 100,
        currentStep: '处理完成',
        outputFile,
        outputFileName
      }
    }));
  },

  reset: () => {
    set({
      selectedFile: null,
      dragOver: false,
      mediaMetadata: null,
      audioInfo: null,
      isAnalyzing: false,
      analyzeError: null,
      processingState: initialProcessingState
    });
  }
}));
