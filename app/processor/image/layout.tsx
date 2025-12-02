'use client';

import React, { useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useImageProcessorStore } from '@/stores/media-processor/image-store';
import { CategoryNavigation } from '@/components/media-processor/CategoryNavigation';

interface Props {
    children: React.ReactNode;
}

const ImageProcessorLayout: React.FC<Props> = ({ children }) => {
    const {
        vipsLoading,
        vipsLoaded,
        vipsError,
        initVips
    } = useImageProcessorStore();

    // 初始化 Vips
    useEffect(() => {
        initVips();
    }, [initVips]);

    // 错误状态 - 只在有错误时显示
    if (vipsError) {
        return (
            <div className="min-h-screen text-foreground">
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    <CategoryNavigation />

                    <div className="flex flex-col items-center justify-center py-20">
                        <Alert variant="destructive" className="max-w-lg">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="ml-2">
                                {vipsError}
                            </AlertDescription>
                        </Alert>
                        <p className="text-muted-foreground mt-4 text-center">
                            请尝试使用最新版本的 Chrome、Firefox 或 Edge 浏览器
                        </p>
                    </div>
                </div>
            </div>
        );
    }

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
                        支持压缩、格式转换、尺寸调整、旋转翻转
                    </p>
                </div>

                {/* 加载提示 */}
                {vipsLoading && (
                    <div className="flex items-center justify-center gap-2 py-4 mb-4 bg-muted/50 rounded-lg">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="text-sm text-muted-foreground">正在加载图片处理引擎...</span>
                    </div>
                )}

                {children}
            </div>
        </div>
    );
};

export default ImageProcessorLayout;
