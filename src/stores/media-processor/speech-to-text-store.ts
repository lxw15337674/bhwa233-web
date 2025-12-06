import { create } from 'zustand';
import { FFmpeg } from '@ffmpeg/ffmpeg';

interface SpeechToTextState {
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

  // 语音转文字处理状态
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  result: string;
  outputFileName: string;

  // 操作方法
  startTranscription: (file: File) => void;
  resetState: () => void;

  // 状态更新方法
  updateProcessingState: (updates: Partial<Pick<SpeechToTextState, 'isProcessing' | 'progress' | 'currentStep' | 'error'>>) => void;
  setResult: (result: string) => void;
  setOutputFileName: (name: string) => void;
}

export const useSpeechToTextStore = create<SpeechToTextState>((set, get) => ({
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
    // 这部分将在组件中实现，因为需要使用 useFFmpegManager hook
  },

  // 分析状态
  isAnalyzing: false,
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  analyzeError: null,
  setAnalyzeError: (error) => set({ analyzeError: error }),

  // 语音转文字处理状态
  isProcessing: false,
  progress: 0,
  currentStep: '',
  error: null,
  result: '',
  outputFileName: '',

  // 操作方法
  startTranscription: async (file: File) => {
    if (!file) {
      set({
        error: '请选择音频文件'
      });
      return;
    }

    set({
      isProcessing: true,
      progress: 0,
      currentStep: '正在上传音频文件...',
      error: null,
      result: ''
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      // 上传文件阶段 - 50%
      set({
        progress: 50,
        currentStep: '正在识别音频内容...'
      });

      const response = await fetch('/api/siliconflow/transcribe', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `识别失败: ${response.statusText}`);
      }

      const result = await response.json();

      // 识别完成阶段 - 100%
      set({
        isProcessing: false,
        progress: 100,
        currentStep: '识别完成！',
        result: result.text || result,
        outputFileName: `${file.name.split('.')[0]}.txt`
      });
    } catch (error: any) {
      set({
        isProcessing: false,
        progress: 0,
        error: error.message || '识别失败',
        currentStep: '识别失败'
      });
    }
  },
  resetState: () => {
    set({
      isProcessing: false,
      progress: 0,
      currentStep: '',
      error: null,
      result: '',
      outputFileName: ''
    });
  },

  // 状态更新方法
  updateProcessingState: (updates) => {
    set(updates);
  },
  setResult: (result) => set({ result }),
  setOutputFileName: (name) => set({ outputFileName: name })
}));