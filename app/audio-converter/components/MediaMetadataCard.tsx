import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    MediaMetadata,
    formatFileSize,
    formatDuration,
    formatResolution,
    formatChannelLayout
} from '@/utils/audioConverter';
import { File, Music, Video, Info } from 'lucide-react';

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
    if (!selectedFile) return null;

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <File className="w-4 h-4" />
                    媒体信息
                </CardTitle>
            </CardHeader>

            <CardContent className="pt-0 space-y-4">
                {/* 文件名 */}
                <div className="bg-muted/20 rounded-lg p-3">
                    <div className="text-xs text-muted-foreground mb-1">文件名</div>
                    <div className="text-sm font-mono break-words line-clamp-2" title={selectedFile.name}>
                        {selectedFile.name}
                    </div>
                </div>

                {/* 基础信息网格 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-muted/20 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground mb-1">文件大小</div>
                        <div className="text-sm font-medium">
                            {formatFileSize(selectedFile.size / (1024 * 1024))}
                        </div>
                    </div>

                    {mediaMetadata && (
                        <>
                            <div className="bg-muted/20 rounded-lg p-3">
                                <div className="text-xs text-muted-foreground mb-1">时长</div>
                                <div className="text-sm font-medium">
                                    {formatDuration(mediaMetadata.totalDuration)}
                                </div>
                            </div>
                            <div className="bg-muted/20 rounded-lg p-3">
                                <div className="text-xs text-muted-foreground mb-1">容器格式</div>
                                <div className="text-sm font-medium uppercase">
                                    {mediaMetadata.container || '未知'}
                                </div>
                            </div>
                            <div className="bg-muted/20 rounded-lg p-3">
                                <div className="text-xs text-muted-foreground mb-1">总码率</div>
                                <div className="text-sm font-medium">
                                    {mediaMetadata.overallBitrate > 0 ? `${mediaMetadata.overallBitrate} kbps` : '未知'}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* 流信息网格 */}
                {mediaMetadata && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 音频流信息 */}
                        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-2">
                                <Music className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">音频流</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <div className="text-muted-foreground">编码:</div>
                                    <div className="font-medium uppercase">{mediaMetadata.audio.codec}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">码率:</div>
                                    <div className="font-medium">
                                        {mediaMetadata.audio.bitrate > 0 ? `${mediaMetadata.audio.bitrate} kbps` : '未知'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">采样率:</div>
                                    <div className="font-medium">
                                        {mediaMetadata.audio.sampleRate > 0 ? `${mediaMetadata.audio.sampleRate} Hz` : '未知'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">声道:</div>
                                    <div className="font-medium">
                                        {formatChannelLayout(mediaMetadata.audio.channels, mediaMetadata.audio.channelLayout)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 视频流信息 */}
                        {mediaMetadata.video && (
                            <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Video className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">视频流</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                        <div className="text-muted-foreground">编码:</div>
                                        <div className="font-medium uppercase">{mediaMetadata.video.codec}</div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">分辨率:</div>
                                        <div className="font-medium">
                                            {formatResolution(mediaMetadata.video.width, mediaMetadata.video.height)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">帧率:</div>
                                        <div className="font-medium">
                                            {mediaMetadata.video.frameRate > 0 ? `${mediaMetadata.video.frameRate} fps` : '未知'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-muted-foreground">码率:</div>
                                        <div className="font-medium">
                                            {mediaMetadata.video.bitrate > 0 ? `${mediaMetadata.video.bitrate} kbps` : '未知'}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <div className="text-muted-foreground">像素格式:</div>
                                        <div className="font-medium uppercase">
                                            {mediaMetadata.video.pixelFormat || '未知'}
                                        </div>
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
                        <div className="text-sm text-yellow-700 dark:text-yellow-300">
                            {analyzeError}
                            <div className="mt-1 text-yellow-600 dark:text-yellow-400 text-xs">
                                无法获取详细媒体信息，但可以正常转换
                            </div>
                        </div>
                    </div>
                )}

                {/* 无媒体信息时的提示 */}
                {!isAnalyzing && !mediaMetadata && !analyzeError && (
                    <div className="p-3 bg-muted/20 rounded-lg border">
                        <div className="text-sm text-muted-foreground">
                            {!ffmpegLoaded ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                                    等待 FFmpeg 加载完成后分析媒体信息...
                                </div>
                            ) : (
                                <div>
                                        <div className="mb-2 flex items-center gap-1">
                                            <Info className="w-4 h-4" />
                                        FFmpeg 已就绪，准备分析媒体信息
                                    </div>
                                    {onRetryAnalysis && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                            onClick={onRetryAnalysis}
                                                className="text-xs h-7"
                                        >
                                            重新分析
                                            </Button>
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
