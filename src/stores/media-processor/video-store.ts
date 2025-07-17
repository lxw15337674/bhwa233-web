import { create } from 'zustand';

interface VideoProcessorStore {
  // 基础文件状态
  inputVideo: File | null;
  
  // 媒体元数据
  videoInfo: any | null;
  mediaMetadata: any | null;
  
  // 处理状态
  isAnalyzing: boolean;
  analyzeError: string | null;
  ffmpeg: any | null;
  ffmpegLoaded: boolean;
  ffmpegLoading: boolean;
  ffmpegError: string | null;
  
  // 核心方法
  setInputVideo: (file: File | null) => void;
  validateVideoFile: (file: File) => boolean;
  analyzeVideo: (file: File) => Promise<void>;
  clearVideoData: () => void;
  
  // 状态设置
  setVideoInfo: (info: any) => void;
  setMediaMetadata: (metadata: any) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setAnalyzeError: (error: string | null) => void;
  setFFmpeg: (ffmpeg: any) => void;
  setFFmpegLoaded: (loaded: boolean) => void;
  setFFmpegLoading: (loading: boolean) => void;
  setFFmpegError: (error: string | null) => void;
}

export const useVideoProcessorStore = create<VideoProcessorStore>()((set, get) => ({
  inputVideo: null,
  videoInfo: null,
  mediaMetadata: null,
  isAnalyzing: false,
  analyzeError: null,
  ffmpeg: null,
  ffmpegLoaded: false,
  ffmpegLoading: false,
  ffmpegError: null,
  
  setInputVideo: (file) => set({ inputVideo: file }),
  
  validateVideoFile: (file: File): boolean => {
    const supportedFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '');
  },
  
  analyzeVideo: async (file: File) => {
    const { ffmpeg, setIsAnalyzing, setAnalyzeError, setVideoInfo, setMediaMetadata } = get();
    
    if (!ffmpeg) {
      setAnalyzeError('FFmpeg未初始化');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalyzeError(null);
    
    try {
      // 模拟分析过程，实际实现会根据具体需求调整
      const videoInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };
      
      const mediaMetadata = {
        duration: 0,
        bitrate: 0,
        format: file.name.split('.').pop(),
        width: 0,
        height: 0,
      };
      
      setVideoInfo(videoInfo);
      setMediaMetadata(mediaMetadata);
    } catch (error) {
      setAnalyzeError(error instanceof Error ? error.message : '分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  },
  
  clearVideoData: () => set({
    inputVideo: null,
    videoInfo: null,
    mediaMetadata: null,
    analyzeError: null,
    isAnalyzing: false,
  }),
  
  setVideoInfo: (info) => set({ videoInfo: info }),
  setMediaMetadata: (metadata) => set({ mediaMetadata: metadata }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setAnalyzeError: (error) => set({ analyzeError: error }),
  setFFmpeg: (ffmpeg) => set({ ffmpeg }),
  setFFmpegLoaded: (loaded) => set({ ffmpegLoaded: loaded }),
  setFFmpegLoading: (loading) => set({ ffmpegLoading: loading }),
  setFFmpegError: (error) => set({ ffmpegError: error }),
}));