'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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
    const mediaMetadata = useAppStore(state => state.mediaMetadata);
    const processingState = useAppStore(state => state.processingState);
    const startProcessing = useAppStore(state => state.startProcessing);
    const finishProcessing = useAppStore(state => state.finishProcessing);
    const setProcessingError = useAppStore(state => state.setProcessingError);
    const updateProcessingState = useAppStore(state => state.updateProcessingState);
    const resetAppStore = useAppStore(state => state.reset);

    const { ffmpeg, isMultiThread, isLoaded: ffmpegLoaded } = useFFmpegStore();

    // Local state for GIF parameters
    const [startTime, setStartTime] = useState<number>(0);
    const [duration, setDuration] = useState<number>(5);
    const [fps, setFps] = useState<number>(10);
    const [width, setWidth] = useState<number>(320);

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
        }
    }, [mediaMetadata]);

    const canStartProcessing = selectedFile && ffmpeg && ffmpegLoaded && !processingState.isProcessing;

    const handleStartProcessing = async () => {
        if (!selectedFile || !ffmpeg || !canStartProcessing) return;

        try {
            startProcessing();

            const inputExtension = getFileExtension(selectedFile.name);
            const inputFileName = `input.${inputExtension}`;
            const outputFileName = `output.gif`;

            await ffmpeg.writeFile(inputFileName, await fetchFile(selectedFile));

            const progressListener = createFFmpegProgressListener((progress, step, remainingTime) => {
                updateProcessingState({ progress, currentStep: step, remainingTime });
            }, 'video'); // Reuse 'video' type for general progress or add 'gif' support in helper if needed

            ffmpeg.on('log', progressListener);

            try {
                // 使用两步法：先裁剪视频，再转GIF
                const tempClipFileName = 'temp_clip.mp4';
                
                updateProcessingState({ progress: 10, currentStep: '正在裁剪视频片段...' });

                // 步骤1：裁剪视频片段（使用copy模式，速度快）
                const clipArgs: string[] = [];
                if (isMultiThread) {
                    clipArgs.push('-threads', '0');
                }
                clipArgs.push(
                    '-ss', startTime.toString(),
                    '-t', duration.toString(),
                    '-i', inputFileName,
                    '-c', 'copy',
                    tempClipFileName
                );

                console.log('[GIF Step 1] Clipping video:', clipArgs.join(' '));
                let ret = await ffmpeg.exec(clipArgs);
                if (ret !== 0) {
                    throw new Error('Failed to clip video');
                }

                updateProcessingState({ progress: 40, currentStep: '正在转换为GIF...' });

                // 步骤2：使用单命令palette滤镜链生成高质量GIF
                // split将流分成两份，一份生成palette，另一份使用palette生成GIF
                const gifArgs: string[] = [];
                if (isMultiThread) {
                    gifArgs.push('-threads', '0');
                }
                gifArgs.push(
                    '-i', tempClipFileName,
                    '-vf', `fps=${fps},scale=${width}:-1,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse`,
                    '-loop', '0',
                    outputFileName
                );

                console.log('[GIF Step 2] Converting to GIF with palette:', gifArgs.join(' '));
                ret = await ffmpeg.exec(gifArgs);
                if (ret !== 0) {
                    throw new Error('Failed to convert to GIF');
                }

                updateProcessingState({ progress: 95, currentStep: '即将完成...' });

                const data = await ffmpeg.readFile(outputFileName);
                const outputBlob = new Blob([data], { type: 'image/gif' });

                finishProcessing(outputBlob, outputFileName);
            } finally {
                ffmpeg.off('log', progressListener);
                await safeCleanupFiles(ffmpeg, [inputFileName, outputFileName, tempClipFileName]);
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
            <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-4">
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

                    {/* Controls */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                        <div className="flex items-center gap-2 mb-2">
                            <Settings2 className="w-4 h-4" />
                            <h3 className="font-medium">{t('videoControlPanels.gif.settings')}</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t('videoControlPanels.gif.startTime')}</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={startTime}
                                    onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                                    disabled={processingState.isProcessing}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t('videoControlPanels.gif.duration')}</Label>
                                <Input
                                    type="number"
                                    min="0.1"
                                    step="0.1"
                                    value={duration}
                                    onChange={(e) => setDuration(parseFloat(e.target.value) || 1)}
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
                                        <SelectItem value="24">24 fps (电影)</SelectItem>
                                        <SelectItem value="30">30 fps (流畅)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
