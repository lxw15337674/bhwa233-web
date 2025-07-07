import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    MediaMetadata,
    formatFileSize,
    formatDuration,
    formatResolution,
    formatChannelLayout
} from '@/utils/audioConverter';
import { ChevronDown, ChevronUp, File, Music, Video, Info } from 'lucide-react';

interface MediaMetadataCardProps {
    selectedFile: File | null;
    mediaMetadata: MediaMetadata | null;
    isAnalyzing: boolean;
    analyzeError: string | null;
    ffmpegLoaded: boolean;
    onRetryAnalysis?: () => void;
}

export const MediaMetadataCard: React.FC<MediaMetadataCardProps> = ({
    selectedFile,
    mediaMetadata,
    isAnalyzing,
    analyzeError,
    ffmpegLoaded,
    onRetryAnalysis
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!selectedFile) return null;

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <File className="w-4 h-4" />
                    媒体信息
                    {mediaMetadata && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="ml-auto h-6 px-2 text-xs"
                        >
                            {isExpanded ? (
                                <>
                                    <ChevronUp className="w-3 h-3 mr-1" />
                                    收起
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-3 h-3 mr-1" />
                                    详细
                                </>
                            )}
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-0 space-y-3">
                {/* 基础文件信息 */}
                <div className="space-y-2">
                    <div className="flex justify-between text-xs items-start gap-2">
                        <span className="text-muted-foreground shrink-0">文件名:</span>
                        <span className="text-foreground font-mono text-right break-words max-w-[80%] line-clamp-3 leading-tight" title={selectedFile.name}>
                            {selectedFile.name}
                        </span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">文件大小:</span>
                        <span className="text-foreground">
                            {formatFileSize(selectedFile.size / (1024 * 1024))}
                        </span>
                    </div>

                    {mediaMetadata && (
                        <>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">时长:</span>
                                <span className="text-foreground">
                                    {formatDuration(mediaMetadata.totalDuration)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">容器格式:</span>
                                <span className="text-foreground uppercase">
                                    {mediaMetadata.container || '未知'}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">总码率:</span>
                                <span className="text-foreground">
                                    {mediaMetadata.overallBitrate > 0 ? `${mediaMetadata.overallBitrate} kbps` : '未知'}
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* 详细信息（可展开） */}
                {isExpanded && mediaMetadata && (
                    <div className="space-y-4 pt-3 border-t border-border/50">
                        {/* 音频流信息 */}
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Music className="w-3 h-3 text-blue-500" />
                                <span className="text-xs font-medium text-foreground">音频流</span>
                            </div>
                            <div className="pl-5 space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">编码:</span>
                                    <span className="text-foreground uppercase">{mediaMetadata.audio.codec}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">码率:</span>
                                    <span className="text-foreground">
                                        {mediaMetadata.audio.bitrate > 0 ? `${mediaMetadata.audio.bitrate} kbps` : '未知'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">采样率:</span>
                                    <span className="text-foreground">
                                        {mediaMetadata.audio.sampleRate > 0 ? `${mediaMetadata.audio.sampleRate} Hz` : '未知'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">声道:</span>
                                    <span className="text-foreground">
                                        {formatChannelLayout(mediaMetadata.audio.channels, mediaMetadata.audio.channelLayout)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 视频流信息（如果存在） */}
                        {mediaMetadata.video && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Video className="w-3 h-3 text-purple-500" />
                                    <span className="text-xs font-medium text-foreground">视频流</span>
                                </div>
                                <div className="pl-5 space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">编码:</span>
                                        <span className="text-foreground uppercase">{mediaMetadata.video.codec}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">分辨率:</span>
                                        <span className="text-foreground">
                                            {formatResolution(mediaMetadata.video.width, mediaMetadata.video.height)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">帧率:</span>
                                        <span className="text-foreground">
                                            {mediaMetadata.video.frameRate > 0 ? `${mediaMetadata.video.frameRate} fps` : '未知'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">码率:</span>
                                        <span className="text-foreground">
                                            {mediaMetadata.video.bitrate > 0 ? `${mediaMetadata.video.bitrate} kbps` : '未知'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">像素格式:</span>
                                        <span className="text-foreground uppercase">
                                            {mediaMetadata.video.pixelFormat || '未知'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 分析状态 */}
                {isAnalyzing && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-blue-700 dark:text-blue-300">正在分析媒体信息...</span>
                        </div>
                    </div>
                )}

                {/* 分析错误提示 */}
                {analyzeError && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <div className="text-xs text-yellow-700 dark:text-yellow-300">
                            {analyzeError}
                            <div className="mt-1 text-yellow-600 dark:text-yellow-400">
                                无法获取详细媒体信息，但可以正常转换
                            </div>
                        </div>
                    </div>
                )}

                {/* 无媒体信息时的提示 */}
                {!isAnalyzing && !mediaMetadata && !analyzeError && (
                    <div className="p-3 bg-muted/20 rounded-lg border">
                        <div className="text-xs text-muted-foreground">
                            {!ffmpegLoaded ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                                    等待 FFmpeg 加载完成后分析媒体信息...
                                </div>
                            ) : (
                                <div>
                                    <div className="mb-1 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        FFmpeg 已就绪，准备分析媒体信息
                                    </div>
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
            </CardContent>
        </Card>
    );
};
