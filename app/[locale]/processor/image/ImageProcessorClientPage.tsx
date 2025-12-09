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
import { useTranslation } from '@/components/TranslationProvider';

const ImageProcessorClientPage: React.FC = () => {
    const { t } = useTranslation();
    const {
        inputFile,
        processError
    } = useImageProcessorStore();

    return (
        <div className="container mx-auto px-4 py-8 ">
            {/* 页面标题 */}
            <PageHeader
                title={t('imageProcessor.title')}
                description={t('imageProcessor.description')}
            />

            {/* 错误提示 */}
            {processError && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{processError}</AlertDescription>
                </Alert>
            )}

            {/* 主内容区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：输入和输出预览（占据更多空间） */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 输入区域 */}
                    {!inputFile && <ImageInputArea />}

                    {/* 输出预览 */}
                    {inputFile && <ImageOutputPreview />}
                </div>

                {/* 右侧：编辑面板 */}
                <div className="space-y-6">
                    <ImageEditorPanel />
                    <ImageExifPanel />
                </div>
            </div>
        </div>
    );
};

export default ImageProcessorClientPage;
