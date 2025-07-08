'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';
import {
    AUDIO_FORMATS,
    QUALITY_MODES,
    AudioFormat,
    QualityMode,
    AudioInfo,
    MediaMetadata,
    formatFileSize,
    calculateFileSize,
    generateSmartAudioParams
} from '@/utils/audioConverter';

interface AudioConversionSettingsProps {
    outputFormat: AudioFormat;
    qualityMode: QualityMode;
    onOutputFormatChange: (format: AudioFormat) => void;
    onQualityModeChange: (mode: QualityMode) => void;
    ffmpegLoaded: boolean;
    isMultiThread: boolean;
    selectedFile: File | null;
    audioInfo: AudioInfo | null;
    mediaMetadata: MediaMetadata | null;
    isAnalyzing: boolean;
    analyzeError: string | null;
    onRetryAnalysis: () => void;
}

export const AudioConversionSettings: React.FC<AudioConversionSettingsProps> = ({
    outputFormat,
    qualityMode,
    onOutputFormatChange,
    onQualityModeChange,
    ffmpegLoaded,
    isMultiThread,
    selectedFile,
    audioInfo,
    mediaMetadata,
    isAnalyzing,
    analyzeError,
    onRetryAnalysis
}) => {
    // 文件大小预估
    const sizeEstimate = audioInfo ? calculateFileSize(
        audioInfo,
        outputFormat,
        qualityMode,
        mediaMetadata?.audio.codec
    ) : null;

    // 获取智能转换策略描述
    const smartParams = selectedFile && mediaMetadata ?
        generateSmartAudioParams(
            audioInfo,
            mediaMetadata.audio.codec,
            outputFormat,
            qualityMode
        ) : null;

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-4">
                <div className="space-y-4">
                    {/* 输出格式选择 */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-foreground">
                                输出格式
                            </label>
                            {/* 多线程模式状态 */}
                            {ffmpegLoaded && (
                                <span className={`inline-flex items-center gap-1 text-xs ${isMultiThread ? 'text-green-600' : 'text-blue-600'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isMultiThread ? 'bg-green-500' : 'bg-blue-500'
                                        }`}></span>
                                    {isMultiThread ? '多线程' : '单线程'}模式
                                </span>
                            )}
                        </div>
                        <Select
                            value={outputFormat}
                            onValueChange={onOutputFormatChange}
                        >
                            <SelectTrigger className="bg-background border-border">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border">
                                {Object.entries(AUDIO_FORMATS).map(([key, format]) => (
                                    <SelectItem key={key} value={key} className="hover:bg-accent">
                                        {format.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 音频质量选择 */}
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            音频质量
                        </label>
                        <div className="space-y-2">
                            {Object.entries(QUALITY_MODES).map(([key, mode]) => (
                                <div
                                    key={key}
                                    className={`border rounded-lg p-3 cursor-pointer transition-all ${qualityMode === key
                                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                        : 'border-border hover:border-muted-foreground hover:bg-accent'
                                        }`}
                                    onClick={() => onQualityModeChange(key as QualityMode)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{mode.icon}</span>
                                            <div>
                                                <div className="font-medium text-sm">{mode.label}</div>
                                                <div className="text-xs text-muted-foreground">{mode.description}</div>
                                                {/* 显示智能转换策略 */}
                                                {smartParams && qualityMode === key && (
                                                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                        {smartParams.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {qualityMode === key && (
                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 音频信息和预估部分 */}
                    {selectedFile && (
                        <div className="pt-4 border-t border-border/50">
                            <label className="text-sm font-medium text-foreground mb-3 block">
                                转换预览
                            </label>

                            {/* 文件大小预估 */}
                            {sizeEstimate && (
                                <div className="p-3 bg-muted/30 rounded-lg border mb-3">
                                    <div className="text-xs text-muted-foreground mb-1">
                                        预估输出文件大小
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-sm font-medium text-foreground">
                                                {formatFileSize(sizeEstimate.estimatedSizeMB)}
                                            </span>
                                            {sizeEstimate.compressionRatio > 0 && (
                                                <span className="text-xs text-green-600 ml-2">
                                                    压缩 {sizeEstimate.compressionRatio.toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            原文件: {formatFileSize(selectedFile.size / (1024 * 1024))}
                                        </div>
                                    </div>
                                    {sizeEstimate.note && (
                                        <div className="text-xs text-blue-600 mt-1">{sizeEstimate.note}</div>
                                    )}

                                    {/* 音频信息显示 */}
                                    <div className="mt-2 pt-2 border-t border-border/50">
                                        <div className="text-xs text-muted-foreground space-y-1">
                                            <div className="flex justify-between">
                                                <span>时长:</span>
                                                <span>
                                                    {Math.floor(audioInfo!.duration / 60)}:
                                                    {(audioInfo!.duration % 60).toFixed(1).padStart(4, '0')}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>原始码率:</span>
                                                <span>
                                                    {audioInfo!.bitrate > 0 ? `${audioInfo!.bitrate} kbps` : '未知'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 音频分析状态 */}
                            {isAnalyzing && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span className="text-sm text-blue-700 dark:text-blue-300">正在分析音频信息...</span>
                                    </div>
                                </div>
                            )}

                            {/* 分析错误提示 */}
                            {analyzeError && (
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-3">
                                    <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                        {analyzeError}
                                        <div className="mt-1 text-yellow-600 dark:text-yellow-400">
                                            无法显示精确预估，请直接进行转换
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 无音频信息时的提示 */}
                            {!isAnalyzing && !audioInfo && !analyzeError && (
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
                                                    重新分析
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
