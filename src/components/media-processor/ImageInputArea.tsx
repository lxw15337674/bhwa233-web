'use client';

import React from 'react';
import { useImageProcessorStore } from '@/stores/media-processor/image-store';
import { ImageUploadArea } from './ImageUploadArea';

interface ImageInputAreaProps {
    maxFileSize?: number; // MB
    disabled?: boolean;
}

export const ImageInputArea: React.FC<ImageInputAreaProps> = ({
    maxFileSize = 50,
    disabled = false,
}) => {
    const {
        inputFile,
        inputUrl,
        inputMetadata,
        validateFile,
        setInputFile,
        reset,
    } = useImageProcessorStore();

    return (
        <ImageUploadArea
            maxFileSize={maxFileSize}
            disabled={disabled}
            onFileSelect={setInputFile}
            selectedFile={inputFile}
            previewUrl={inputUrl}
            metadata={inputMetadata}
            onClear={reset}
            showPreview={true}
            validateFile={(file) => validateFile(file)}
        />
    );
};
