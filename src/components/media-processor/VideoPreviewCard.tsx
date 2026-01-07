'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/media-processor/app-store';

export const VideoPreviewCard: React.FC = () => {
    const selectedFile = useAppStore(state => state.selectedFile);
    const setVideoMetadata = useAppStore(state => state.setVideoMetadata);
    const setGifStartTime = useAppStore(state => state.setGifStartTime);
    const setGifEndTime = useAppStore(state => state.setGifEndTime);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [currentTime, setCurrentTime] = useState<number>(0);

    useEffect(() => {
        if (selectedFile && videoRef.current) {
            const url = URL.createObjectURL(selectedFile);
            videoRef.current.src = url;

            return () => URL.revokeObjectURL(url);
        }
    }, [selectedFile]);

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            const duration = videoRef.current.duration;
            const width = videoRef.current.videoWidth;
            const height = videoRef.current.videoHeight;

            console.log('[VideoPreview] 视频元数据:', { duration, width, height });
            
            setVideoMetadata({
                duration,
                width,
                height
            });
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(Math.round(videoRef.current.currentTime));
        }
    };

    const handleSetStartTime = () => {
        setGifStartTime(currentTime);
    };

    const handleSetEndTime = () => {
        setGifEndTime(currentTime);
    };

    if (!selectedFile) {
        return null;
    }

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-4">
                <h3 className="font-medium mb-3">视频预览</h3>
                <div className="relative w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
                    <video
                        ref={videoRef}
                        controls
                        className="max-w-full max-h-[400px] md:max-h-[500px] lg:max-h-[600px] object-contain"
                        onLoadedMetadata={handleLoadedMetadata}
                        onTimeUpdate={handleTimeUpdate}
                    />
                </div>
                
                {/* 当前播放时间和设置按钮 */}
                <div className="mt-4 space-y-2">
                    <div className="text-sm text-muted-foreground">
                        当前播放时间: <span className="font-medium text-foreground">{currentTime}秒</span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSetStartTime}
                            disabled={!selectedFile}
                            className="flex-1"
                        >
                            设为开始时间
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSetEndTime}
                            disabled={!selectedFile}
                            className="flex-1"
                        >
                            设为结束时间
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
