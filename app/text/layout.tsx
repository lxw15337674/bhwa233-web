'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { getFunctionById } from '@/config/processor-functions';
import { useTextProcessorStore } from '@/stores/media-processor/text-store';
import { CategoryNavigation } from '@/components/media-processor/CategoryNavigation';
import { FunctionSelector } from '@/components/media-processor/FunctionSelector';
import { TextInputArea } from '@/public/app/text/TextInputArea';
import TextToSpeechControlPanel from './tts/page';

interface Props {
    children?: React.ReactNode;
}
const TextProcessorView: React.FC = ({ children }: Props) => {
    const { inputText, setInputText } = useTextProcessorStore();
    const params = useParams<{ function: string }>();
    const currentFunctionConfig = getFunctionById(params.function);

    // 文本功能列表

    // 验证文本文件类型
    const validateTextFile = (file: File): boolean => {
        const supportedFormats = ['txt', 'md', 'rtf', 'doc', 'docx', 'pdf'];
        const extension = file.name.split('.').pop()?.toLowerCase();
        const isTextType = file.type.startsWith('text/');
        return supportedFormats.includes(extension || '') || isTextType;
    };

    // 处理文件选择
    const handleFileSelect = (file: File) => {
        if (!validateTextFile(file)) {
            return;
        }
    };

    // 处理文本输入
    const handleTextInput = (text: string) => {
        setInputText(text);
    };

    return (
        <div className="min-h-screen text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* 分类导航 */}
                <CategoryNavigation
                    currentCategory="text"
                    onCategoryChange={(category) => {
                        // 在独立视图中，分类变更将导航到对应页面
                        window.location.href = `/media/${category}`;
                    }}
                />

                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {currentFunctionConfig?.label || '文本处理器'}
                    </h1>
                    <p className="text-muted-foreground">
                        {currentFunctionConfig?.description || '选择文本处理功能'}
                    </p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：文本输入区域 */}
                    <div className="lg:col-span-2 space-y-6">
                        <TextInputArea
                            text={inputText}
                            onTextChange={handleTextInput}
                            onFileUpload={handleFileSelect}
                        />
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


export default TextProcessorView;