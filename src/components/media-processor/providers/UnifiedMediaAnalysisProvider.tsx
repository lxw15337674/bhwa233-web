'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUnifiedMediaAnalysis } from '@/hooks/useUnifiedMediaAnalysis';
import { FFmpeg } from '@ffmpeg/ffmpeg';

interface UnifiedMediaAnalysisProviderType {
  audioInfo: any | null;
  mediaMetadata: any | null;
  isAnalyzing: boolean;
  analyzeError: string | null;
  analyzeMedia: (file: File) => void;
  resetAnalysis: () => void;
}

const UnifiedMediaAnalysisContext = createContext<UnifiedMediaAnalysisProviderType | undefined>(undefined);

export const useUnifiedMediaAnalysisContext = () => {
  const context = useContext(UnifiedMediaAnalysisContext);
  if (!context) {
    throw new Error('useUnifiedMediaAnalysisContext must be used within a UnifiedMediaAnalysisProvider');
  }
  return context;
};

interface UnifiedMediaAnalysisProviderProps {
  ffmpeg: FFmpeg | null;
  children: ReactNode;
}

export const UnifiedMediaAnalysisProvider: React.FC<UnifiedMediaAnalysisProviderProps> = ({ 
  ffmpeg,
  children 
}) => {
  const {
    audioInfo,
    mediaMetadata,
    isAnalyzing,
    analyzeError,
    analyzeMedia
  } = useUnifiedMediaAnalysis(ffmpeg);

  const resetAnalysis = () => {
    // 重置分析结果
    // 注意：由于 useUnifiedMediaAnalysis hook 内部状态无法直接重置
    // 我们需要重新触发分析或提供其他方式
  };

  const contextValue: UnifiedMediaAnalysisProviderType = {
    audioInfo,
    mediaMetadata,
    isAnalyzing,
    analyzeError,
    analyzeMedia,
    resetAnalysis
  };

  return (
    <UnifiedMediaAnalysisContext.Provider value={contextValue}>
      {children}
    </UnifiedMediaAnalysisContext.Provider>
  );
};