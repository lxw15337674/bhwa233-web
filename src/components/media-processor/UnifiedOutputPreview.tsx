'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Play, Pause, FileAudio, FileVideo, FileText, ImageIcon } from 'lucide-react';
import { downloadBlob } from '@/utils/audioConverter';
import { useAppStore } from '@/stores/media-processor/app-store';
import { useTranslation } from '@/components/TranslationProvider';

interface UnifiedOutputPreviewProps {
  mediaType: 'audio' | 'video' | 'text' | 'image'; 
}

export const UnifiedOutputPreview: React.FC<UnifiedOutputPreviewProps> = ({
  mediaType
}) => {
  const { t } = useTranslation();
  const { processingState } = useAppStore();
  const { outputFile, outputFileName } = processingState;

  const mediaRef = useRef<HTMLAudioElement | HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 当 outputFile 改变时，确保重置播放状态和 URL
  useEffect(() => {
    if (mediaRef.current) {
      if (mediaType === 'audio' || mediaType === 'video') {
         mediaRef.current.pause();
      }
      setIsPlaying(false);
      if (outputFile) {
        // Revoke previous URL if any
        if (mediaRef.current.src) {
          URL.revokeObjectURL(mediaRef.current.src);
        }
        mediaRef.current.src = URL.createObjectURL(outputFile);
        if (mediaType === 'audio' || mediaType === 'video') {
          mediaRef.current.load(); // Reload the media element
        }
      }
    }
    // Cleanup function to revoke URL when component unmounts or outputFile changes
    return () => {
      if (mediaRef.current && mediaRef.current.src) {
        URL.revokeObjectURL(mediaRef.current.src);
      }
    };
  }, [outputFile, mediaType]);


  if (!outputFile) {
    return null;
  }

  const handleDownload = () => {
    if (outputFile && outputFileName) {
      downloadBlob(outputFile, outputFileName);
    }
  };

  const handlePlayPause = () => {
    if (mediaRef.current && (mediaType === 'audio' || mediaType === 'video')) {
      if (isPlaying) {
        mediaRef.current.pause();
        setIsPlaying(false);
      } else {
        mediaRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) {
      return `${mb.toFixed(1)} MB`;
    } else {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
  };

  let IconComponent: React.ElementType;
  let titleText: string;
  let mediaElement: JSX.Element | null = null;

  switch (mediaType) {
    case 'audio':
      IconComponent = FileAudio;
      titleText = t('mediaProcessor.preview.outputAudio');
      mediaElement = (
        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePlayPause}
            className="h-10 w-10"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <div className="flex-1">
            <div className="text-sm font-medium mb-1">
              {t('mediaProcessor.preview.audioPreview')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('mediaProcessor.preview.clickToPlay')}
            </div>
          </div>
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="hidden" // Keep it hidden, control via buttons
            controls // For browser default controls if needed for debugging
          />
        </div>
      );
      break;
    case 'video':
      IconComponent = FileVideo;
      titleText = t('mediaProcessor.preview.outputVideo');
      mediaElement = (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          controls
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full max-h-[300px] bg-black rounded-lg"
          src={outputFile ? URL.createObjectURL(outputFile) : undefined}
        />
      );
      break;
    case 'image':
        IconComponent = ImageIcon;
        titleText = t('mediaProcessor.preview.outputImage');
        mediaElement = (
            <img
                src={outputFile ? URL.createObjectURL(outputFile) : undefined}
                alt="Converted Output"
                className="w-full max-h-[300px] object-contain bg-black/5 rounded-lg border"
            />
        );
        break;
    case 'text':
      IconComponent = FileText;
      titleText = t('mediaProcessor.preview.outputText');
      mediaElement = (
        <textarea
          readOnly
          value={outputFile ? new TextDecoder().decode(new Uint8Array(outputFile as any)) : ''}
          className="w-full h-48 bg-muted/30 border border-border rounded-lg p-3 text-sm font-mono resize-y"
        />
      );
      break;
    default:
      IconComponent = FileText; // Default to text icon
      titleText = t('mediaProcessor.preview.outputFile');
      break;
  }


  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <IconComponent className="h-5 w-5 text-primary" />
          {titleText}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 文件信息 */}
        <div className="space-y-2">
          <div className="text-sm">
            <div className="text-muted-foreground mb-1">{t('mediaProcessor.preview.filename')}</div>
            <div className="font-medium break-all">
              {outputFileName}
            </div>
          </div>
          
          <div className="text-sm">
            <div className="text-muted-foreground mb-1">{t('mediaProcessor.preview.fileSize')}</div>
            <div className="font-medium">
              {formatFileSize(outputFile.size)}
            </div>
          </div>
        </div>

        {/* 媒体预览 */}
        {mediaElement}

        {/* 下载按钮 */}
        <Button
          onClick={handleDownload}
          className="w-full"
          variant="default"
        >
          <Download className="w-4 h-4 mr-2" />
          {t('mediaProcessor.preview.download')}
        </Button>
      </CardContent>
    </Card>
  );
};