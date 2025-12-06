'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertTriangle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MediaMetadata {
  duration?: number;
  bitrate?: number;
  format?: string;
  width?: number;
  height?: number;
  sampleRate?: number;
  channels?: number;
}

interface BaseMediaMetadataCardProps {
  selectedFile: File | null;
  mediaMetadata: MediaMetadata | null;
  isAnalyzing: boolean;
  analyzeError: string | null;
  ffmpegLoaded: boolean;
  onRetryAnalysis: () => void;
  className?: string;
}

export const BaseMediaMetadataCard: React.FC<BaseMediaMetadataCardProps> = ({
  selectedFile,
  mediaMetadata,
  isAnalyzing,
  analyzeError,
  ffmpegLoaded,
  onRetryAnalysis,
  className
}) => {
  if (!selectedFile) {
    return null;
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          文件信息
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAnalyzing ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>分析中...</span>
          </div>
        ) : analyzeError ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {analyzeError}
              {ffmpegLoaded && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetryAnalysis}
                  className="ml-2"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  重试
                </Button>
              )}
            </AlertDescription>
          </Alert>
        ) : mediaMetadata ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">文件名</p>
              <p className="truncate">{selectedFile.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">文件大小</p>
              <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            {mediaMetadata.duration !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">时长</p>
                <p>{formatDuration(mediaMetadata.duration)}</p>
              </div>
            )}
            {mediaMetadata.bitrate !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">码率</p>
                <p>{mediaMetadata.bitrate} kbps</p>
              </div>
            )}
            {mediaMetadata.format && (
              <div>
                <p className="text-sm text-muted-foreground">格式</p>
                <p>{mediaMetadata.format}</p>
              </div>
            )}
            {mediaMetadata.width !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">分辨率</p>
                <p>{mediaMetadata.width} × {mediaMetadata.height}</p>
              </div>
            )}
            {mediaMetadata.sampleRate !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">采样率</p>
                <p>{mediaMetadata.sampleRate} Hz</p>
              </div>
            )}
            {mediaMetadata.channels !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">声道</p>
                <p>{mediaMetadata.channels} 声道</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {ffmpegLoaded ? '暂无媒体信息' : 'FFmpeg 加载中...'}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}