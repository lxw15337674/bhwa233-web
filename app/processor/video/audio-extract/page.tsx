'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Play } from 'lucide-react';
import {
    convertAudio,
    downloadBlob,
    SUPPORTED_VIDEO_FORMATS,
    getFileExtension
} from '@/utils/audioConverter';
import { useMediaProcessing } from '@/hooks/useMediaProcessing';
import { useVideoProcessorStore } from '@/stores/media-processor/video-store';
import { useFFmpegManager } from '@/hooks/useFFmpeg';

export const AudioExtractControlPanel: React.FC = () => {
    const selectedFile = useVideoProcessorStore((s) => s.inputVideo);
    const {
        ffmpeg,
        isMultiThread,
        ffmpegLoaded,
    } = useFFmpegManager();

    const {
        processingState,
        startProcessing,
        finishProcessing,
        setError,
        updateProgress,
        resetState
    } = useMediaProcessing();

    // 检查是否可以开始处理
    const canStartProcessing = selectedFile &&
        ffmpeg &&
        ffmpegLoaded &&
        !processingState.isProcessing &&
        SUPPORTED_VIDEO_FORMATS.includes(getFileExtension(selectedFile.name));

    // 处理音频提取 - 使用默认参数
    const handleStartProcessing = async () => {
        if (!selectedFile || !ffmpeg || !canStartProcessing) return;

        try {
            startProcessing();

            const outputFileName = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.mp3`;
            const outputBlob = await convertAudio(
                selectedFile,
                ffmpeg,
                'mp3', // 固定输出格式
                'original', // 固定质量模式
                isMultiThread,
                null, // 不使用音频信息
                undefined, // 不使用编解码器信息
                updateProgress
            );

            finishProcessing(outputBlob, outputFileName);
        } catch (error) {
            console.error('Audio extraction failed:', error);
            setError(error instanceof Error ? error.message : '音频提取失败');
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
                        {/* 输出格式选择 */}
                        {!processingState.outputFile ? (
                            <Button
                                onClick={handleStartProcessing}
                                disabled={!canStartProcessing}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                size="lg"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                {processingState.isProcessing ? '正在提取音频...' : '开始提取音频'}
                            </Button>
                        ) : (
                            <div className="space-y-2">
                                    {/* 音频播放 */}
                                    {processingState.outputFile && (
                                        <div className="mt-4">
                                            <label className="text-sm font-medium text-foreground mb-2 block">音频预览</label>
                                            <audio
                                                controls
                                                src={URL.createObjectURL(processingState.outputFile)}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                <Button
                                    onClick={handleDownload}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    size="lg"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    下载音频文件
                                </Button>
                                <Button
                                    onClick={handleRestart}
                                    variant="outline"
                                    className="w-full"
                                    size="sm"
                                >
                                    重新提取
                                    </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AudioExtractControlPanel; 