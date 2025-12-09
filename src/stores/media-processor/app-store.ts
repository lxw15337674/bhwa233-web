import { create } from 'zustand';

// 定义 AppStore 的状态类型
interface AppStore {
  // 基础文件状态 (来自原来的 audio-store)
  inputAudio: File | null;
  setInputAudio: (file: File | null) => void;
  validateAudioFile: (file: File) => boolean;

  // 文件状态
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;

  // 媒体元数据
  audioInfo: any | null;
  setAudioInfo: (info: any) => void;
  mediaMetadata: any | null;
  setMediaMetadata: (metadata: any) => void;

  // 文件选择状态
  dragOver: boolean;
  selectFile: (file: File) => void;
  clearFile: () => void;
  handleDragEnter: () => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;

  // 媒体分析状态 (来自原来的 audio-store)
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  analyzeError: string | null;
  setAnalyzeError: (error: string | null) => void;
  analyzeMedia: (file: File, ffmpeg: any) => void; // ffmpeg instance now passed as parameter

  // 原来 audio-store 的其他方法 (来自原来的 audio-store)
  clearAudioData: () => void;

  // 重置函数
  resetAll: () => void;
}

// 创建全局状态 store
export const useAppStore = create<AppStore>((set, get) => ({
  // 基础文件状态 (来自原来的 audio-store)
  inputAudio: null,
  setInputAudio: (file) => set({ inputAudio: file }),
  validateAudioFile: (file: File): boolean => {
    const supportedFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '');
  },

  // 文件状态
  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),

  // 媒体元数据
  audioInfo: null,
  setAudioInfo: (info) => set({ audioInfo: info }),
  mediaMetadata: null,
  setMediaMetadata: (metadata) => set({ mediaMetadata: metadata }),

  // FFmpeg 状态 (removed from here, now in ffmpeg-store)

  // 文件选择状态
  dragOver: false,
  selectFile: (file) => {
    // 验证音频文件类型（这里简化为只允许音频文件）
    set({ selectedFile: file, inputAudio: file });
  },
  clearFile: () => set({
    selectedFile: null,
    inputAudio: null,
    audioInfo: null,
    mediaMetadata: null,
    analyzeError: null,
    isAnalyzing: false,
  }),
  handleDragEnter: () => set({ dragOver: true }),
  handleDragLeave: () => set({ dragOver: false }),
  handleDrop: (e) => {
    e.preventDefault();
    e.stopPropagation();
    set({ dragOver: false });

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      get().selectFile(file);
    }
  },

  // 媒体分析状态
  isAnalyzing: false,
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  analyzeError: null,
  setAnalyzeError: (error) => set({ analyzeError: error }),
  analyzeMedia: async (file: File, ffmpeg: any) => { // ffmpeg instance passed here
    if (!ffmpeg) {
      set({ analyzeError: 'FFmpeg未初始化' });
      return;
    }

    set({ isAnalyzing: true, analyzeError: null });

    try {
      // 模拟分析过程，实际实现会根据具体需求调整
      // Note: In real scenarios, this would call actual ffmpeg analysis utility
      // For now, it's a mock or will be replaced by actual utility calls that use the passed ffmpeg instance.
      const audioInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };

      const mediaMetadata = {
        duration: 0,
        bitrate: 0,
        format: file.name.split('.').pop(),
      };

      set({ audioInfo, mediaMetadata, inputAudio: file });
    } catch (error) {
      set({ analyzeError: error instanceof Error ? error.message : '分析失败' });
    } finally {
      set({ isAnalyzing: false });
    }
  },

  // 原来 audio-store 的其他方法
  clearAudioData: () => set({
    inputAudio: null,
    audioInfo: null,
    mediaMetadata: null,
    analyzeError: null,
    isAnalyzing: false,
  }),

  // 重置函数
  resetAll: () => set({
    inputAudio: null,
    selectedFile: null,
    audioInfo: null,
    mediaMetadata: null,
    isAnalyzing: false,
    analyzeError: null,
    dragOver: false,
  })
}));