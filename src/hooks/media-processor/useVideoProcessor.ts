import { useEffect } from 'react';
import { useVideoProcessorStore } from '@/stores/media-processor/video-store';
import { useFFmpegManager } from '@/hooks/useAudioConverter';
import { useUnifiedMediaAnalysis } from '@/hooks/useUnifiedMediaAnalysis';
import { useFileSelection } from '@/hooks/useAudioConverter';
import { getFunctionsByCategory } from '@/config/processor-functions';

export const useVideoProcessor = () => {
  // Zustand store
  const store = useVideoProcessorStore();
  
  // 现有hooks
  const {
    ffmpeg,
    ffmpegLoaded,
    ffmpegLoading,
    ffmpegError,
    initFFmpeg
  } = useFFmpegManager();

  const {
    selectedFile: fileSelectionFile,
    dragOver,
    selectFile,
    clearFile,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  } = useFileSelection();

  const {
    audioInfo,
    mediaMetadata,
    isAnalyzing,
    analyzeError,
    analyzeMedia
  } = useUnifiedMediaAnalysis(ffmpeg || null);

  // 同步现有hooks到store
  useEffect(() => {
    store.setFFmpeg(ffmpeg || null);
  }, [ffmpeg, store]);

  useEffect(() => {
    store.setFFmpegLoaded(ffmpegLoaded);
  }, [ffmpegLoaded, store]);

  useEffect(() => {
    store.setFFmpegLoading(ffmpegLoading);
  }, [ffmpegLoading, store]);

  useEffect(() => {
    store.setFFmpegError(ffmpegError || null);
  }, [ffmpegError, store]);

  useEffect(() => {
    store.setIsAnalyzing(isAnalyzing);
  }, [isAnalyzing, store]);

  useEffect(() => {
    store.setAnalyzeError(analyzeError);
  }, [analyzeError, store]);

  useEffect(() => {
    store.setAudioInfo(audioInfo);
  }, [audioInfo, store]);

  useEffect(() => {
    store.setMediaMetadata(mediaMetadata);
  }, [mediaMetadata, store]);

  useEffect(() => {
    store.setSelectedFile(fileSelectionFile);
  }, [fileSelectionFile, store]);

  // 视频功能列表
  const videoFunctions = getFunctionsByCategory('video');

  // 验证视频文件类型
  const validateVideoFile = (file: File): boolean => {
    const supportedFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '');
  };

  // 处理文件选择
  const handleFileSelect = (file: File) => {
    if (!validateVideoFile(file)) {
      store.setError('不支持的视频格式。支持的格式: mp4, mov, avi, mkv, webm, flv, m4v');
      return;
    }

    selectFile(file);
    store.resetProcessing();

    // 如果 FFmpeg 已加载，立即开始分析
    if (ffmpeg) {
      analyzeMedia(file);
    }
  };

  // 处理功能切换
  const handleFunctionChange = (functionId: string) => {
    store.setCurrentFunction(functionId);
    store.resetProcessing();
  };

  // 重置所有状态
  const reset = () => {
    clearFile();
    store.reset();
  };

  // 重试分析
  const handleRetryAnalysis = () => {
    if (store.selectedFile && ffmpeg) {
      analyzeMedia(store.selectedFile);
    }
  };

  return {
    // 状态
    ...store,
    
    // 视频功能
    videoFunctions,
    
    // 文件处理
    handleFileSelect,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    
    // 功能处理
    handleFunctionChange,
    
    // 操作
    reset,
    handleRetryAnalysis,
    initFFmpeg,
    
    // 额外状态
    dragOver,
  };
};