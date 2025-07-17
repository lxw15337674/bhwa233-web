import { create } from 'zustand';

interface AudioProcessorStore {
  // 基础文件状态
  inputAudio: File | null;
  
  // 媒体元数据
  audioInfo: any | null;
  mediaMetadata: any | null;
  
  // 处理状态
  isAnalyzing: boolean;
  analyzeError: string | null;
  ffmpeg: any | null;
  ffmpegLoaded: boolean;
  ffmpegLoading: boolean;
  ffmpegError: string | null;
  
  // 核心方法
  setInputAudio: (file: File | null) => void;
  validateAudioFile: (file: File) => boolean;
  analyzeAudio: (file: File) => Promise<void>;
  clearAudioData: () => void;
  
  // 状态设置
  setAudioInfo: (info: any) => void;
  setMediaMetadata: (metadata: any) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalyzeError: (error: string | null) => void;
  setFFmpeg: (ffmpeg: any) => void;
  setFFmpegLoaded: (loaded: boolean) => void;
  setFFmpegLoading: (loading: boolean) => void;
  setFFmpegError: (error: string | null) => void;
}

export const useAudioProcessorStore = create<AudioProcessorStore>()((set, get) => ({
  inputAudio: null,
  audioInfo: null,
  mediaMetadata: null,
  isAnalyzing: false,
  analyzeError: null,
  ffmpeg: null,
  ffmpegLoaded: false,
  ffmpegLoading: false,
  ffmpegError: null,
  
  setInputAudio: (file) => set({ inputAudio: file }),
  
  validateAudioFile: (file: File): boolean => {
    const supportedFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '');
  },
  
  analyzeAudio: async (file: File) => {
    const { ffmpeg, setIsAnalyzing, setAnalyzeError, setAudioInfo, setMediaMetadata } = get();
    
    if (!ffmpeg) {
      setAnalyzeError('FFmpeg未初始化');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalyzeError(null);
    
    try {
      // 模拟分析过程，实际实现会根据具体需求调整
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
      
      setAudioInfo(audioInfo);
      setMediaMetadata(mediaMetadata);
    } catch (error) {
      setAnalyzeError(error instanceof Error ? error.message : '分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  },
  
  clearAudioData: () => set({
    inputAudio: null,
    audioInfo: null,
    mediaMetadata: null,
    analyzeError: null,
    isAnalyzing: false,
  }),
  
  setAudioInfo: (info) => set({ audioInfo: info }),
  setMediaMetadata: (metadata) => set({ mediaMetadata: metadata }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setAnalyzeError: (error) => set({ analyzeError: error }),
  setFFmpeg: (ffmpeg) => set({ ffmpeg }),
  setFFmpegLoaded: (loaded) => set({ ffmpegLoaded: loaded }),
  setFFmpegLoading: (loading) => set({ ffmpegLoading: loading }),
  setFFmpegError: (error) => set({ ffmpegError: error }),
}));