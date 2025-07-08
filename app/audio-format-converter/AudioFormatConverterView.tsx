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
    useAudioConverterSettings
} from '@/hooks/useAudioConverter';
import { useAudioToAudioConversion } from '@/hooks/audio-convert/useAudioToAudioConversion';
import { useAudioFileSelection } from '@/hooks/audio-convert/useAudioFileSelection';

// Components
import { AudioFileUpload } from './components/AudioFileUpload';
import { AudioConversionSettings } from './components/AudioConversionSettings';
import { AudioMetadataCard } from './components/AudioMetadataCard';
import { ProgressDisplay } from '../audio-converter/components/ProgressDisplay';
import { OutputPreview } from '../audio-converter/components/OutputPreview';
import { MediaConverterNavigation } from '@/components/shared/MediaConverterNavigation';

// Utils
import { isValidAudioFile, getMediaType, SUPPORTED_AUDIO_FORMATS } from '@/utils/audioConverter';

const AudioFormatConverterView = () => {
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
    } = useAudioFileSelection();

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
    } = useAudioToAudioConversion(ffmpeg, isMultiThread, audioInfo, mediaMetadata);

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
        const mediaType = getMediaType(file.name);

        if (mediaType === 'video') {
            alert('检测到视频文件，请前往视频音频提取页面处理此文件。');
            return;
        }

        if (!isValidAudioFile(file.name)) {
            alert(`不支持的音频格式。支持的格式: ${SUPPORTED_AUDIO_FORMATS.join(', ')}`);
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
            console.log('FFmpeg 已加载完成，开始自动分析已选择的音频文件:', selectedFile.name);
            analyzeMedia(selectedFile);
        }
    }, [ffmpegLoaded, selectedFile]);

    return (
        <div className="min-h-screen text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* 页面导航 */}
                <MediaConverterNavigation />

                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                        音频格式转换
                    </h1>
                    <p className="text-muted-foreground">
                        在不同音频格式之间转换，保持最佳音质
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：文件上传区域和音频信息 */}
                    <div className="lg:col-span-2 space-y-6">
                        <AudioFileUpload
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

                        {/* 音频元数据显示 */}
                        <AudioMetadataCard
                            selectedFile={selectedFile}
                            mediaMetadata={mediaMetadata || null}
                            isAnalyzing={isAnalyzing}
                            analyzeError={analyzeError}
                            ffmpegLoaded={ffmpegLoaded}
                            onRetryAnalysis={handleRetryAnalysis}
                            conversionState={conversionState}
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
                                    : '转换格式'
                            }
                        </Button>

                        {/* 转换设置 */}
                        <AudioConversionSettings
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
                            conversionState={conversionState}
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

export default AudioFormatConverterView;
