'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Download, Settings2 } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useAppStore } from '@/stores/media-processor/app-store';
import { useFFmpegStore } from '@/stores/ffmpeg-store';
import { fetchFile } from '@ffmpeg/util';
import { downloadBlob, getFileExtension } from '@/utils/audioConverter';
import { safeCleanupFiles, createFFmpegProgressListener } from '@/utils/ffmpeg-helpers';

export const VideoToGifControlPanel: React.FC = () => {
    const { t } = useTranslation();

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

    // 计算文件大小预估
    const estimatedSize = useMemo(() => {
        if (!videoMetadata) return 0;

        const duration = endTime - startTime;
        const width = resolution === 0 ? videoMetadata.width : resolution;
        const height = resolution === 0 ? videoMetadata.height : Math.round(resolution * (videoMetadata.height / videoMetadata.width));

        // 粗略估算：每帧 = (宽 * 高) / 压缩率
        const compressionRatio = 20;
        const bytesPerFrame = (width * height) / compressionRatio;
        const totalFrames = duration * fps;
        const estimatedBytes = totalFrames * bytesPerFrame;

        return estimatedBytes / (1024 * 1024); // 转换为 MB
    }, [videoMetadata, startTime, endTime, fps, resolution]);

    // 时间范围验证
    const timeRangeError = useMemo(() => {
        if (!videoMetadata) return null;
        if (endTime <= startTime) return '结束时间必须大于开始时间';
        if (endTime - startTime > 30) return '最多选择30秒';
        if (endTime > videoMetadata.duration) return '结束时间超出视频长度';
        if (startTime < 0) return '开始时间不能小于0';
        return null;
    }, [startTime, endTime, videoMetadata]);

    const canStartProcessing = selectedFile && ffmpeg && ffmpegLoaded && !processingState.isProcessing && !timeRangeError && videoMetadata;

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
            }, 'video');

            const detailedLogListener = ({ type, message }: { type: string; message: string }) => {
                console.log(`[FFmpeg ${type}] ${message}`);
                if (type === 'fferr' || message.includes('Error') || message.includes('error')) {
                    console.error('[FFmpeg Error]', message);
                }
            };

            ffmpeg.on('log', progressListener);
            ffmpeg.on('log', detailedLogListener);

            try {
                updateProcessingState({ progress: 10, currentStep: '正在转换视频为 GIF...' });

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
                    throw new Error('GIF 转换失败');
                }

                updateProcessingState({ progress: 95, currentStep: '即将完成...' });

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
            setProcessingError(error instanceof Error ? error.message : 'GIF 转换失败');
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
                    请先上传视频文件
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
                        <h3 className="font-medium mb-3">GIF 预览</h3>
                        <div className="relative w-full rounded-lg overflow-hidden bg-muted flex items-center justify-center min-h-[200px]">
                            <img src={gifPreviewUrl} alt="GIF Preview" className="max-w-full max-h-full" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* 参数控制面板 */}
            <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="w-4 h-4" />
                        <h3 className="font-medium">GIF 设置</h3>
                    </div>

                    {/* FFmpeg 加载状态 */}
                    {ffmpegLoading && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-blue-900 dark:text-blue-100">正在加载 FFmpeg...</p>
                            </div>
                        </div>
                    )}

                    {ffmpegError && !ffmpegLoaded && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-900 dark:text-red-100 font-medium">FFmpeg 加载失败</p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">{ffmpegError}</p>
                        </div>
                    )}

                    {/* 时间范围选择 */}
                    <div className="space-y-3">
                        <Label>时间范围（秒）</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1">开始时间</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={videoMetadata ? videoMetadata.duration : 0}
                                    step={1}
                                    value={Math.round(startTime)}
                                    onChange={(e) => setGifStartTime(Number(e.target.value))}
                                    disabled={processingState.isProcessing || !videoMetadata}
                                />
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1">结束时间</Label>
                                <Input
                                    type="number"
                                    min={startTime + 1}
                                    max={videoMetadata ? Math.min(startTime + 30, videoMetadata.duration) : 30}
                                    step={1}
                                    value={Math.round(endTime)}
                                    onChange={(e) => setGifEndTime(Number(e.target.value))}
                                    disabled={processingState.isProcessing || !videoMetadata}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                                选中时长: <span className="font-medium text-foreground">{Math.round(endTime - startTime)}秒</span>
                            </span>
                            {videoMetadata && (
                                <span className="text-muted-foreground">
                                    视频总长: {Math.round(videoMetadata.duration)}秒
                                </span>
                            )}
                        </div>
                        {timeRangeError && (
                            <p className="text-xs text-red-600">{timeRangeError}</p>
                        )}
                    </div>

                    {/* FPS 选择 */}
                    <div className="space-y-2">
                        <Label>帧率 (FPS)</Label>
                        <Select value={String(fps)} onValueChange={(v) => setFps(Number(v))} disabled={processingState.isProcessing}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="10">10 FPS - 标准</SelectItem>
                                <SelectItem value="30">30 FPS - 流畅</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            较低的 FPS 会减小文件大小
                        </p>
                    </div>

                    {/* 分辨率选择 */}
                    <div className="space-y-2">
                        <Label>分辨率</Label>
                        <Select value={String(resolution)} onValueChange={(v) => setResolution(Number(v))} disabled={processingState.isProcessing}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0">保持原始</SelectItem>
                                <SelectItem value="480">480p - 标准</SelectItem>
                                <SelectItem value="720">720p - 高清</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            较高的分辨率会增加文件大小
                        </p>
                    </div>

                    {/* 文件大小预估 */}
                    {videoMetadata && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">预估文件大小</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {estimatedSize.toFixed(2)} MB
                            </p>
                            {estimatedSize > 10 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                                    ⚠️ 文件较大，建议降低参数
                                </p>
                            )}
                        </div>
                    )}


                    {/* 转换按钮 */}
                    {!processingState.outputFile ? (
                        <Button
                            onClick={handleStartProcessing}
                            disabled={!canStartProcessing || processingState.isProcessing}
                            className="w-full"
                            size="lg"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            {processingState.isProcessing ? '正在转换...' : '开始转换'}
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <Button onClick={handleDownload} className="w-full" variant="default" size="lg">
                                <Download className="w-4 h-4 mr-2" />
                                    下载 GIF
                            </Button>
                            <Button onClick={handleRestart} variant="outline" className="w-full" size="sm">
                                    重新转换
                            </Button>
                            </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
