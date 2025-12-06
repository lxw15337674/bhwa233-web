'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BaseFileUpload } from '@/components/media-processor/shared/BaseFileUpload';
import { BaseMediaMetadataCard } from '@/components/media-processor/shared/BaseMediaMetadataCard';
import { BaseProgressDisplay } from '@/components/media-processor/shared/BaseProgressDisplay';
import { SpeechToTextControlPanel } from '@/components/media-processor/control-panels/SpeechToTextControlPanel';
import { ProcessingState } from '@/types/media-processor';
import { Copy, Download, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useSpeechToTextStore } from '@/stores/media-processor/speech-to-text-store';
import { useAppStore } from '@/stores/media-processor/app-store';

interface SpeechToTextPageWrapperProps {}

// 内部组件，使用 Zustand Store 提供的状态
const SpeechToTextPageContent: React.FC<SpeechToTextPageWrapperProps> = () => {
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
    result,
    outputFileName,
    startTranscription,
    resetState,
    updateProcessingState,
    setResult,
    setOutputFileName
  } = useSpeechToTextStore();

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
    const supportedFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedFormats.includes(extension)) {
      alert(`不支持的文件格式。支持的格式: ${supportedFormats.join(', ')}`);
      return;
    }

    setSelectedFile(file);
    setResult('');
    updateProcessingState({ error: null });

    // 重置处理状态
    updateProcessingState({
      isProcessing: false,
      progress: 0,
      currentStep: ''
    });
  };

  const handlePaste = (e: ClipboardEvent) => {
    // 这里处理粘贴逻辑，暂时为空
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
    setOutputFileName(filename);
  };

  const handleDownload = () => {
    if (result) {
      const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName || 'transcription.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyToClipboard = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result);
        // 可以添加一个toast提示
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          语音转文字
        </h1>
        <p className="text-muted-foreground">
          将音频文件转换为文字，支持自动语言检测
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
            supportedFormats={['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a']}
            accept=".mp3,.wav,.aac,.flac,.ogg,.m4a"
            onPasteFromClipboard={handlePaste}
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
          <SpeechToTextControlPanel
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
              outputFile: null,
              outputFileName: '',
              remainingTime: null
            }}
          />

          {/* 识别结果展示 */}
          {result && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    识别结果
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopyToClipboard}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Textarea
                  value={result}
                  readOnly
                  className="min-h-[300px] resize-none bg-muted/30 border-muted"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  文件将保存为: {outputFileName || 'transcription.txt'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const SpeechToTextPageWrapper: React.FC<SpeechToTextPageWrapperProps> = () => {
  return <SpeechToTextPageContent />;
};

export default function SpeechToTextPage() {
  return <SpeechToTextPageWrapper />;
}