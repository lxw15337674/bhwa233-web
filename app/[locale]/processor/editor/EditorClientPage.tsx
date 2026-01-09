'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ImageUploadArea } from '@/components/media-processor/ImageUploadArea';
import { PageHeader } from '@/components/media-processor/PageHeader';
import { useTranslations } from 'next-intl';

// 动态导入 ImageCanvasEditor，禁用 SSR
// 因为 react-filerobot-image-editor -> konva -> canvas (Node.js 原生模块)
const ImageCanvasEditor = dynamic(
    () => import('@/components/media-processor/ImageCanvasEditor').then(mod => mod.ImageCanvasEditor),
    { ssr: false }
);

interface EditorClientPageProps {
    seoContent?: {
        title: string;
        description: string;
        features: string[];
    };
}

const EditorClientPage: React.FC<EditorClientPageProps> = ({ seoContent }) => {
    const t = useTranslations();
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    // 处理文件选择
    const handleFileSelect = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            return;
        }
        const url = URL.createObjectURL(file);
        setImageUrl(url);
    }, []);

    // 处理保存（ImageCanvasEditor 返回 File 对象）
    const handleSave = useCallback((file: File) => {
        // 创建下载链接
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 清理 URL
        setTimeout(() => URL.revokeObjectURL(url), 100);

        // 关闭编辑器，返回上传界面
        handleClose();
    }, []);

    // 处理关闭（重新上传）
    const handleClose = useCallback(() => {
        if (imageUrl) {
            URL.revokeObjectURL(imageUrl);
        }
        setImageUrl(null);
    }, [imageUrl]);

    // 未上传图片时显示上传区域
    if (!imageUrl) {
        return (
            <div className="container mx-auto px-4 py-8">
                <PageHeader
                    title={t('imageEditor.title')}
                    description={t('imageEditor.description')}
                    gradient="from-purple-400 to-pink-400"
                />
                <ImageUploadArea
                    onFileSelect={handleFileSelect}
                    showPreview={false}
                />

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
    }

    // 已上传图片时显示编辑器（使用封装好的 ImageCanvasEditor 组件）
    return (
        <ImageCanvasEditor
            imageUrl={imageUrl}
            onSave={handleSave}
            onClose={handleClose}
        />
    );
};

export default EditorClientPage;
