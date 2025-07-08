'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, FileVideo, FileAudio, AlertTriangle } from 'lucide-react';
import { MediaMetadata, formatDuration, formatResolution, formatChannelLayout } from '@/utils/audioConverter';

interface UnifiedMediaMetadataCardProps {
  selectedFile: File | null;
  mediaMetadata: MediaMetadata | null;
  isAnalyzing: boolean;
  analyzeError: string | null;
  ffmpegLoaded: boolean;
  onRetryAnalysis?: () => void;
}

export const UnifiedMediaMetadataCard: React.FC<UnifiedMediaMetadataCardProps> = ({
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

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    } else {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {mediaMetadata?.mediaType === 'video' ? (
            <FileVideo className="h-5 w-5 text-blue-500" />
          ) : (
            <FileAudio className="h-5 w-5 text-green-500" />
          )}
          媒体信息
          {mediaMetadata && (
            <Badge variant="secondary" className="ml-auto">
              {mediaMetadata.container}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 基本文件信息 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">文件名</div>
            <div className="font-medium truncate" title={selectedFile.name}>
              {selectedFile.name}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">文件大小</div>
            <div className="font-medium">
              {formatFileSize(selectedFile.size)}
            </div>
          </div>
        </div>

        {/* 分析状态 */}
        {isAnalyzing && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            <span className="text-sm text-blue-700 dark:text-blue-300">
              正在分析媒体信息...
            </span>
          </div>
        )}

        {/* 分析错误 */}
        {analyzeError && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  {analyzeError}
                </div>
                {onRetryAnalysis && ffmpegLoaded && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetryAnalysis}
                    className="h-7 text-xs"
                  >
                    重试分析
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 等待FFmpeg加载 */}
        {!ffmpegLoaded && !analyzeError && (
          <div className="p-3 bg-muted/20 rounded-lg border">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
              <span className="text-sm text-muted-foreground">
                等待 FFmpeg 加载完成后分析媒体信息...
              </span>
            </div>
          </div>
        )}

        {/* 媒体元数据 */}
        {mediaMetadata && (
          <div className="space-y-4">
            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">时长</div>
                <div className="font-medium">
                  {formatDuration(mediaMetadata.totalDuration)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">总码率</div>
                <div className="font-medium">
                  {mediaMetadata.overallBitrate > 0 ? `${mediaMetadata.overallBitrate} kbps` : '未知'}
                </div>
              </div>
            </div>

            {/* 视频信息 */}
            {mediaMetadata.video && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <FileVideo className="h-4 w-4 text-blue-500" />
                  视频流信息
                </h4>
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
                </div>
              </div>
            )}

            {/* 音频信息 */}
            {mediaMetadata.audio && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                  <FileAudio className="h-4 w-4 text-green-500" />
                  音频流信息
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">编码:</div>
                    <div className="font-medium uppercase">{mediaMetadata.audio.codec}</div>
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
                  <div>
                    <div className="text-muted-foreground">码率:</div>
                    <div className="font-medium">
                      {mediaMetadata.audio.bitrate > 0 ? `${mediaMetadata.audio.bitrate} kbps` : '未知'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 