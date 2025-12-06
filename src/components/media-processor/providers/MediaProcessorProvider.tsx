'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { useFFmpegManager } from '@/hooks/useFFmpeg';
import { ffmpegManager } from '@/lib/ffmpeg-instance';

interface MediaProcessorContextType {
  ffmpeg: FFmpeg | null;
  isMultiThread: boolean;
  ffmpegLoaded: boolean;
  ffmpegLoading: boolean;
  ffmpegError: string | null;
  initFFmpeg: () => Promise<void>;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  mediaMetadata: any | null;
  setMediaMetadata: (metadata: any) => void;
  audioInfo: any | null;
  setAudioInfo: (info: any) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (analyzing: boolean) => void;
  analyzeError: string | null;
  setAnalyzeError: (error: string | null) => void;
}

const MediaProcessorContext = createContext<MediaProcessorContextType | undefined>(undefined);

export const useMediaProcessor = () => {
  const context = useContext(MediaProcessorContext);
  if (!context) {
    throw new Error('useMediaProcessor must be used within a MediaProcessorProvider');
  }
  return context;
};

interface MediaProcessorProviderProps {
  children: ReactNode;
}

export const MediaProcessorProvider: React.FC<MediaProcessorProviderProps> = ({ children }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaMetadata, setMediaMetadata] = useState<any | null>(null);
  const [audioInfo, setAudioInfo] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // 使用 FFmpeg 管理 hook
  const {
    ffmpeg,
    isMultiThread,
    ffmpegLoaded,
    ffmpegLoading,
    ffmpegError,
    initFFmpeg
  } = useFFmpegManager();

  // 当选中文件变化时，自动清理之前的元数据
  useEffect(() => {
    if (!selectedFile) {
      setMediaMetadata(null);
      setAudioInfo(null);
      setAnalyzeError(null);
    }
  }, [selectedFile]);

  const contextValue: MediaProcessorContextType = {
    ffmpeg,
    isMultiThread,
    ffmpegLoaded,
    ffmpegLoading,
    ffmpegError,
    initFFmpeg,
    selectedFile,
    setSelectedFile,
    mediaMetadata,
    setMediaMetadata,
    audioInfo,
    setAudioInfo,
    isAnalyzing,
    setIsAnalyzing,
    analyzeError,
    setAnalyzeError
  };

  return (
    <MediaProcessorContext.Provider value={contextValue}>
      {children}
    </MediaProcessorContext.Provider>
  );
};