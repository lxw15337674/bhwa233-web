'use client';

import React from 'react';
import { CategoryNavigation } from '@/components/media-processor/CategoryNavigation';

interface Props {
    children: React.ReactNode;
}

const ImageEditorLayout: React.FC<Props> = ({ children }) => {
    return (
        <div className="min-h-screen text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* 分类导航 */}
                <CategoryNavigation />

                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        图片编辑器
                    </h1>
                    <p className="text-muted-foreground">
                        支持裁剪、标注、滤镜、文字、画笔等交互式编辑功能
                    </p>
                </div>

                {children}
            </div>
        </div>
    );
};

export default ImageEditorLayout;
