'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Play, AlertTriangle } from 'lucide-react';
import { useVideoProcessorStore } from '@/stores/media-processor/video-store';
import { useMediaProcessing } from '@/hooks/useMediaProcessing';
import { useFFmpegManager } from '@/hooks/useFFmpeg';
import {
    VIDEO_FORMATS,
    VIDEO_RESOLUTIONS,
    VideoFormat,
    VideoResolution,
    VideoCompressionParams,
    validateVideoFile,
    estimateVideoCompression,
    compressVideo,
    formatEstimatedTime
} from '@/utils/videoCompressor';
import { formatFileSize, downloadBlob } from '@/utils/audioConverter';

export const VideoCompressControlPanel: React.FC = () => {
    // 只从 store 获取 inputVideo
    const inputVideo = useVideoProcessorStore((s) => s.inputVideo);

    // 使用 FFmpeg hook
    const {
        ffmpeg,
        isMultiThread,
        ffmpegLoaded,
        ffmpegLoading,
        ffmpegError
    } = useFFmpegManager();

    // 组件内部状态
    const [mediaMetadata, setMediaMetadata] = React.useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [analyzeError, setAnalyzeError] = React.useState<string | null>(null);
    const [outputFormat, setOutputFormat] = React.useState<VideoFormat>('mp4');
    const [resolution, setResolution] = React.useState<VideoResolution>('1080p');

    // 处理状态全部组件内管理
    const {
        processingState,
        startProcessing,
        finishProcessing,
        setError,
        updateProgress,
        resetState
    } = useMediaProcessing();



    // 文件验证
    const fileValidation = inputVideo ? validateVideoFile(inputVideo) : { valid: true };

    // 压缩预估
    const compressionEstimate = inputVideo ? estimateVideoCompression(
        mediaMetadata,
        inputVideo,
        outputFormat,
        resolution
    ) : null;

    // 检查是否可以开始处理
    const canStartProcessing = inputVideo &&
        ffmpeg &&
        ffmpegLoaded &&
        !processingState.isProcessing &&
        !isAnalyzing &&
        fileValidation.valid;

    // 处理视频压缩
    const handleStartProcessing = async () => {
        if (!inputVideo || !ffmpeg || !canStartProcessing) return;

        try {
            startProcessing();

            const params: VideoCompressionParams = {
                outputFormat,
                resolution
            };

            const outputFileName = `${inputVideo.name.replace(/\.[^/.]+$/, '')}_compressed.${VIDEO_FORMATS[outputFormat].ext}`;

            const outputBlob = await compressVideo(
                inputVideo,
                ffmpeg,
                params,
                isMultiThread,
                mediaMetadata,
                updateProgress
            );

            finishProcessing(outputBlob, outputFileName);
            // 可选：onOutputReady && onOutputReady(outputBlob, outputFileName);
        } catch (error) {
            console.error('Video compression failed:', error);
            setError(error instanceof Error ? error.message : '视频压缩失败');
        }
    };

    // 下载文件
    const handleDownload = () => {
        if (processingState.outputFile && processingState.outputFileName) {
            downloadBlob(processingState.outputFile, processingState.outputFileName);
        }
    };

    // 重新开始
    const handleRestart = () => {
        resetState();
    };

    return (
        <div className="space-y-4">
            <Card className="bg-card border-border">
                <CardContent className="p-4">
                    <div className="space-y-4">
                        {!processingState.outputFile ? (
                            <Button
                                onClick={handleStartProcessing}
                                disabled={!canStartProcessing}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                size="lg"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                {processingState.isProcessing ? '正在压缩视频...' : '开始压缩视频'}
                            </Button>
                        ) : (
                            <div className="space-y-2">
                                <Button
                                    onClick={handleDownload}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    size="lg"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    下载压缩视频
                                </Button>
                                <Button
                                    onClick={handleRestart}
                                    variant="outline"
                                    className="w-full"
                                    size="sm"
                                >
                                    重新压缩
                                </Button>
                            </div>
                        )}

                        {/* 显示不能处理的原因 */}
                        {!canStartProcessing && inputVideo && !processingState.isProcessing && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                    {ffmpegError ? 'FFmpeg 加载失败，请刷新页面重试' :
                                        ffmpegLoading ? '等待 FFmpeg 加载完成...' :
                                            isAnalyzing ? '正在分析文件...' :
                                                !fileValidation.valid ? fileValidation.error : '请选择有效的视频文件'}
                                </div>
                            </div>
                        )}
                        {/* 视频格式选择 */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-foreground">
                                    输出格式
                                </label>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(VIDEO_FORMATS).map(([key, format]) => (
                                    <button
                                        key={key}
                                        className={`p-3 border rounded-lg text-sm font-medium transition-all ${outputFormat === key
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-border hover:border-muted-foreground hover:bg-accent'
                                            } ${processingState.isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => !processingState.isProcessing && setOutputFormat(key as VideoFormat)}
                                        disabled={processingState.isProcessing}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{format.label}</span>
                                            {outputFormat === key && (
                                                <CheckCircle2 className="h-3 w-3" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 清晰度选择 */}
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">
                                输出清晰度
                            </label>
                            <div className="space-y-2">
                                {Object.entries(VIDEO_RESOLUTIONS).map(([key, resConfig]) => (
                                    <div
                                        key={key}
                                        className={`border rounded-lg p-3 cursor-pointer transition-all ${resolution === key
                                            ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                            : 'border-border hover:border-muted-foreground hover:bg-accent'
                                            } ${processingState.isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => !processingState.isProcessing && setResolution(key as VideoResolution)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <div className="font-medium text-sm">{resConfig.label}</div>
                                                    <div className="text-xs text-muted-foreground">{resConfig.description}</div>
                                                    {/* 音频处理提示 */}
                                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                        {key === '360p' ? '音频将压缩至128kbps' : '保持原音频质量'}
                                                    </div>
                                                </div>
                                            </div>
                                            {resolution === key && (
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 压缩预估 */}
                        {inputVideo && compressionEstimate && fileValidation.valid && (
                            <div className="pt-4 border-t border-border/50">
                                <label className="text-sm font-medium text-foreground mb-3 block">
                                    压缩预览
                                </label>
                                <div className="p-3 bg-muted/30 rounded-lg border">
                                    <div className="text-xs text-muted-foreground mb-1">
                                        预估结果
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">文件大小:</span>
                                            <div className="text-right">
                                                <span className="text-sm font-medium text-foreground">
                                                    {formatFileSize(compressionEstimate.estimatedSizeMB)}
                                                </span>
                                                {compressionEstimate.compressionRatio > 0 && (
                                                    <span className="text-xs text-green-600 ml-2">
                                                        压缩 {compressionEstimate.compressionRatio}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">处理时间:</span>
                                            <span className="text-sm text-muted-foreground">
                                                {formatEstimatedTime(compressionEstimate.estimatedTimeMinutes)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm">原文件:</span>
                                            <span className="text-sm text-muted-foreground">
                                                {formatFileSize(inputVideo.size / (1024 * 1024))}
                                            </span>
                                        </div>
                                    </div>
                                    {compressionEstimate.note && (
                                        <div className="text-xs text-muted-foreground mt-2">
                                            {compressionEstimate.note}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 分析状态显示 */}
                        {isAnalyzing && (
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm text-blue-700 dark:text-blue-300">正在分析视频信息...</span>
                                </div>
                            </div>
                        )}

                        {/* 分析错误提示 */}
                        {analyzeError && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                    {analyzeError}
                                    <div className="mt-1 text-yellow-600 dark:text-yellow-400">
                                        无法显示精确预估，请直接进行压缩
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FFmpeg 加载错误 */}
                        {ffmpegError && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <div className="text-sm text-red-700 dark:text-red-300">
                                        FFmpeg 加载失败：{ffmpegError instanceof Error ? ffmpegError.message : '未知错误'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 文件验证错误 */}
                        {inputVideo && !fileValidation.valid && (
                            <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                    <div className="text-sm text-red-700 dark:text-red-300">
                                        {fileValidation.error}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 无视频信息时的提示 */}
                        {!isAnalyzing && !mediaMetadata && !analyzeError && inputVideo && fileValidation.valid && (
                            <div className="p-3 bg-muted/20 rounded-lg border">
                                <div className="text-xs text-muted-foreground">
                                    {ffmpegLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                                            等待 FFmpeg 加载完成后分析视频信息...
                                        </div>
                                    ) : (
                                        '无法获取详细的视频信息，将使用默认设置进行压缩'
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

        </div>
    );
};

export default VideoCompressControlPanel; 