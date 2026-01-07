'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Download, Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAppStore } from '@/stores/media-processor/app-store';
import { useFFmpegStore } from '@/stores/ffmpeg-store';
import { fetchFile } from '@ffmpeg/util';
import { downloadBlob, getFileExtension } from '@/utils/audioConverter';
import { safeCleanupFiles, createFFmpegProgressListener } from '@/utils/ffmpeg-helpers';
import { toast } from "sonner"

// 时间转换工具函数
const secondsToTimeString = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const timeStringToSeconds = (timeString: string): number => {
    const parts = timeString.split(':').map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
};

export const VideoToGifControlPanel: React.FC = () => {
    const t = useTranslations();

    // Store access
    const selectedFile = useAppStore(state => state.selectedFile);
    const videoMetadata = useAppStore(state => state.videoMetadata);
    const processingState = useAppStore(state => state.processingState);
    const gifTimeRange = useAppStore(state => state.gifTimeRange);
    const setGifStartTime = useAppStore(state => state.setGifStartTime);
    const setGifEndTime = useAppStore(state => state.setGifEndTime);
    const startProcessing = useAppStore(state => state.startProcessing);
    const finishProcessing = useAppStore(state => state.finishProcessing);
    const setProcessingError = useAppStore(state => state.setProcessingError);
    const updateProcessingState = useAppStore(state => state.updateProcessingState);
    const resetProcessingOutput = useAppStore(state => state.resetProcessingOutput);

    const { ffmpeg, isLoaded: ffmpegLoaded, isLoading: ffmpegLoading, error: ffmpegError } = useFFmpegStore();

    // GIF 参数状态（本地）
    const [fps, setFps] = useState<number>(10);
    const [resolution, setResolution] = useState<number>(480);

    // 时间范围从 app-store 获取
    const startTime = gifTimeRange.startTime;
    const endTime = gifTimeRange.endTime;
    const [gifPreviewUrl, setGifPreviewUrl] = useState<string>('');

    // 处理输出文件的GIF预览
    useEffect(() => {
        if (processingState.outputFile) {
            const url = URL.createObjectURL(processingState.outputFile);
            setGifPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setGifPreviewUrl('');
        }
    }, [processingState.outputFile]);

    // 时间范围验证
    const timeRangeError = useMemo(() => {
        if (!videoMetadata) return null;
        if (endTime <= startTime) return t('videoControlPanels.gif.timeRangeError');
        if (endTime - startTime > 30) return t('videoControlPanels.gif.maxDurationError');
        if (endTime > videoMetadata.duration) return t('videoControlPanels.gif.endTimeError');
        if (startTime < 0) return t('videoControlPanels.gif.startTimeError');
        return null;
    }, [startTime, endTime, videoMetadata, t]);

    const canStartProcessing = selectedFile && ffmpeg && ffmpegLoaded && !processingState.isProcessing && !timeRangeError && videoMetadata;

    const handleStartProcessing = async () => {
        if (!selectedFile || !ffmpeg || !canStartProcessing) {
            toast(timeRangeError)
            return;
        }

        const inputExtension = getFileExtension(selectedFile.name);
        const inputFileName = `input.${inputExtension}`;
        const outputFileName = `output.gif`;

        try {
            startProcessing();

            await ffmpeg.writeFile(inputFileName, await fetchFile(selectedFile));

            const totalDuration = endTime - startTime; // 片段时长
            const progressListener = createFFmpegProgressListener((progress, step, remainingTime) => {
                updateProcessingState({ progress, currentStep: step, remainingTime });
            }, 'video', t, { expectedDuration: totalDuration });

            const detailedLogListener = ({ type, message }: { type: string; message: string }) => {
                console.log(`[FFmpeg ${type}] ${message}`);
                if (type === 'fferr' || message.includes('Error') || message.includes('error')) {
                    console.error('[FFmpeg Error]', message);
                }
            };

            ffmpeg.on('log', progressListener);
            ffmpeg.on('log', detailedLogListener);

            try {
                updateProcessingState({ progress: 10, currentStep: t('videoControlPanels.gif.converting') });

                // 计算实际分辨率
                const actualWidth = resolution === 0 && videoMetadata
                    ? videoMetadata.width
                    : resolution;

                const scaleFilter = resolution === 0
                    ? ''
                    : `scale=${actualWidth}:-1:flags=lanczos,`;

                const args: string[] = [
                    '-ss', String(startTime),                    // 开始时间
                    '-t', String(endTime - startTime),           // 持续时间
                    '-i', inputFileName,
                    '-vf', `${scaleFilter}fps=${fps}`,
                    '-f', 'gif',
                    '-y',
                    outputFileName
                ];

                console.log('[GIF] 转换参数:', args);
                console.log(`[GIF] 时间范围: ${startTime}s - ${endTime}s (${endTime - startTime}s)`);
                console.log(`[GIF] FPS: ${fps}, 分辨率: ${resolution === 0 ? '原始' : resolution + 'p'}`);

                const ret = await ffmpeg.exec(args);

                console.log('[GIF] 转换完成，返回值:', ret);
                if (ret !== 0) {
                    throw new Error(t('videoControlPanels.gif.conversionFailed'));
                }

                updateProcessingState({ progress: 95, currentStep: t('videoControlPanels.gif.finishing') });

                const data = await ffmpeg.readFile(outputFileName);
                const outputBlob = new Blob([data], { type: 'image/gif' });

                console.log('[GIF] ✅ 转换成功！GIF 大小:', (data.byteLength / 1024 / 1024).toFixed(2), 'MB');
                finishProcessing(outputBlob, outputFileName);
            } finally {
                ffmpeg.off('log', progressListener);
                ffmpeg.off('log', detailedLogListener);
                await safeCleanupFiles(ffmpeg, [inputFileName, outputFileName]);
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
        resetProcessingOutput();
    };

    if (!selectedFile) {
        return (
            <Card className="bg-card border-border">
                <CardContent className="p-6 text-center text-muted-foreground">
                    {t('videoControlPanels.gif.uploadVideo')}
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* GIF 预览 */}
            {gifPreviewUrl && (
                <Card className="bg-card border-border">
                    <CardContent className="p-4">
                        <h3 className="font-medium mb-3">{t('videoControlPanels.gif.preview')}</h3>
                        <div className="relative w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                            <img src={gifPreviewUrl} alt="GIF Preview" className="max-w-full max-h-[400px] md:max-h-[500px] lg:max-h-[600px] object-contain" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 参数控制面板 */}
            <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="w-4 h-4" />
                        <h3 className="font-medium">{t('videoControlPanels.gif.settings')}</h3>
                    </div>

                    {/* FFmpeg 加载状态 */}
                    {ffmpegLoading && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-blue-900 dark:text-blue-100">{t('videoControlPanels.gif.waitingFFmpeg')}</p>
                            </div>
                        </div>
                    )}

                    {ffmpegError && !ffmpegLoaded && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-900 dark:text-red-100 font-medium">{t('videoControlPanels.gif.ffmpegError')}</p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">{ffmpegError}</p>
                        </div>
                    )}

                    {/* 时间范围选择 */}
                    <div className="space-y-3">
                        <Label>{t('videoControlPanels.gif.timeRange')} - {t('videoControlPanels.gif.selectedDuration')} <span className="font-medium text-foreground">{Math.round(endTime - startTime)}s</span></Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1">{t('videoControlPanels.gif.startTime')}</Label>
                                <Input
                                    type="time"
                                    step="1"
                                    value={secondsToTimeString(startTime)}
                                    onChange={(e) => setGifStartTime(timeStringToSeconds(e.target.value))}
                                    disabled={processingState.isProcessing || !videoMetadata}
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1">{t('videoControlPanels.gif.endTime')}</Label>
                                <Input
                                    type="time"
                                    step="1"
                                    value={secondsToTimeString(endTime)}
                                    onChange={(e) => setGifEndTime(timeStringToSeconds(e.target.value))}
                                    disabled={processingState.isProcessing || !videoMetadata}
                                />
                            </div>
                        </div>

                        {timeRangeError && (
                            <p className="text-xs text-red-600">{timeRangeError}</p>
                        )}
                    </div>

                    {/* FPS 选择 */}
                    <div className="space-y-2">
                        <Label>{t('videoControlPanels.gif.fps')}</Label>
                        <Select value={String(fps)} onValueChange={(v) => setFps(Number(v))} disabled={processingState.isProcessing}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">{t('videoControlPanels.gif.fps10')}</SelectItem>
                                <SelectItem value="30">{t('videoControlPanels.gif.fps30')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {t('videoControlPanels.gif.fpsHint')}
                        </p>
                    </div>

                    {/* 分辨率选择 */}
                    <div className="space-y-2">
                        <Label>{t('videoControlPanels.gif.resolution')}</Label>
                        <Select value={String(resolution)} onValueChange={(v) => setResolution(Number(v))} disabled={processingState.isProcessing}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="480">{t('videoControlPanels.gif.res480')}</SelectItem>
                                <SelectItem value="720">{t('videoControlPanels.gif.res720')}</SelectItem>
                                <SelectItem value="0">{t('videoControlPanels.gif.originalSize')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {t('videoControlPanels.gif.resHint')}
                        </p>
                    </div>

                    {!processingState.outputFile ? (
                        <Button
                            onClick={handleStartProcessing}
                            disabled={!canStartProcessing || processingState.isProcessing}
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
                            <Button onClick={handleStartProcessing} variant="outline" className="w-full" size="sm">
                                {t('videoControlPanels.gif.reconvert')}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};