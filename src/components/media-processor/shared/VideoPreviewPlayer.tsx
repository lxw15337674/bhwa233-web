'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoPreviewPlayerProps {
    file: File | null;
    currentTime?: number;
    onTimeUpdate?: (time: number) => void;
    className?: string;
}

export const VideoPreviewPlayer: React.FC<VideoPreviewPlayerProps> = ({
    file,
    currentTime = 0,
    onTimeUpdate,
    className = ''
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoUrl, setVideoUrl] = useState<string>('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState<number>(0);

    // 加载视频文件
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setVideoUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setVideoUrl('');
        }
    }, [file]);

    // 外部控制当前时间（时间轴拖动时）
    useEffect(() => {
        if (videoRef.current && !isPlaying) {
            videoRef.current.currentTime = currentTime;
        }
    }, [currentTime, isPlaying]);

    // 视频加载完成
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    // 视频时间更新
    const handleTimeUpdate = () => {
        if (videoRef.current && onTimeUpdate) {
            onTimeUpdate(videoRef.current.currentTime);
        }
    };

    // 播放/暂停切换
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    if (!file) {
        return null;
    }

    return (
        <Card className={className}>
            <CardContent className="p-4">
                <div className="space-y-3">
                    <div className="relative bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        {videoUrl ? (
                            <>
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    className="max-w-full max-h-[400px] md:max-h-[500px] lg:max-h-[600px] object-contain"
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onTimeUpdate={handleTimeUpdate}
                                    onEnded={() => setIsPlaying(false)}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="w-12 h-12 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                                        onClick={togglePlay}
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-6 h-6 text-white" />
                                        ) : (
                                            <Play className="w-6 h-6 text-white" />
                                        )}
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-white text-sm">加载视频中...</div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
