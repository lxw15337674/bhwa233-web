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
import { useTranslations } from 'next-intl';

interface ImageProcessorClientPageProps {
    seoContent?: {
        title: string;
        description: string;
        features: string[];
    };
}

const ImageProcessorClientPage: React.FC<ImageProcessorClientPageProps> = ({ seoContent }) => {
    const t = useTranslations();
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

            {/* 主内容区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 左侧：输入和输出预览（占据更多空间） */}
                <div className="lg:col-span-2 space-y-6">
                    {/* 输入区域 */}
                    {!inputFile && <ImageInputArea />}

                    {/* 输出预览 */}
                    {inputFile && <ImageOutputPreview />}

                    {/* 元数据面板 (移至左侧) */}
                    {inputFile && <ImageExifPanel />}
                </div>

                {/* 右侧：编辑面板 */}
                <div className="space-y-6">
                    <ImageEditorPanel />
                </div>
            </div>

            {/* SEO 内容区域 */}
            {seoContent && (
                <article className="mt-12 prose prose-slate dark:prose-invert max-w-none bg-card rounded-xl p-8 border shadow-sm">
                    <h2 className="text-2xl font-bold mb-4 text-primary">{seoContent.title}</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        {seoContent.description}
                    </p>

                    {seoContent.features && seoContent.features.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {seoContent.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                                    <span className="text-card-foreground">{feature}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            )}
        </div>
    );
};

export default ImageProcessorClientPage;
