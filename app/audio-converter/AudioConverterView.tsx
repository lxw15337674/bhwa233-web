'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useMemoizedFn, useUpdateEffect } from 'ahooks';

// Hooks
import {
    useFFmpegManager,
    useUnifiedMediaAnalysis,
    useAudioConversion,
    useFileSelection,
    useAudioConverterSettings
} from '@/hooks/useAudioConverter';

// Components
import { FileUploadArea } from './components/FileUploadArea';
import { ConversionSettings } from './components/ConversionSettings';
import { MediaMetadataCard } from './components/MediaMetadataCard';
import { ProgressDisplay } from './components/ProgressDisplay';
import { OutputPreview } from './components/OutputPreview';

// Utils
import { isValidVideoFile, SUPPORTED_VIDEO_FORMATS } from '@/utils/audioConverter';

const AudioConverterView = () => {
    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Hooks
    const {
        ffmpeg,
        isMultiThread,
        ffmpegLoaded,
        ffmpegLoading,
        ffmpegError,
        initFFmpeg
    } = useFFmpegManager();

    const {
        selectedFile,
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
    } = useUnifiedMediaAnalysis(ffmpeg);

    const {
        conversionState,
        isConverting,
        startConversion,
        resetConversion
    } = useAudioConversion(ffmpeg, isMultiThread, audioInfo, mediaMetadata);

    const {
        outputFormat,
        setOutputFormat,
        qualityMode,
        setQualityMode,
        isPlaying,
        setIsPlaying
    } = useAudioConverterSettings();

    // 文件选择处理
    const handleFileSelect = useMemoizedFn((file: File) => {
        // 验证文件类型
        if (!isValidVideoFile(file.name)) {
            alert(`不支持的文件格式。支持的格式: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`);
            return;
        }

        selectFile(file);
        resetConversion();

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

    // 重置所有状态
    const reset = useMemoizedFn(() => {
        clearFile();
        resetConversion();
        setIsPlaying(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    });

    // 开始转换
    const handleStartConversion = useMemoizedFn(() => {
        if (!selectedFile) return;

        if (!ffmpeg) {
            initFFmpeg();
            return;
        }

        startConversion(selectedFile, outputFormat, qualityMode);
    });

    // 重试音频分析
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

    return (
        <div className="min-h-screen text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        音频转换
                    </h1>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：文件上传区域和媒体信息 */}
                    <div className="lg:col-span-2 space-y-6">
                        <FileUploadArea
                            selectedFile={selectedFile}
                            dragOver={dragOver}
                            onFileSelect={handleFileSelect}
                            onReset={reset}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onFileInputChange={handleFileInputChange}
                            fileInputRef={fileInputRef}
                        />

                        {/* 媒体元数据显示 */}
                        <MediaMetadataCard
                            selectedFile={selectedFile}
                            mediaMetadata={mediaMetadata || null}
                            isAnalyzing={isAnalyzing}
                            analyzeError={analyzeError}
                            ffmpegLoaded={ffmpegLoaded}
                            onRetryAnalysis={handleRetryAnalysis}
                        />

                        {/* 错误提示 */}
                        {(conversionState.error || ffmpegError) && (
                            <Alert className="border-destructive bg-destructive/10">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="text-destructive whitespace-pre-line">
                                    {conversionState.error || ffmpegError?.message}
                                </AlertDescription>
                                {!ffmpegLoaded && (
                                    <div className="mt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={initFFmpeg}
                                            disabled={ffmpegLoading}
                                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        >
                                            {ffmpegLoading ? '加载中...' : '重新加载 FFmpeg'}
                                        </Button>
                                    </div>
                                )}
                            </Alert>
                        )}
                    </div>

                    {/* 右侧：控制面板 */}
                    <div className="space-y-6">

                        {/* 转换按钮 */}
                        <Button
                            onClick={handleStartConversion}
                            disabled={!selectedFile || isConverting}
                            className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted"
                        >
                            {ffmpegLoading
                                ? '加载中...'
                                : isConverting
                                    ? '转换中...'
                                    : '开始转换'
                            }
                        </Button>

                        {/* 输出格式和质量设置 */}
                        <ConversionSettings
                            outputFormat={outputFormat}
                            qualityMode={qualityMode}
                            onOutputFormatChange={setOutputFormat}
                            onQualityModeChange={setQualityMode}
                            ffmpegLoaded={ffmpegLoaded}
                            isMultiThread={isMultiThread}
                            selectedFile={selectedFile}
                            audioInfo={audioInfo || null}
                            mediaMetadata={mediaMetadata || null}
                            isAnalyzing={isAnalyzing}
                            analyzeError={analyzeError}
                            onRetryAnalysis={handleRetryAnalysis}
                        />

                        {/* 处理进度 */}
                        <ProgressDisplay
                            conversionState={conversionState}
                            messageRef={messageRef}
                        />

                        {/* 输出文件预览 */}
                        <OutputPreview
                            outputFile={conversionState.outputFile}
                            outputFileName={conversionState.outputFileName}
                            isPlaying={isPlaying}
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                            onEnded={() => setIsPlaying(false)}
                            audioRef={audioRef}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioConverterView;
