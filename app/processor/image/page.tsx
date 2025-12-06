'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useImageProcessorStore } from '@/stores/media-processor/image-store';
import { ImageInputArea } from '@/components/media-processor/ImageInputArea';
import { ImageOutputPreview } from '@/components/media-processor/ImageOutputPreview';
import { ImageEditorPanel } from '@/components/media-processor/ImageEditorPanel';
import { PageHeader } from '@/components/media-processor/PageHeader';
import { ImageExifPanel } from '@/components/media-processor/ImageExifPanel';

const ImageProcessorPage: React.FC = () => {
    const {
        inputFile,
        processError
    } = useImageProcessorStore();

    return (
        <div className="space-y-6">
            {/* 页面标题 */}
            <PageHeader
                title="图片处理器"
                description="支持压缩、格式转换、尺寸调整、旋转翻转等功能"
            />

            {/* 错误提示 */}
            {processError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{processError}</AlertDescription>
                </Alert>
            )}

            {/* 主要内容区域 */}
            {!inputFile ? (
                // 未上传图片时，显示上传区域和编辑面板
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <ImageInputArea />
                    </div>
                    <div>
                        <ImageEditorPanel />
                    </div>
                </div>
            ) : (
                // 已上传图片时，显示编辑界面
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：处理后预览 */}
                    <div className="lg:col-span-2 space-y-6">
                        <ImageOutputPreview />
                        <ImageExifPanel />
                    </div>

                    {/* 右侧：编辑面板 */}
                    <div>
                        <ImageEditorPanel />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageProcessorPage;
