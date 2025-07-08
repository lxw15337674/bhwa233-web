'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Play, Pause, FileAudio, FileVideo } from 'lucide-react';
import { downloadBlob } from '@/utils/audioConverter';

interface UnifiedOutputPreviewProps {
  outputFile: Blob | null;
  outputFileName: string;
  mediaType: 'video' | 'audio';
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  mediaRef?: React.RefObject<HTMLAudioElement | HTMLVideoElement | null>;
}

export const UnifiedOutputPreview: React.FC<UnifiedOutputPreviewProps> = ({
  outputFile,
  outputFileName,
  mediaType,
  isPlaying,
  onPlay,
  onPause,
  onEnded,
  mediaRef
}) => {
  if (!outputFile) {
    return null;
  }

  const handleDownload = () => {
    downloadBlob(outputFile, outputFileName);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

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
          {mediaType === 'video' ? (
            <FileVideo className="h-5 w-5 text-blue-500" />
          ) : (
            <FileAudio className="h-5 w-5 text-green-500" />
          )}
          输出文件
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 文件信息 */}
        <div className="space-y-2">
          <div className="text-sm">
            <div className="text-muted-foreground mb-1">文件名</div>
            <div className="font-medium break-all">
              {outputFileName}
            </div>
          </div>
          
          <div className="text-sm">
            <div className="text-muted-foreground mb-1">文件大小</div>
            <div className="font-medium">
              {formatFileSize(outputFile.size)}
            </div>
          </div>
        </div>

        {/* 媒体预览 */}
        <div className="space-y-3">
          {mediaType === 'video' ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={URL.createObjectURL(outputFile)}
              className="w-full rounded border"
              controls
              onEnded={onEnded}
              onPlay={onPlay}
              onPause={onPause}
            />
          ) : (
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePlayPause}
                className="h-10 w-10 p-0"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">
                  音频预览
                </div>
                <div className="text-xs text-muted-foreground">
                  点击播放按钮预听音频
                </div>
              </div>
              
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={URL.createObjectURL(outputFile)}
                onEnded={onEnded}
                onPlay={onPlay}
                onPause={onPause}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* 下载按钮 */}
        <Button
          onClick={handleDownload}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Download className="w-4 h-4 mr-2" />
          下载文件
        </Button>
      </CardContent>
    </Card>
  );
}; 