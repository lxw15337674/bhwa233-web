import { create } from 'zustand';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { ProcessingState } from '@/types/media-processor';

interface AudioSpeedState {
  // 文件状态
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;

  // 媒体元数据
  audioInfo: any | null;
  setAudioInfo: (info: any) => void;
  mediaMetadata: any | null;
  setMediaMetadata: (metadata: any) => void;

  // FFmpeg 状态
  ffmpeg: FFmpeg | null;
  isMultiThread: boolean;
  ffmpegLoaded: boolean;
  ffmpegLoading: boolean;
  ffmpegError: string | null;
  initFFmpeg: () => Promise<void>;

  // 分析状态
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  analyzeError: string | null;
  setAnalyzeError: (error: string | null) => void;

  // 音频速度调整参数
  speed: number;
  setSpeed: (speed: number) => void;

  // 处理状态
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  outputFile: Blob | null;
  outputFileName: string;
  remainingTime: string | null;
  
  // 操作方法
  startSpeedChange: (file: File) => void;
  resetState: () => void;
  
  // 状态更新方法
  updateProcessingState: (updates: Partial<ProcessingState>) => void;
}

export const useAudioSpeedStore = create<AudioSpeedState>((set, get) => ({
  // 文件状态
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),

  // 媒体元数据
  audioInfo: null,
  setAudioInfo: (info) => set({ audioInfo: info }),
  mediaMetadata: null,
  setMediaMetadata: (metadata) => set({ mediaMetadata: metadata }),

  // FFmpeg 状态
  ffmpeg: null,
  isMultiThread: false,
  ffmpegLoaded: false,
  ffmpegLoading: false,
  ffmpegError: null,
  initFFmpeg: async () => {
    // 这部分将在组件中实现
  },

  // 分析状态
  isAnalyzing: false,
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  analyzeError: null,
  setAnalyzeError: (error) => set({ analyzeError: error }),

  // 音频速度调整参数
  speed: 1.0,
  setSpeed: (speed) => set({ speed }),

  // 处理状态
  isProcessing: false,
  progress: 0,
  currentStep: '',
  error: null,
  outputFile: null,
  outputFileName: '',
  remainingTime: null,
  
  // 操作方法
  startSpeedChange: (file: File) => {
    // 实际的速度调整逻辑会在组件中处理，这里只更新状态
    set({
      isProcessing: true,
      progress: 0,
      currentStep: '开始调整速度',
      error: null
    });
  },
  resetState: () => {
    set({
      isProcessing: false,
      progress: 0,
      currentStep: '',
      error: null,
      outputFile: null,
      outputFileName: '',
      remainingTime: null,
      speed: 1.0
    });
  },
  
  // 状态更新方法
  updateProcessingState: (updates) => {
    set({
      isProcessing: updates.isProcessing ?? get().isProcessing,
      progress: updates.progress ?? get().progress,
      currentStep: updates.currentStep ?? get().currentStep,
      error: updates.error ?? get().error,
      outputFile: updates.outputFile ?? get().outputFile,
      outputFileName: updates.outputFileName ?? get().outputFileName,
      remainingTime: updates.remainingTime ?? get().remainingTime
    });
  }
}));