import { create } from 'zustand';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { ffmpegManager } from '@/lib/ffmpeg-instance';

interface AudioProcessorStore {
  // 基础文件状态
  inputAudio: File | null;
  
  // 媒体元数据
  audioInfo: any | null;
  mediaMetadata: any | null;
  
  // 处理状态
  isAnalyzing: boolean;
  analyzeError: string | null;

  // FFmpeg 状态
  ffmpeg: FFmpeg | null;
  isMultiThread: boolean;
  ffmpegLoaded: boolean;
  ffmpegLoading: boolean;
  ffmpegError: string | null;
  
  // 核心方法
  setInputAudio: (file: File | null) => void;
  validateAudioFile: (file: File) => boolean;
  initFFmpeg: () => Promise<void>;
  analyzeAudio: (file: File) => Promise<void>;
  clearAudioData: () => void;
  
  // 状态设置
  setAudioInfo: (info: any) => void;
  setMediaMetadata: (metadata: any) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalyzeError: (error: string | null) => void;
}

export const useAudioProcessorStore = create<AudioProcessorStore>()((set, get) => ({
  inputAudio: null,
  audioInfo: null,
  mediaMetadata: null,
  isAnalyzing: false,
  analyzeError: null,
  ffmpeg: null,
  isMultiThread: false,
  ffmpegLoaded: false,
  ffmpegLoading: false,
  ffmpegError: null,
  
  setInputAudio: (file) => set({ inputAudio: file }),
  
  validateAudioFile: (file: File): boolean => {
    const supportedFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '');
  },
  
  initFFmpeg: async () => {
    const { ffmpegLoaded, ffmpegLoading } = get();

    // 已加载或正在加载，直接返回
    if (ffmpegLoaded || ffmpegLoading) {
      return;
    }

    set({ ffmpegLoading: true, ffmpegError: null });

    try {
      const result = await ffmpegManager.getInstance();
      set({
        ffmpeg: result.ffmpeg,
        isMultiThread: result.isMultiThread,
        ffmpegLoaded: true,
        ffmpegLoading: false
      });

      // FFmpeg 加载完成后，如果有待分析的文件，自动分析
      const { inputAudio, audioInfo } = get();
      if (inputAudio && !audioInfo) {
        get().analyzeAudio(inputAudio);
      }
    } catch (error) {
      set({
        ffmpegError: error instanceof Error ? error.message : 'FFmpeg 加载失败',
        ffmpegLoading: false
      });
    }
  },

  analyzeAudio: async (file: File) => {
    const { ffmpeg } = get();
    
    if (!ffmpeg) {
      set({ analyzeError: 'FFmpeg未初始化' });
      return;
    }
    
    set({ isAnalyzing: true, analyzeError: null });
    
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
      
      set({ audioInfo, mediaMetadata });
    } catch (error) {
      set({ analyzeError: error instanceof Error ? error.message : '分析失败' });
    } finally {
      set({ isAnalyzing: false });
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
}));