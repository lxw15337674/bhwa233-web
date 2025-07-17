'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { getFunctionById } from '@/config/processor-functions';
import { useAudioProcessorStore } from '@/stores/media-processor/audio-store';
import { CategoryNavigation } from '@/components/media-processor/CategoryNavigation';
import { FunctionSelector } from '@/components/media-processor/FunctionSelector';
import { AudioInputArea } from '@/components/media-processor/AudioInputArea';

interface Props {
    children?: React.ReactNode;
}

const AudioProcessorView: React.FC = ({ children }: Props) => {
    const { setInputAudio } = useAudioProcessorStore();
    const params = useParams<{ function: string }>();
    const currentFunctionConfig = getFunctionById(params.function);

    // 验证音频文件类型
    const validateAudioFile = (file: File): boolean => {
        const supportedFormats = ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'];
        const extension = file.name.split('.').pop()?.toLowerCase();
        return supportedFormats.includes(extension || '');
    };

    // 处理文件选择
    const handleFileSelect = (file: File) => {
        if (!validateAudioFile(file)) {
            return;
        }
        setInputAudio(file);
    };

    return (
        <div className="min-h-screen text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* 分类导航 */}
                <CategoryNavigation
                    currentCategory="audio"
                    onCategoryChange={(category) => {
                        // 在独立视图中，分类变更将导航到对应页面
                        window.location.href = `/media/${category}`;
                    }}
                />

                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {currentFunctionConfig?.label || '音频处理器'}
                    </h1>
                    <p className="text-muted-foreground">
                        {currentFunctionConfig?.description || '选择音频处理功能'}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：音频输入区域 */}
                    <div className="lg:col-span-2 space-y-6">
                        <AudioInputArea />
                    </div>

                    {/* 右侧：控制面板 */}
                    <div className="space-y-6">
                        {/* 功能选择器 */}
                        <FunctionSelector />
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioProcessorView;