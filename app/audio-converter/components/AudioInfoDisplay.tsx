import React from 'react';
import { AudioInfo, AudioFormat, QualityMode, formatFileSize, calculateFileSize } from '@/utils/audioConverter';

interface AudioInfoDisplayProps {
    selectedFile: File | null;
    audioInfo: AudioInfo | null;
    outputFormat: AudioFormat;
    qualityMode: QualityMode;
    isAnalyzing: boolean;
    analyzeError: string | null;
    ffmpegLoaded: boolean;
    onRetryAnalysis?: () => void;
}

export const AudioInfoDisplay: React.FC<AudioInfoDisplayProps> = ({
    selectedFile,
    audioInfo,
    outputFormat,
    qualityMode,
    isAnalyzing,
    analyzeError,
    ffmpegLoaded,
    onRetryAnalysis
}) => {
    if (!selectedFile) return null;

    // 文件大小预估
    const sizeEstimate = audioInfo ? calculateFileSize(audioInfo, outputFormat, qualityMode, '') : null;

    return (
        <div className="space-y-3">
            {/* 文件大小预估 */}
            {sizeEstimate && (
                <div className="p-3 bg-muted/30 rounded-lg border">
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
                </div>
            )}

            {/* 音频分析状态 */}
            {isAnalyzing && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-blue-700 dark:text-blue-300">正在分析音频信息...</span>
                    </div>
                </div>
            )}

            {/* 分析错误提示 */}
            {analyzeError && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
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
                                {onRetryAnalysis && (
                                    <button
                                        onClick={onRetryAnalysis}
                                        className="text-primary hover:underline text-xs"
                                    >
                                        重新分析
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
