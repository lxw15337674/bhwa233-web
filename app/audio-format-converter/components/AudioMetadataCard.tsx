'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileAudio, Clock, Volume2, Disc, Music } from 'lucide-react';
import { MediaMetadata, formatFileSize } from '@/utils/audioConverter';

interface AudioMetadataCardProps {
    selectedFile: File | null;
    mediaMetadata: MediaMetadata | null;
    isAnalyzing: boolean;
    analyzeError: string | null;
    ffmpegLoaded: boolean;
    onRetryAnalysis: () => void;
}

export const AudioMetadataCard: React.FC<AudioMetadataCardProps> = ({
    selectedFile,
    mediaMetadata,
    isAnalyzing,
    analyzeError,
    ffmpegLoaded,
    onRetryAnalysis
}) => {
    if (!selectedFile) {
        return null;
    }

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const formatBitrate = (bitrate: number) => {
        return `${Math.round(bitrate / 1000)} kbps`;
    };

    const formatSampleRate = (sampleRate: number) => {
        return `${(sampleRate / 1000).toFixed(1)} kHz`;
    };

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-4">
                <div className="space-y-4">
                    {/* 基本文件信息 */}
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                            <FileAudio className="h-4 w-4 text-blue-500" />
                            文件信息
                        </label>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">文件名:</span>
                                <span className="text-foreground max-w-48 truncate" title={selectedFile.name}>
                                    {selectedFile.name}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">文件大小:</span>
                                <span className="text-foreground">
                                    {formatFileSize(selectedFile.size / (1024 * 1024))}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 分析状态 */}
                    {isAnalyzing && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm text-blue-700 dark:text-blue-300">正在分析音频文件...</span>
                            </div>
                        </div>
                    )}

                    {/* 分析错误 */}
                    {analyzeError && (
                        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                {analyzeError}
                                <div className="mt-1 text-yellow-600 dark:text-yellow-400">
                                    无法显示详细信息，但仍可进行转换
                                </div>
                                {ffmpegLoaded && (
                                    <button
                                        onClick={onRetryAnalysis}
                                        className="text-primary hover:underline text-xs mt-1 block"
                                    >
                                        重新分析
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 音频详细信息 */}
                    {mediaMetadata && mediaMetadata.mediaType === 'audio' && (
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                <Music className="h-4 w-4 text-green-500" />
                                音频属性
                            </label>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">编码:</span>
                                    <span className="text-foreground">{mediaMetadata.audio.codec.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">时长:</span>
                                    <span className="text-foreground">{formatDuration(mediaMetadata.totalDuration)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">比特率:</span>
                                    <span className="text-foreground">{formatBitrate(mediaMetadata.audio.bitrate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">采样率:</span>
                                    <span className="text-foreground">{formatSampleRate(mediaMetadata.audio.sampleRate)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">声道:</span>
                                    <span className="text-foreground">{mediaMetadata.audio.channels} 声道</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">布局:</span>
                                    <span className="text-foreground">{mediaMetadata.audio.channelLayout}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 视频文件提示 */}
                    {mediaMetadata && mediaMetadata.mediaType === 'video' && (
                        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                                检测到视频文件。如需提取音频，请前往
                                <a href="/audio-converter" className="underline ml-1 hover:text-yellow-600">视频音频提取</a> 页面。
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* 等待分析状态 */}
                    {!isAnalyzing && !mediaMetadata && !analyzeError && (
                        <div className="p-3 bg-muted/20 rounded-lg border">
                            <div className="text-xs text-muted-foreground">
                                {!ffmpegLoaded ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                                        等待 FFmpeg 加载完成后分析音频信息...
                                    </div>
                                ) : (
                                    <div>
                                        <div className="mb-1">FFmpeg 已就绪，准备分析音频信息</div>
                                        <button
                                            onClick={onRetryAnalysis}
                                            className="text-primary hover:underline text-xs"
                                        >
                                            开始分析
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
