'use client';

import React from 'react';
import { useImageProcessorStore } from '@/stores/media-processor/image-store';
import { ImageInputArea } from '@/components/media-processor/ImageInputArea';
import { ImageOutputPreview } from '@/components/media-processor/ImageOutputPreview';
import { ImageEditorPanel } from '@/components/media-processor/ImageEditorPanel';
import { ImageExifPanel } from '@/components/media-processor/ImageExifPanel';
import { ProcessorLayout } from '@/components/media-processor/layout/ProcessorLayout';
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
    const { inputFile } = useImageProcessorStore();

    const leftColumn = (
        <>
            {!inputFile && <ImageInputArea />}
            {inputFile && <ImageOutputPreview />}
            {inputFile && <ImageExifPanel />}
        </>
    );

    const rightColumn = <ImageEditorPanel />;

    return (
        <ProcessorLayout
            title={t('imageProcessor.title')}
            description={t('imageProcessor.description')}
            leftColumn={leftColumn}
            rightColumn={rightColumn}
            seoContent={seoContent}
        />
    );
};

export default ImageProcessorClientPage;
