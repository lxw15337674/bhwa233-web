'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useMemoizedFn, useSetState, useUpdateEffect } from 'ahooks';
import { useTranslation } from '@/components/TranslationProvider';

// 导入统一组件
import { FunctionSelector } from './FunctionSelector';
import { UnifiedFileUploadArea } from './UnifiedFileUploadArea';
import { UnifiedMediaMetadataCard } from './UnifiedMediaMetadataCard';
import { UnifiedProgressDisplay } from './UnifiedProgressDisplay';
import { UnifiedOutputPreview } from './UnifiedOutputPreview';
import { BatchTaskGrid } from './batch/BatchTaskGrid';

// 导入类型和配置
import { ProcessorCategory, MediaProcessorState, ProcessingState } from '@/types/media-processor';
import { getFunctionById, getDefaultFunction } from '@/config/processor-functions';
import { getMediaType, isValidMediaFile } from '@/utils/audioConverter';

import { useFileSelection } from '@/hooks/audio-convert/useFileSelection';
import { useUnifiedMediaAnalysis } from '@/hooks/audio-convert/useUnifiedMediaAnalysis';
// import { useFFmpegManager } from '../../hooks/useFFmpeg';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';
import { useAppStore } from '@/stores/media-processor/app-store';

// 直接导入图片处理和编辑器客户端组件
import ImageProcessorPage from '../../../app/[locale]/processor/image/ImageProcessorClientPage';
import ImageEditorPage from '../../../app/[locale]/processor/editor/EditorClientPage';

interface MediaProcessorViewProps {
  defaultCategory?: ProcessorCategory;
  defaultFunction?: string;
}

export const MediaProcessorView: React.FC<MediaProcessorViewProps> = ({
  defaultCategory = 'audio',
  defaultFunction
}) => {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLAudioElement>(null);

  // 从URL参数获取初始状态
  const urlCategory = searchParams?.get('category') as ProcessorCategory || defaultCategory;
  const urlFunction = searchParams?.get('function') || defaultFunction || getDefaultFunction(urlCategory);

  // 对于图片处理和编辑类别，重定向到独立页面
  if (urlCategory === 'image' || urlCategory === 'editor') {
    if (typeof window !== 'undefined') {
      let redirectPath = '';
      if (urlCategory === 'image') {
        redirectPath = '/processor/image';
      } else if (urlCategory === 'editor') {
        redirectPath = '/processor/editor';
      }

      window.location.href = redirectPath;
      return null; // 防止进一步渲染
    }
  }

  // 对于批量处理类别，根据功能重定向到相应页面
  if (urlCategory === 'batch') {
    if (typeof window !== 'undefined') {
      let redirectPath = '';
      if (urlFunction && urlFunction.includes('image')) {
        redirectPath = '/processor/batchimage';
      } else {
        redirectPath = '/processor/audio/convert'; // 默认音频处理页
      }

      window.location.href = redirectPath;
      return null; // 防止进一步渲染
    }
  }

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
  // const {
  //   ffmpeg,
  //   isMultiThread,
  //   ffmpegLoaded,
  //   ffmpegLoading,
  //   ffmpegError,
  // } = useFFmpegManager();

  // 同步 FFmpeg 状态到 store（用于子组件访问）
  useEffect(() => {
    // 初始化 FFmpeg
    useAppStore.getState().initFFmpeg();
  }, []);

  // 从 store 获取状态
  const { ffmpeg, isMultiThread, ffmpegLoaded, ffmpegLoading, ffmpegError } = useAppStore();

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

  // 监听 URL 参数变化，同步功能切换
  useEffect(() => {
    const urlFunc = searchParams?.get('function');
    const urlCat = searchParams?.get('category') as ProcessorCategory;

    if (urlFunc && urlFunc !== state.currentFunction) {
      console.log('[MediaProcessorView] 检测到功能切换:', state.currentFunction, '->', urlFunc);

      // 更新当前功能
      setState({ currentFunction: urlFunc });

      // 验证已上传文件是否与新功能兼容
      if (selectedFile) {
        const newFunction = getFunctionById(urlFunc);
        if (newFunction && !newFunction.fileValidator(selectedFile)) {
          console.log('[MediaProcessorView] 文件类型不兼容，清空文件');
          clearFile();
          resetProcessing();
        } else {
          console.log('[MediaProcessorView] 文件类型兼容，保留文件');
        }
      }
    }

    // 同步 category 变化
    if (urlCat && urlCat !== state.category) {
      setState({ category: urlCat });
    }
  }, [searchParams, state.currentFunction, state.category, selectedFile]);

  // 使用 useClipboardPaste Hook (只选择第一个图片)
  const { handlePaste } = useClipboardPaste({
    onFilesSelected: (files) => {
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    debug: true,
    fileFilter: (file) => file.type.startsWith('image/')
  });

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
    if (newFunction) {
      url.searchParams.set('function', newFunction);
    } else {
      url.searchParams.delete('function');
    }
    window.history.replaceState({}, '', url.toString());

    // 清理当前文件如果类型不匹配
    if (selectedFile) {
      reset();
    }
  });

  // 功能切换处理（已废弃 - 现在由 FunctionSelector 直接 router.push + useEffect 监听）
  // 保留此函数以防某些地方还在调用，但实际逻辑已移到 useEffect
  const handleFunctionChange = useMemoizedFn((functionId: string) => {
    // FunctionSelector 会调用 router.push 更新 URL
    // useEffect 会监听 searchParams 变化并同步 state
    console.log('[MediaProcessorView] handleFunctionChange 被调用，但实际由 useEffect 处理:', functionId);
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
  const outputMediaType = 'audio' as const;
  const isBatchMode = state.category === 'batch';
  const showAudioBatchUI = state.category !== 'image' && state.category !== 'editor';

  return (
    <div className="min-h-screen text-foreground">
      <div className="container mx-auto px-4 py-8">{/* 移除 max-w-6xl 以匹配 image 页面 */}

        {showAudioBatchUI && (
          <>
            {/* 页面标题 */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {currentFunction?.labelKey ? t(currentFunction.labelKey) : (currentFunction?.label || t('mediaProcessor.title'))}
              </h1>
              <p className="text-muted-foreground">
                {currentFunction?.descriptionKey ? t(currentFunction.descriptionKey) : (currentFunction?.description || t('mediaProcessor.selectFunctionToStart'))}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 左侧：文件上传和媒体信息 */}
              <div className="lg:col-span-2 space-y-6">
                {isBatchMode ? (
                  <BatchTaskGrid />
                ) : (
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
                      onPasteFromClipboard={handlePaste}
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

              <div className="space-y-6">
                {/* 功能选择器 */}
                {!isBatchMode && (
                  <FunctionSelector
                    disabled={state.isProcessing}
                  />
                )}
                {currentFunction && (
                  <currentFunction.component
                    selectedFile={selectedFile}
                    mediaMetadata={mediaMetadata}
                    audioInfo={audioInfo}
                    ffmpeg={ffmpeg || null}
                    isMultiThread={isMultiThread}
                    ffmpegLoaded={ffmpegLoaded}
                    isAnalyzing={isAnalyzing}
                    analyzeError={analyzeError}
                    onRetryAnalysis={handleRetryAnalysis}
                    onStateChange={handleStateChange}
                    onOutputReady={handleOutputReady}
                    textInput=""
                  />
                )}
                {/* 处理进度 */}
                {!isBatchMode && (
                  <UnifiedProgressDisplay
                    processingState={state.processingState}
                  />
                )}

                {/* 输出文件预览 */}
                {!isBatchMode && state.processingState.outputFile && (
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
          </>
        )}
      </div>
    </div>
  );
};

export default MediaProcessorView; 