'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getFunctionById } from '@/config/processor-functions';
import { useAudioProcessorStore } from '@/stores/media-processor/audio-store';
import { FunctionSelector } from '@/components/media-processor/FunctionSelector';
import { AudioInputArea } from '@/components/media-processor/AudioInputArea';

interface Props {
    children?: React.ReactNode;
}

const AudioProcessorView: React.FC = ({ children }: Props) => {
    const { initFFmpeg } = useAudioProcessorStore();
    const params = useParams<{ function: string }>();
    const currentFunction = params.function;
    const currentFunctionConfig = getFunctionById(currentFunction);

    // 初始化 FFmpeg
    useEffect(() => {
        initFFmpeg();
    }, [initFFmpeg]);

    // 语音转文字不需要显示音频技术信息
    const showMediaInfo = currentFunction !== 'speech-to-text';

    return (
        <div className="min-h-screen text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
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
                        <AudioInputArea showMediaInfo={showMediaInfo} />
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