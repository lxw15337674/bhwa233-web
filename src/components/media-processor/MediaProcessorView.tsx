'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useMemoizedFn, useSetState, useUpdateEffect } from 'ahooks';

// 导入统一组件
import { CategoryNavigation } from './CategoryNavigation';
import { FunctionSelector } from './FunctionSelector';
import { UnifiedFileUploadArea } from './UnifiedFileUploadArea';
import { UnifiedMediaMetadataCard } from './UnifiedMediaMetadataCard';
import { UnifiedProgressDisplay } from './UnifiedProgressDisplay';
import { UnifiedOutputPreview } from './UnifiedOutputPreview';
import { TextInputArea } from '../../../app/text/[function]/TextInputArea';

// 导入类型和配置
import { ProcessorCategory, MediaProcessorState, ProcessingState } from '@/types/media-processor';
import { getFunctionById, getDefaultFunction } from '@/config/processor-functions';
import { getMediaType, isValidMediaFile } from '@/utils/audioConverter';

// 导入hooks（需要适配现有的hooks）
import { useFFmpegManager, useFileSelection } from '@/hooks/useAudioConverter';
import { useUnifiedMediaAnalysis } from '@/hooks/useUnifiedMediaAnalysis';

interface MediaProcessorViewProps {
  defaultCategory?: ProcessorCategory;
  defaultFunction?: string;
}

export const MediaProcessorView: React.FC<MediaProcessorViewProps> = ({
  defaultCategory = 'video',
  defaultFunction
}) => {
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);

  // 从URL参数获取初始状态
  const urlCategory = searchParams?.get('category') as ProcessorCategory || defaultCategory;
  const urlFunction = searchParams?.get('function') || defaultFunction || getDefaultFunction(urlCategory);

  // 简化状态管理 - 只保留真正需要的本地状态
  const [state, setState] = useSetState<{
    category: ProcessorCategory;
    currentFunction: string;
    isProcessing: boolean;
    processingState: ProcessingState;
  }>({
    category: urlCategory,
    currentFunction: urlFunction,
    isProcessing: false,
    processingState: {
      isProcessing: false,
      progress: 0,
      currentStep: '',
      error: null,
      outputFile: null,
      outputFileName: '',
      remainingTime: null
    }
  });

  // FFmpeg hooks - 直接使用，不复制到本地状态
  const {
    ffmpeg,
    isMultiThread,
    ffmpegLoaded,
    ffmpegLoading,
    ffmpegError,
    initFFmpeg
  } = useFFmpegManager();

  // 文件选择hooks - 直接使用，不复制到本地状态
  const {
    selectedFile,
    dragOver,
    selectFile,
    clearFile,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  } = useFileSelection();

  // 媒体分析hooks - 直接使用，不复制到本地状态
  const {
    audioInfo,
    mediaMetadata,
    isAnalyzing,
    analyzeError,
    analyzeMedia
  } = useUnifiedMediaAnalysis(ffmpeg || null);

  // 播放状态
  const [isPlaying, setIsPlaying] = React.useState(false);
  
  // 文本转语音的文本状态
  const [inputText, setInputText] = useState('');
  const [textFile, setTextFile] = useState<File | null>(null);

  // 判断是否为文本转语音功能
  const isTextToSpeech = state.currentFunction === 'text-to-speech';

  // 分类切换处理
  const handleCategoryChange = useMemoizedFn((category: ProcessorCategory) => {
    const newFunction = getDefaultFunction(category);
    setState({
      category,
      currentFunction: newFunction
    });

    // 更新URL
    const url = new URL(window.location.href);
    url.searchParams.set('category', category);
    url.searchParams.set('function', newFunction);
    window.history.replaceState({}, '', url.toString());

    // 清理当前文件如果类型不匹配
    if (selectedFile) {
      const mediaType = getMediaType(selectedFile.name);
      const shouldClear = (category === 'video' && mediaType === 'audio') ||
        (category === 'audio' && mediaType === 'video');
      if (shouldClear) {
        reset();
      }
    }
  });

  // 功能切换处理
  const handleFunctionChange = useMemoizedFn((functionId: string) => {
    setState({ currentFunction: functionId });

    // 更新URL
    const url = new URL(window.location.href);
    url.searchParams.set('function', functionId);
    window.history.replaceState({}, '', url.toString());
  });

  // 文件选择处理
  const handleFileSelect = useMemoizedFn((file: File) => {
    const currentFunction = getFunctionById(state.currentFunction);
    if (!currentFunction) return;

    // 验证文件类型
    if (!currentFunction.fileValidator(file)) {
      alert(`不支持的文件格式。支持的格式: ${currentFunction.supportedFormats.join(', ')}`);
      return;
    }

    selectFile(file);
    resetProcessing();

    // 如果 FFmpeg 已加载，立即开始分析
    if (ffmpeg) {
      analyzeMedia(file);
    }
  });

  const handleFileInputChange = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  });

  // 重置处理状态
  const resetProcessing = useMemoizedFn(() => {
    setState({
      isProcessing: false,
      processingState: {
        isProcessing: false,
        progress: 0,
        currentStep: '',
        error: null,
        outputFile: null,
        outputFileName: '',
        remainingTime: null
      }
    });
    setIsPlaying(false);
  });

  // 重置所有状态
  const reset = useMemoizedFn(() => {
    clearFile();
    setInputText('');
    setTextFile(null);
    resetProcessing();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  });

  // 处理控制面板状态变化
  const handleStateChange = useMemoizedFn((updates: Partial<ProcessingState>) => {
    setState({
      isProcessing: updates.isProcessing || false,
      processingState: {
        ...state.processingState,
        ...updates
      }
    });
  });

  // 处理输出文件就绪
  const handleOutputReady = useMemoizedFn((blob: Blob, filename: string) => {
    setState({
      processingState: {
        ...state.processingState,
        outputFile: blob,
        outputFileName: filename
      }
    });
  });

  // 重试分析
  const handleRetryAnalysis = useMemoizedFn(() => {
    if (selectedFile && ffmpeg) {
      analyzeMedia(selectedFile);
    }
  });

  // 当 FFmpeg 加载完成且有文件时，自动分析
  useUpdateEffect(() => {
    if (ffmpegLoaded && selectedFile && !audioInfo && !isAnalyzing) {
      console.log('FFmpeg 已加载完成，开始自动分析已选择的文件:', selectedFile.name);
      analyzeMedia(selectedFile);
    }
  }, [ffmpegLoaded, selectedFile]);

  // 获取当前功能配置
  const currentFunction = getFunctionById(state.currentFunction);
  const outputMediaType = state.currentFunction === 'audio-extract' ||
    state.currentFunction === 'audio-convert' ||
    state.currentFunction === 'audio-speed-change' ? 'audio' : 'video';

  return (
    <div className="min-h-screen text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 分类导航 */}
        <CategoryNavigation
          currentCategory={state.category}
          onCategoryChange={handleCategoryChange}
        />

        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {currentFunction?.label || '媒体处理器'}
          </h1>
          <p className="text-muted-foreground">
            {currentFunction?.description || '选择功能开始处理'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：根据功能类型显示不同内容 */}
          <div className="lg:col-span-2 space-y-6">
            {isTextToSpeech ? (
              /* 文本转语音：显示文本输入区域 */
              <TextInputArea
                text={inputText}
                onTextChange={setInputText}
                onFileUpload={setTextFile}
                disabled={state.isProcessing}
              />
            ) : (
              /* 其他功能：显示文件上传和媒体信息 */
              <>
                <UnifiedFileUploadArea
                  selectedFile={selectedFile}
                  category={state.category}
                  dragOver={dragOver}
                  onFileSelect={handleFileSelect}
                  onReset={reset}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onFileInputChange={handleFileInputChange}
                  fileInputRef={fileInputRef}
                  disabled={state.isProcessing}
                />

                <UnifiedMediaMetadataCard
                  selectedFile={selectedFile}
                  mediaMetadata={mediaMetadata}
                  isAnalyzing={isAnalyzing}
                  analyzeError={analyzeError}
                  ffmpegLoaded={ffmpegLoaded}
                  onRetryAnalysis={handleRetryAnalysis}
                />
              </>
            )}
          </div>

          {/* 右侧：控制面板 */}
          <div className="space-y-6">
            {/* 功能选择器 */}
            <FunctionSelector
              category={state.category}
              selectedFunction={state.currentFunction}
              onFunctionChange={handleFunctionChange}
              disabled={state.isProcessing}
            />
            {/* 动态控制面板 */}
            {currentFunction && (
              <currentFunction.component
                selectedFile={isTextToSpeech ? null : selectedFile}
                textInput={isTextToSpeech ? inputText : undefined}
                mediaMetadata={isTextToSpeech ? undefined : mediaMetadata}
                audioInfo={isTextToSpeech ? undefined : audioInfo}
                ffmpeg={ffmpeg || null}
                isMultiThread={isMultiThread}
                ffmpegLoaded={ffmpegLoaded}
                isAnalyzing={isAnalyzing}
                analyzeError={analyzeError}
                onRetryAnalysis={handleRetryAnalysis}
                onStateChange={handleStateChange}
                onOutputReady={handleOutputReady}
              />
            )}

            {/* 处理进度 */}
            <UnifiedProgressDisplay
              processingState={state.processingState}
              messageRef={messageRef}
            />

            {/* 输出文件预览 */}
            {state.processingState.outputFile && (
              <UnifiedOutputPreview
                outputFile={state.processingState.outputFile}
                outputFileName={state.processingState.outputFileName}
                mediaType={outputMediaType}
                isPlaying={isPlaying}
                onPlay={() => {
                  setIsPlaying(true);
                  if (mediaRef.current) {
                    (mediaRef.current as any).play();
                  }
                }}
                onPause={() => {
                  setIsPlaying(false);
                  if (mediaRef.current) {
                    (mediaRef.current as any).pause();
                  }
                }}
                onEnded={() => setIsPlaying(false)}
                mediaRef={mediaRef}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaProcessorView; 