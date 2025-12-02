'use client';

import React, { useRef, useState } from 'react';
import { Upload, ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { useImageProcessorStore } from '@/stores/media-processor/image-store';
import { formatFileSize } from '@/utils/imageProcessor';

interface ImageInputAreaProps {
    maxFileSize?: number; // MB
    disabled?: boolean;
}

export const ImageInputArea: React.FC<ImageInputAreaProps> = ({
    maxFileSize = 50,
    disabled = false,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string>('');

    const {
        inputFile,
        inputUrl,
        inputMetadata,
        validateFile,
        setInputFile,
        reset,
    } = useImageProcessorStore();

    const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp'];

    const handleValidateFile = (file: File): boolean => {
        if (!validateFile(file)) {
            setError(`不支持的文件格式。支持的格式: ${supportedFormats.join(', ')}`);
            return false;
        }

        if (file.size > maxFileSize * 1024 * 1024) {
            setError(`文件大小不能超过${maxFileSize}MB`);
            return false;
        }

        return true;
    };

    const handleFileSelect = (file: File) => {
        if (!handleValidateFile(file)) return;

        setError('');
        setInputFile(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('File input changed', e.target.files);
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        console.log('File dropped', e.dataTransfer.files);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleClick = () => {
        console.log('Upload area clicked, disabled:', disabled);
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const clearImage = () => {
        reset();
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setError('');
    };

    // 如果已有图片，显示预览
    if (inputFile && inputUrl) {
        return (
            <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">原图</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={clearImage}
                        disabled={disabled}
                    >
                        更换图片
                    </Button>
                </div>

                {/* 图片预览 */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-3">
                    <img
                        src={inputUrl}
                        alt="原图预览"
                        className="w-full h-full object-contain"
                    />
                </div>

                {/* 图片信息 */}
                {inputMetadata && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">尺寸:</span>
                            <span className="font-medium">{inputMetadata.width} × {inputMetadata.height}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">大小:</span>
                            <span className="font-medium">{formatFileSize(inputMetadata.size)}</span>
                        </div>
                        <div className="flex justify-between col-span-2">
                            <span className="text-muted-foreground">格式:</span>
                            <span className="font-medium">{inputMetadata.format}</span>
                        </div>
                    </div>
                )}
            </Card>
        );
    }

    // 上传区域
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>选择图片文件</Label>
                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={handleClick}
                >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
                        拖拽图片到此处，或点击选择文件
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
                        支持格式: {supportedFormats.join(', ')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        最大文件大小: {maxFileSize}MB
                    </p>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                    disabled={disabled}
                />
            </div>

            {/* 错误提示 */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
        </div>
    );
};
