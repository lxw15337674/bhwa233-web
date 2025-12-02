'use client';

import React from 'react';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useImageProcessorStore } from '@/stores/media-processor/image-store';
import { formatFileSize, calculateCompressionRatio } from '@/utils/imageProcessor';

export const ImageOutputPreview: React.FC = () => {
    const {
        outputUrl,
        outputMetadata,
        inputMetadata,
        isProcessing,
    } = useImageProcessorStore();

    // 处理中状态
    if (isProcessing) {
        return (
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-5 h-5 text-green-500" />
                    <span className="font-medium">处理后</span>
                </div>

                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span>处理中...</span>
                    </div>
                </div>
            </Card>
        );
    }

    // 无输出时显示占位
    if (!outputUrl || !outputMetadata) {
        return (
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                    <ImageIcon className="w-5 h-5 text-green-500" />
                    <span className="font-medium">处理后</span>
                </div>

                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>调整参数后自动预览</p>
                    </div>
                </div>
            </Card>
        );
    }

    // 计算压缩比
    const compressionRatio = inputMetadata
        ? calculateCompressionRatio(inputMetadata.size, outputMetadata.size)
        : null;

    return (
        <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
                <ImageIcon className="w-5 h-5 text-green-500" />
                <span className="font-medium">处理后</span>
                {compressionRatio && (
                    <span className={`text-sm px-2 py-0.5 rounded ${compressionRatio.startsWith('-')
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                        {compressionRatio}
                    </span>
                )}
            </div>

            {/* 图片预览 */}
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-3">
                <img
                    src={outputUrl}
                    alt="处理后预览"
                    className="w-full h-full object-contain"
                />
            </div>

            {/* 图片信息 */}
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">尺寸:</span>
                    <span className="font-medium">{outputMetadata.width} × {outputMetadata.height}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">大小:</span>
                    <span className="font-medium">{formatFileSize(outputMetadata.size)}</span>
                </div>
                <div className="flex justify-between col-span-2">
                    <span className="text-muted-foreground">格式:</span>
                    <span className="font-medium">{outputMetadata.format}</span>
                </div>
            </div>
        </Card>
    );
};
