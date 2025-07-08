import { useState, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { AudioInfo, MediaMetadata, analyzeMediaFile } from '@/utils/audioConverter';

export const useUnifiedMediaAnalysis = (ffmpeg: FFmpeg | null) => {
  const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
  const [mediaMetadata, setMediaMetadata] = useState<MediaMetadata | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const analyzeMedia = useCallback(async (file: File) => {
    if (!ffmpeg) {
      setAnalyzeError('FFmpeg 未加载');
      return;
    }

    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAudioInfo(null);
    setMediaMetadata(null);

    try {
      const result = await analyzeMediaFile(file, ffmpeg);
      setAudioInfo(result.audioInfo);
      setMediaMetadata(result.metadata);
    } catch (error) {
      console.error('媒体分析失败:', error);
      setAnalyzeError(error instanceof Error ? error.message : '分析失败');
    } finally {
      setIsAnalyzing(false);
    }
  }, [ffmpeg]);

  const resetAnalysis = useCallback(() => {
    setAudioInfo(null);
    setMediaMetadata(null);
    setAnalyzeError(null);
    setIsAnalyzing(false);
  }, []);

  return {
    audioInfo,
    mediaMetadata,
    isAnalyzing,
    analyzeError,
    analyzeMedia,
    resetAnalysis
  };
}; 