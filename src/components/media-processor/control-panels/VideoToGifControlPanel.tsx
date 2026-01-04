'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Download, Settings2 } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useAppStore } from '@/stores/media-processor/app-store';
import { useFFmpegStore } from '@/stores/ffmpeg-store';
import { fetchFile } from '@ffmpeg/util';
import { downloadBlob, getFileExtension } from '@/utils/audioConverter';
import { safeCleanupFiles, createFFmpegProgressListener } from '@/utils/ffmpeg-helpers';
import { VideoPreviewPlayer } from '@/components/media-processor/shared/VideoPreviewPlayer';

export const VideoToGifControlPanel: React.FC = () => {
    const { t } = useTranslation();

    // Store access
    const selectedFile = useAppStore(state => state.selectedFile);
    const mediaMetadata = useAppStore(state => state.mediaMetadata);
    const processingState = useAppStore(state => state.processingState);
    const analyzeMedia = useAppStore(state => state.analyzeMedia);
    const startProcessing = useAppStore(state => state.startProcessing);
    const finishProcessing = useAppStore(state => state.finishProcessing);
    const setProcessingError = useAppStore(state => state.setProcessingError);
    const updateProcessingState = useAppStore(state => state.updateProcessingState);
    const resetAppStore = useAppStore(state => state.reset);

    const { ffmpeg, isMultiThread, isLoaded: ffmpegLoaded, isLoading: ffmpegLoading, error: ffmpegError } = useFFmpegStore();

    // Local state for GIF parameters
    const [startTime, setStartTime] = useState<number>(0);
    const [endTime, setEndTime] = useState<number>(5);
    const [currentPreviewTime, setCurrentPreviewTime] = useState<number>(0);
    const [fps, setFps] = useState<number>(10);
    const [width, setWidth] = useState<number>(320);

    const duration = endTime - startTime;
    const videoDuration = mediaMetadata?.video?.duration || 0;

    // 自动分析视频元数据（如果还没有）
    useEffect(() => {
        if (selectedFile && !mediaMetadata && selectedFile.type.startsWith('video/')) {
            analyzeMedia(selectedFile);
        }
    }, [selectedFile, mediaMetadata, analyzeMedia]);

    // Initialize/Update default values based on metadata
    useEffect(() => {
        if (mediaMetadata?.video) {
            // Default width to something reasonable, max 480 or original width
            const originalWidth = mediaMetadata.video.width || 640;
            if (originalWidth > 480) {
                setWidth(480);
            } else {
                setWidth(originalWidth);
            }

            // Set initial end time based on video duration
            const initialDuration = Math.min(5, mediaMetadata.video.duration || 5);
            setEndTime(initialDuration);
            setCurrentPreviewTime(0);
        }
    }, [mediaMetadata]);

    // 时间范围变化处理
    const handleTimeRangeChange = (newStart: number, newEnd: number) => {
        setStartTime(newStart);
        setEndTime(newEnd);
    };

    // 视频预览时间更新
    const handleVideoTimeUpdate = (time: number) => {
        setCurrentPreviewTime(time);
    };

    // 跳转到指定时间（用于预览片段）
    const handleSeek = (time: number) => {
        setCurrentPreviewTime(time);
    };

    const canStartProcessing = selectedFile && ffmpeg && ffmpegLoaded && !processingState.isProcessing;

    const handleStartProcessing = async () => {
        if (!selectedFile || !ffmpeg || !canStartProcessing) return;

        const inputExtension = getFileExtension(selectedFile.name);
        const inputFileName = `input.${inputExtension}`;
        const outputFileName = `output.gif`;

        try {
            startProcessing();

            await ffmpeg.writeFile(inputFileName, await fetchFile(selectedFile));

            const progressListener = createFFmpegProgressListener((progress, step, remainingTime) => {
                updateProcessingState({ progress, currentStep: step, remainingTime });
            }, 'video'); // Reuse 'video' type for general progress or add 'gif' support in helper if needed

            // 添加详细日志监听器（用于调试）
            const detailedLogListener = ({ type, message }: { type: string; message: string }) => {
                console.log(`[FFmpeg ${type}] ${message}`);

                // 检测可能的错误或警告
                if (type === 'fferr' || message.includes('Error') || message.includes('error')) {
                    console.error('[FFmpeg Error]', message);
                }
            };

            ffmpeg.on('log', progressListener);
            ffmpeg.on('log', detailedLogListener);

            try {
                // 使用两步法生成高质量 GIF（稳定方案）
                // 步骤1：生成专属调色板
                // 步骤2：使用调色板生成最终 GIF
                
                const paletteFileName = 'palette.png';

                // ============ 步骤 1: 生成调色板 ============
                updateProcessingState({ progress: 10, currentStep: t('videoControlPanels.gif.steps.1') });

                const paletteArgs: string[] = [];
                if (isMultiThread) {
                    paletteArgs.push('-threads', '0');
                }

                // 生成调色板：裁剪时间段 + 调整尺寸 + 生成256色调色板
                paletteArgs.push(
                    '-ss', startTime.toString(),
                    '-t', duration.toString(),
                    '-i', inputFileName,
                    '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=stats_mode=diff`,
                    '-y',
                    paletteFileName
                );

                console.log('[GIF Step 1] 生成调色板参数:', paletteArgs);
                console.log('[GIF Step 1] 开始生成调色板...');

                const paletteRet = await ffmpeg.exec(paletteArgs);

                console.log('[GIF Step 1] 调色板生成完成，返回值:', paletteRet);
                if (paletteRet !== 0) {
                    throw new Error('调色板生成失败');
                }

                // 验证调色板文件是否生成
                try {
                    const paletteData = await ffmpeg.readFile(paletteFileName);
                    console.log('[GIF Step 1] ✓ 调色板文件已生成，大小:', paletteData.byteLength, 'bytes');
                } catch (e) {
                    throw new Error('调色板文件生成失败，请重试');
                }

                // ============ 步骤 2: 使用调色板生成 GIF ============
                updateProcessingState({ progress: 40, currentStep: t('videoControlPanels.gif.steps.2') });

                const gifArgs: string[] = [];
                if (isMultiThread) {
                    gifArgs.push('-threads', '0');
                }

                // 应用调色板：读取视频 + 调色板 + 应用颜色映射
                gifArgs.push(
                    '-ss', startTime.toString(),
                    '-t', duration.toString(),
                    '-i', inputFileName,
                    '-i', paletteFileName,
                    '-lavfi', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5`,
                    '-loop', '0',
                    '-y',
                    outputFileName
                );

                console.log('[GIF Step 2] 生成 GIF 参数:', gifArgs);
                console.log('[GIF Step 2] 开始生成最终 GIF...');

                const gifRet = await ffmpeg.exec(gifArgs);

                console.log('[GIF Step 2] GIF 生成完成，返回值:', gifRet);
                if (gifRet !== 0) {
                    throw new Error('GIF 生成失败');
                }

                updateProcessingState({ progress: 95, currentStep: t('videoControlPanels.gif.steps.final') });

                const data = await ffmpeg.readFile(outputFileName);
                const outputBlob = new Blob([data], { type: 'image/gif' });

                console.log('[GIF] ✅ 转换成功！GIF 大小:', (data.byteLength / 1024).toFixed(2), 'KB');
                finishProcessing(outputBlob, outputFileName);
            } finally {
                ffmpeg.off('log', progressListener);
                ffmpeg.off('log', detailedLogListener);
                // 清理所有临时文件（包括调色板）
                await safeCleanupFiles(ffmpeg, [inputFileName, outputFileName, 'palette.png']);
            }

        } catch (error) {
            console.error('GIF conversion failed:', error);
            setProcessingError(error instanceof Error ? error.message : t('videoControlPanels.gif.conversionFailed'));
        }
    };

    const handleDownload = () => {
        if (processingState.outputFile && processingState.outputFileName) {
            downloadBlob(processingState.outputFile, processingState.outputFileName);
        }
    };

    const handleRestart = () => {
        resetAppStore();
    };

    return (
        <div className="space-y-4">
            {/* 视频预览播放器 */}
            {selectedFile && (
                <VideoPreviewPlayer
                    file={selectedFile}
                    currentTime={currentPreviewTime}
                    onTimeUpdate={handleVideoTimeUpdate}
                />
            )}

            {/* 转换设置面板 */}
            <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="w-4 h-4" />
                        <h3 className="font-medium">{t('videoControlPanels.gif.settings')}</h3>
                    </div>

                    {/* FFmpeg 加载状态提示 */}
                    {ffmpegLoading && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    {t('videoControlPanels.gif.ffmpeg.loading')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* FFmpeg 加载错误提示 */}
                    {ffmpegError && !ffmpegLoaded && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-900 dark:text-red-100 font-medium mb-1">
                                {t('videoControlPanels.gif.ffmpeg.failed')}
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300">
                                {ffmpegError}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                {t('videoControlPanels.gif.ffmpeg.refresh')}
                            </p>
                        </div>
                    )}

                    {/* 未加载 FFmpeg 提示 */}
                    {!ffmpegLoaded && !ffmpegLoading && !ffmpegError && (
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <p className="text-sm text-amber-900 dark:text-amber-100">
                                {t('videoControlPanels.gif.ffmpeg.notReady')}
                            </p>
                        </div>
                    )}

                    {/* 时间范围选择 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>{t('videoControlPanels.gif.startTime')}</Label>
                            <Input
                                type="number"
                                min="0"
                                max={videoDuration}
                                step="0.1"
                                value={startTime.toFixed(1)}
                                onChange={(e) => {
                                    const newStart = Math.max(0, Math.min(parseFloat(e.target.value) || 0, videoDuration));
                                    setStartTime(newStart);
                                    // 确保至少1秒时长
                                    if (endTime - newStart < 1) {
                                        setEndTime(Math.min(videoDuration, newStart + 1));
                                    }
                                    // 确保不超过10秒
                                    if (endTime - newStart > 10) {
                                        setEndTime(newStart + 10);
                                    }
                                }}
                                disabled={processingState.isProcessing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>{t('videoControlPanels.gif.endTime')}</Label>
                            <Input
                                type="number"
                                min="0"
                                max={videoDuration}
                                step="0.1"
                                value={endTime.toFixed(1)}
                                onChange={(e) => {
                                    const newEnd = Math.max(0, Math.min(parseFloat(e.target.value) || 0, videoDuration));
                                    setEndTime(newEnd);
                                    // 确保至少1秒时长
                                    if (newEnd - startTime < 1) {
                                        setStartTime(Math.max(0, newEnd - 1));
                                    }
                                    // 确保不超过10秒
                                    if (newEnd - startTime > 10) {
                                        setStartTime(newEnd - 10);
                                    }
                                }}
                                disabled={processingState.isProcessing}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('videoControlPanels.gif.width')}</Label>
                                <Select
                                    value={width.toString()}
                                    onValueChange={(v) => setWidth(parseInt(v))}
                                    disabled={processingState.isProcessing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('videoControlPanels.gif.selectWidth')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="240">240px</SelectItem>
                                        <SelectItem value="320">320px</SelectItem>
                                        <SelectItem value="480">480px</SelectItem>
                                        <SelectItem value="640">640px</SelectItem>
                                        {mediaMetadata?.video?.width && (
                                            <SelectItem value={mediaMetadata.video.width.toString()}>
                                                {t('videoControlPanels.gif.originalSize')} ({mediaMetadata.video.width}px)
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>{t('videoControlPanels.gif.fps')}</Label>
                                <Select
                                    value={fps.toString()}
                                    onValueChange={(v) => setFps(parseInt(v))}
                                    disabled={processingState.isProcessing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('videoControlPanels.gif.selectFps')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="5">5 fps</SelectItem>
                                        <SelectItem value="10">10 fps</SelectItem>
                                        <SelectItem value="15">15 fps</SelectItem>
                                        <SelectItem value="20">20 fps</SelectItem>
                                        <SelectItem value="24">24 fps ({t('videoControlPanels.gif.fpsDescriptions.cinema')})</SelectItem>
                                        <SelectItem value="30">30 fps ({t('videoControlPanels.gif.fpsDescriptions.smooth')})</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                    {/* 时长提示 */}
                    <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                        {t('videoControlPanels.gif.clipDuration')}: <span className="font-medium text-foreground">{duration.toFixed(1)}s</span>
                        {duration > 10 && (
                            <span className="text-amber-600 dark:text-amber-400 ml-2">
                                ({t('videoControlPanels.gif.exceedsLimit')})
                            </span>
                        )}
                    </div>

                    {/* 转换按钮 */}
                    {!processingState.outputFile ? (
                        <Button
                            onClick={handleStartProcessing}
                            disabled={!canStartProcessing}
                            className="w-full"
                            size="lg"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            {processingState.isProcessing ? t('videoControlPanels.gif.converting') : t('videoControlPanels.gif.startConvert')}
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <Button onClick={handleDownload} className="w-full" variant="default" size="lg">
                                <Download className="w-4 h-4 mr-2" />
                                {t('videoControlPanels.gif.downloadResult')}
                            </Button>
                            <Button onClick={handleRestart} variant="outline" className="w-full" size="sm">
                                {t('videoControlPanels.gif.reconvert')}
                            </Button>
                            </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
