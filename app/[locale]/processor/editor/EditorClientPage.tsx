'use client';

import React, { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ImageUploadArea } from '@/components/media-processor/ImageUploadArea';
import { PageHeader } from '@/components/media-processor/PageHeader';
import { useTranslation } from '@/components/TranslationProvider';

// 动态导入 ImageCanvasEditor，禁用 SSR
// 因为 react-filerobot-image-editor -> konva -> canvas (Node.js 原生模块)
const ImageCanvasEditor = dynamic(
    () => import('@/components/media-processor/ImageCanvasEditor').then(mod => mod.ImageCanvasEditor),
    { ssr: false }
);

const EditorClientPage: React.FC = () => {
    const { t } = useTranslation();
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
