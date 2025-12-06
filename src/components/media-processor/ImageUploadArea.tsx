'use client';

import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { Upload, ImageIcon, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { formatFileSize } from '@/utils/imageProcessor';
import { useTranslation } from '@/components/TranslationProvider';

interface ImageUploadAreaProps {
    /** 最大文件大小 (MB) */
    maxFileSize?: number;
    /** 是否禁用 */
    disabled?: boolean;
    /** 文件选择回调 */
    onFileSelect: (file: File) => void;
    /** 已选择的文件 */
    selectedFile?: File | null;
    /** 文件预览 URL */
    previewUrl?: string | null;
    /** 文件元数据 */
    metadata?: {
        width: number;
        height: number;
        size: number;
        format: string;
    } | null;
    /** 清除文件回调 */
    onClear?: () => void;
    /** 是否显示预览（当有文件时） */
    showPreview?: boolean;
    /** 自定义文件验证 */
    validateFile?: (file: File) => { valid: boolean; error?: string };
}

const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.bmp'];

export const ImageUploadArea: React.FC<ImageUploadAreaProps> = ({
    maxFileSize = 50,
    disabled = false,
    onFileSelect,
    selectedFile,
    previewUrl,
    metadata,
    onClear,
    showPreview = true,
    validateFile,
}) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState<string>('');

    const handleValidateFile = useCallback((file: File): boolean => {
        // 自定义验证
        if (validateFile) {
            const result = validateFile(file);
            if (!result.valid) {
                setError(result.error || t('imageUpload.validationFailed'));
                return false;
            }
        }

        // 检查文件类型
        const isImage = file.type.startsWith('image/') ||
            supportedFormats.some(ext => file.name.toLowerCase().endsWith(ext));
        if (!isImage) {
            setError(t('imageUpload.unsupportedFormat', { formats: supportedFormats.join(', ') }));
            return false;
        }

        // 检查文件大小
        if (file.size > maxFileSize * 1024 * 1024) {
            setError(t('imageUpload.fileSizeExceeded', { maxSize: maxFileSize }));
            return false;
        }

        return true;
    }, [maxFileSize, validateFile]);

    const handleFileSelect = useCallback((file: File) => {
        if (!handleValidateFile(file)) return;
        setError('');
        onFileSelect(file);
    }, [handleValidateFile, onFileSelect]);

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

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
        if (!disabled && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleClear = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setError('');
        onClear?.();
    };

    // 如果有文件且需要显示预览
    if (selectedFile && previewUrl && showPreview) {
        return (
            <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-blue-500" />
                        <span className="font-medium">{t('imageUpload.originalImage')}</span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClear}
                        disabled={disabled}
                    >
                        {t('imageProcessor.changeImage')}
                    </Button>
                </div>

                {/* 图片预览 */}
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden mb-3">
                    <Image
                        src={previewUrl}
                        alt={t('imageUpload.originalImagePreview')}
                        fill
                        className="object-contain"
                        style={{ objectFit: 'contain' }}
                    />
                </div>

                {/* 图片信息 */}
                {metadata && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('imageUpload.dimensions')}:</span>
                            <span className="font-medium">{metadata.width} × {metadata.height}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('fileUpload.size')}:</span>
                            <span className="font-medium">{formatFileSize(metadata.size)}</span>
                        </div>
                        <div className="flex justify-between col-span-2">
                            <span className="text-muted-foreground">{t('imageUpload.format')}:</span>
                            <span className="font-medium">{metadata.format}</span>
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
                <Label>{t('fileUpload.selectImageFile')}</Label>
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
                        {t('imageUpload.dragOrClickImage')}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
                        {t('fileUpload.supportedFormats')} {supportedFormats.join(', ')}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        {t('imageUpload.maxFileSize', { maxSize: maxFileSize })}
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
