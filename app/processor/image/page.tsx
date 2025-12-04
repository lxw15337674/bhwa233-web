'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useImageProcessorStore } from '@/stores/media-processor/image-store';
import { ImageInputArea } from '@/components/media-processor/ImageInputArea';
import { ImageOutputPreview } from '@/components/media-processor/ImageOutputPreview';
import { ImageEditorPanel } from '@/components/media-processor/ImageEditorPanel';

const ImageProcessorPage: React.FC = () => {
    const {
        inputFile,
        processError
    } = useImageProcessorStore();

    return (
        <div className="space-y-6">
            {/* 错误提示 */}
            {processError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{processError}</AlertDescription>
                </Alert>
            )}

            {/* 主要内容区域 */}
            {!inputFile ? (
                // 未上传图片时，显示上传区域
                <ImageInputArea />
            ) : (
                // 已上传图片时，显示编辑界面
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* 左侧：处理后预览 */}
                        <div className="lg:col-span-2">
                            <ImageOutputPreview />
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
