'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Play, Pause, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseOutputPreviewProps {
  outputFile: Blob;
  outputFileName: string;
  mediaType: 'audio' | 'video' | 'image' | 'text';
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
  mediaRef?: React.RefObject<HTMLAudioElement | HTMLVideoElement>;
}

export const BaseOutputPreview: React.FC<BaseOutputPreviewProps> = ({
  outputFile,
  outputFileName,
  mediaType,
  isPlaying = false,
  onPlay,
  onPause,
  onEnded,
  className,
  mediaRef
}) => {
  const handleDownload = () => {
    const url = URL.createObjectURL(outputFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = outputFileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 创建媒体 URL
  const mediaUrl = URL.createObjectURL(outputFile);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-4 w-4" />
          输出预览
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm truncate max-w-[60%]">{outputFileName}</p>
            <Button size="sm" onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          {mediaType === 'audio' && (
            <div className="space-y-2">
              <audio
                ref={mediaRef as React.RefObject<HTMLAudioElement>}
                src={mediaUrl}
                className="w-full"
                onPlay={onPlay}
                onPause={onPause}
                onEnded={onEnded}
                controls={false}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={isPlaying ? onPause : onPlay} variant="outline">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
          
          {mediaType === 'video' && (
            <video
              src={mediaUrl}
              className="w-full rounded-md"
              controls
            />
          )}
          
          {mediaType === 'image' && (
            <Image
              src={mediaUrl}
              alt="Output preview"
              width={0}
              height={0}
              sizes="100vw"
              style={{ width: '100%', height: 'auto', maxHeight: '240px', objectFit: 'contain' }}
              className="rounded-md"
            />
          )}
          
          {mediaType === 'text' && (
            <div className="border rounded p-3 max-h-40 overflow-y-auto">
              <p className="text-sm whitespace-pre-line break-words">
                {/* 文本内容需要异步加载，此处仅显示占位符 */}
                {outputFile ? (
                  <TextPreviewContent outputFile={outputFile} />
                ) : (
                  '[文本内容预览]'
                )}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// 为文本类型添加异步处理的包装组件
export const BaseOutputPreviewAsync: React.FC<Omit<BaseOutputPreviewProps, 'mediaType'> & { mediaType: 'text' }> = ({
  outputFile,
  outputFileName,
  isPlaying,
  onPlay,
  onPause,
  onEnded,
  className,
  mediaRef
}) => {
  const [textContent, setTextContent] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const readText = async () => {
      const text = await outputFile.text();
      setTextContent(text);
    };
    
    if (outputFile.type === 'text/plain') {
      readText();
    }
  }, [outputFile]);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <File className="h-4 w-4" />
          输出预览
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm truncate max-w-[60%]">{outputFileName}</p>
            <Button size="sm" onClick={() => {
              const url = URL.createObjectURL(outputFile);
              const a = document.createElement('a');
              a.href = url;
              a.download = outputFileName;
              a.click();
              URL.revokeObjectURL(url);
            }} variant="outline">
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="border rounded p-3 max-h-40 overflow-y-auto">
            {textContent ? (
              <p className="text-sm whitespace-pre-line break-words">{textContent}</p>
            ) : (
              <p className="text-sm text-muted-foreground">加载中...</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// 文本预览内容组件
const TextPreviewContent: React.FC<{ outputFile: Blob }> = ({ outputFile }) => {
  const [textContent, setTextContent] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const readText = async () => {
      try {
        const text = await outputFile.text();
        setTextContent(text);
      } catch (err) {
        setError('无法读取文本文件');
        console.error('Error reading text file:', err);
      } finally {
        setLoading(false);
      }
    };

    if (outputFile) {
      readText();
    }
  }, [outputFile]);

  if (loading) return <span>加载中...</span>;
  if (error) return <span className="text-destructive">{error}</span>;

  return <span>{textContent}</span>;
};