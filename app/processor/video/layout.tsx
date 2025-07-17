'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { getFunctionById } from '@/config/processor-functions';
import { useVideoProcessorStore } from '@/stores/media-processor/video-store';
import { CategoryNavigation } from '@/components/media-processor/CategoryNavigation';
import { FunctionSelector } from '@/components/media-processor/FunctionSelector';
import { VideoInputArea } from '@/public/app/processor/video/VideoInputArea';

interface Props {
    children?: React.ReactNode;
}

const VideoProcessorView: React.FC = ({ children }: Props) => {
    const { setInputVideo } = useVideoProcessorStore();
    const params = useParams<{ function: string }>();
    const currentFunctionConfig = getFunctionById(params.function);

    // 验证视频文件类型
    const validateVideoFile = (file: File): boolean => {
        const supportedFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'm4v'];
        const extension = file.name.split('.').pop()?.toLowerCase();
        return supportedFormats.includes(extension || '');
    };

    // 处理文件选择
    const handleFileSelect = (file: File) => {
        if (!validateVideoFile(file)) {
            return;
        }
        setInputVideo(file);
    };

    return (
        <div className="min-h-screen text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {currentFunctionConfig?.label || '视频处理器'}
                    </h1>
                    <p className="text-muted-foreground">
                        {currentFunctionConfig?.description || '选择视频处理功能'}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：视频输入区域 */}
                    <div className="lg:col-span-2 space-y-6">
                        <VideoInputArea />
                    </div>

                    {/* 右侧：控制面板 */}
                    <div className="space-y-6">
                        <FunctionSelector />
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoProcessorView;