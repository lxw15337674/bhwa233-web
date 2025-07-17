'use client';

import React, { useRef } from 'react';
import { useParams } from 'next/navigation';
import { useVideoProcessor } from '@/hooks/media-processor/useVideoProcessor';
import { CategoryNavigation } from '@/components/media-processor/CategoryNavigation';
import { FunctionSelector } from '@/components/media-processor/FunctionSelector';
import { UnifiedFileUploadArea } from '@/components/media-processor/UnifiedFileUploadArea';
import { UnifiedMediaMetadataCard } from '@/components/media-processor/UnifiedMediaMetadataCard';
import { UnifiedProgressDisplay } from '@/components/media-processor/UnifiedProgressDisplay';
import { UnifiedOutputPreview } from '@/components/media-processor/UnifiedOutputPreview';
import { getFunctionById } from '@/config/processor-functions';

export const VideoProcessorView: React.FC = () => {
  const params = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLVideoElement>(null);

  const {
    // 状态
    selectedFile,
    mediaMetadata,
    audioInfo,
    currentFunction,
    isProcessing,
    processingState,
    ffmpegLoaded,
    isAnalyzing,
    analyzeError,
    dragOver,

    // 视频功能
    videoFunctions,

    // 操作
    handleFileSelect,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    handleFunctionChange,
    reset,
    handleRetryAnalysis,
  } = useVideoProcessor();

  // 根据URL参数设置功能
  React.useEffect(() => {
    if (params.function && typeof params.function === 'string') {
      const func = getFunctionById(params.function);
      if (func && func.category === 'video') {
        handleFunctionChange(params.function);
      }
    }
  }, [params.function, handleFunctionChange]);

  // 当前功能配置
  const currentFunctionConfig = getFunctionById(currentFunction);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <div className="min-h-screen text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 分类导航 */}
        <CategoryNavigation
          currentCategory="video"
          onCategoryChange={(category) => {
            // 在独立视图中，分类变更将导航到对应页面
            window.location.href = `/media/${category}`;
          }}
        />

        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {currentFunctionConfig?.label || '视频处理器'}
          </h1>
          <p className="text-muted-foreground">
            {currentFunctionConfig?.description || '选择视频处理功能'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：文件上传和媒体信息 */}
          <div className="lg:col-span-2 space-y-6">
            <UnifiedFileUploadArea
              selectedFile={selectedFile}
              category="video"
              dragOver={dragOver}
              onFileSelect={handleFileSelect}
              onReset={reset}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onFileInputChange={handleFileInputChange}
              fileInputRef={fileInputRef}
              disabled={isProcessing}
            />

            <UnifiedMediaMetadataCard
              selectedFile={selectedFile}
              mediaMetadata={mediaMetadata}
              isAnalyzing={isAnalyzing}
              analyzeError={analyzeError}
              ffmpegLoaded={ffmpegLoaded}
              onRetryAnalysis={handleRetryAnalysis}
            />
          </div>

          {/* 右侧：控制面板 */}
          <div className="space-y-6">
            {/* 功能选择器 */}
            <FunctionSelector
              disabled={isProcessing}
            />

            {/* 动态控制面板 */}
            {currentFunctionConfig && (
              <currentFunctionConfig.component
                selectedFile={selectedFile}
                mediaMetadata={mediaMetadata}
                audioInfo={audioInfo}
                ffmpeg={null}
                isMultiThread={false}
                ffmpegLoaded={ffmpegLoaded}
                isAnalyzing={isAnalyzing}
                analyzeError={analyzeError}
                onRetryAnalysis={handleRetryAnalysis}
                onStateChange={(state) => {
                  // 状态管理将通过props传递
                }}
                onOutputReady={(blob, filename) => {
                  // 输出处理将通过props传递
                }}
              />
            )}

            {/* 处理进度 */}
            <UnifiedProgressDisplay
              processingState={processingState}
              messageRef={messageRef}
            />

            {/* 输出文件预览 */}
            {processingState.outputFile && (
              <UnifiedOutputPreview
                outputFile={processingState.outputFile}
                outputFileName={processingState.outputFileName}
                mediaType="video"
                mediaRef={mediaRef}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};