'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BaseFileUpload } from '@/components/media-processor/shared/BaseFileUpload';
import { BaseMediaMetadataCard } from '@/components/media-processor/shared/BaseMediaMetadataCard';
import { BaseProgressDisplay } from '@/components/media-processor/shared/BaseProgressDisplay';
import { AudioConvertControlPanel } from '@/components/media-processor/control-panels/AudioConvertControlPanel';
import { ProcessingState } from '@/types/media-processor';
import { Download, FileAudio } from 'lucide-react';
import { useAudioConvertStore } from '@/stores/media-processor/audio-convert-store';
import { useAppStore } from '@/stores/media-processor/app-store';

interface AudioConvertPageWrapperProps {}

// 内部组件，使用 Zustand Store 提供的状态
const AudioConvertPageContent: React.FC<AudioConvertPageWrapperProps> = () => {
  const selectedFile = useAppStore(state => state.selectedFile);
  const setSelectedFile = useAppStore(state => state.setSelectedFile);
  const mediaMetadata = useAppStore(state => state.mediaMetadata);
  const ffmpeg = useAppStore(state => state.ffmpeg);
  const ffmpegLoaded = useAppStore(state => state.ffmpegLoaded);
  const initFFmpeg = useAppStore(state => state.initFFmpeg);
  const isAnalyzing = useAppStore(state => state.isAnalyzing);
  const analyzeError = useAppStore(state => state.analyzeError);
  const analyzeMedia = useAppStore(state => state.analyzeMedia);
  const clearFile = useAppStore(state => state.clearFile);
  const dragOver = useAppStore(state => state.dragOver);
  const handleDragEnter = useAppStore(state => state.handleDragEnter);
  const handleDragLeave = useAppStore(state => state.handleDragLeave);
  const handleDrop = useAppStore(state => state.handleDrop);

  // 使用独立的状态管理
  const {
    isProcessing,
    progress,
    currentStep,
    error,
    outputFile,
    outputFileName,
    resetState,
    updateProcessingState
  } = useAudioConvertStore();

  // 初始化 FFmpeg
  useEffect(() => {
    if (!ffmpegLoaded && !ffmpeg) {
      initFFmpeg();
    }
  }, [ffmpegLoaded, ffmpeg, initFFmpeg]);

  // 当选择文件且 FFmpeg 加载完成后，自动分析
  useEffect(() => {
    if (selectedFile && ffmpegLoaded && !mediaMetadata && !isAnalyzing) {
      analyzeMedia(selectedFile);
    }
  }, [selectedFile, ffmpegLoaded, mediaMetadata, isAnalyzing, analyzeMedia]);

  const handleFileSelect = (file: File) => {
    // 验证音频文件类型
    const supportedFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma', 'aiff'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedFormats.includes(extension)) {
      alert(`不支持的文件格式。支持的格式: ${supportedFormats.join(', ')}`);
      return;
    }

    setSelectedFile(file);
    updateProcessingState({
      error: null,
      outputFile: null
    });

    // 重置处理状态
    updateProcessingState({
      isProcessing: false,
      progress: 0,
      currentStep: ''
    });
  };

  const handleReset = () => {
    clearFile();
    setSelectedFile(null);
    resetState();
  };

  const handleRetryAnalysis = () => {
    if (selectedFile && ffmpeg) {
      analyzeMedia(selectedFile);
    }
  };

  // 处理控制面板状态变化
  const handleStateChange = (updates: Partial<ProcessingState>) => {
    updateProcessingState(updates);
  };

  // 处理输出文件就绪
  const handleOutputReady = (blob: Blob, filename: string) => {
    updateProcessingState({
      outputFile: blob,
      outputFileName: filename
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          音频格式转换
        </h1>
        <p className="text-muted-foreground">
          将音频文件转换为不同的格式和质量
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：文件上传和媒体信息 */}
        <div className="lg:col-span-2 space-y-6">
          <BaseFileUpload
            selectedFile={selectedFile}
            onFileSelect={handleFileSelect}
            onReset={handleReset}
            disabled={isProcessing}
            supportedFormats={['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'aiff']}
            accept=".mp3,.wav,.aac,.flac,.ogg,.wma,.aiff,.m4a"
          />

          <BaseMediaMetadataCard
            selectedFile={selectedFile}
            mediaMetadata={mediaMetadata}
            isAnalyzing={isAnalyzing}
            analyzeError={analyzeError}
            ffmpegLoaded={ffmpegLoaded}
            onRetryAnalysis={handleRetryAnalysis}
          />
        </div>

        {/* 右侧：控制面板、进度和输出 */}
        <div className="space-y-6">
          <AudioConvertControlPanel
            selectedFile={selectedFile}
            mediaMetadata={mediaMetadata}
            ffmpeg={ffmpeg || null}
            ffmpegLoaded={ffmpegLoaded}
            isAnalyzing={isAnalyzing}
            analyzeError={analyzeError}
            onRetryAnalysis={handleRetryAnalysis}
            onStateChange={handleStateChange}
            onOutputReady={handleOutputReady}
          />

          {/* 处理进度 */}
          <BaseProgressDisplay
            processingState={{
              isProcessing,
              progress,
              currentStep,
              error,
              outputFile,
              outputFileName,
              remainingTime: null
            }}
          />

          {/* 输出文件预览 */}
          {outputFile && (
            <BaseOutputPreview
              outputFile={outputFile}
              outputFileName={outputFileName}
              mediaType="audio"
            />
          )}
        </div>
      </div>
    </div>
  );
};

const AudioConvertPageWrapper: React.FC<AudioConvertPageWrapperProps> = () => {
  return <AudioConvertPageContent />;
};

export default function AudioConvertPage() {
  return <AudioConvertPageWrapper />;
}