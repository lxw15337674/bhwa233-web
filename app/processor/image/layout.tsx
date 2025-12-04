'use client';

import React from 'react';
import { CategoryNavigation } from '@/components/media-processor/CategoryNavigation';

interface Props {
    children: React.ReactNode;
}

const ImageProcessorLayout: React.FC<Props> = ({ children }) => {
    return (
        <div className="min-h-screen text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* 分类导航 */}
                <CategoryNavigation />

                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                        图片编辑器
                    </h1>
                    <p className="text-muted-foreground">
                        支持压缩、格式转换、尺寸调整、旋转翻转等功能
                    </p>
                </div>

                {children}
            </div>
        </div>
    );
};

export default ImageProcessorLayout;
