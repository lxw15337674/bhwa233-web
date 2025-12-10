'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileAudio, ImageIcon, Film, Clipboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessorCategory } from '@/types/media-processor';
import { SUPPORTED_AUDIO_FORMATS, getMediaType } from '@/utils/audioConverter';
import { useTranslation } from '@/components/TranslationProvider';
import { useAppStore } from '@/stores/media-processor/app-store';

interface UnifiedFileUploadAreaProps {
    category: ProcessorCategory;
}

export const UnifiedFileUploadArea: React.FC<UnifiedFileUploadAreaProps> = ({
    category
}) => {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { 
        selectedFile, 
        dragOver, 
        setSelectedFile, 
        setDragOver, 
        processingState 
    } = useAppStore();

    const isProcessing = processingState.isProcessing;

    // 处理文件选择
    const handleFileSelect = (file: File) => {
        // 简单的验证逻辑，可以在这里或 Store 中增强
        const { supportedFormats } = getConfig();
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        // 简单的扩展名检查
        if (supportedFormats.some(fmt => ext.endsWith(fmt)) || file.type.startsWith(category + '/')) {
             setSelectedFile(file);
        } else {
            alert(t('fileUpload.unsupportedFormat') || 'Unsupported format');
        }
    };

    const onDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isProcessing) setDragOver(true);
    };

    const onDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (isProcessing) return;

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    // 根据分类配置上传参数
    const getConfig = () => {
        switch (category) {
            case 'image':
            case 'editor':
                return {
                    supportedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'],
                    acceptTypes: 'image/*',
                    Icon: ImageIcon,
                    text: t('fileUpload.selectImageFile')
                };
            case 'audio':
                return {
                    supportedFormats: SUPPORTED_AUDIO_FORMATS.map(f => '.' + f),
                    acceptTypes: 'audio/*',
                    Icon: FileAudio,
                    text: t('fileUpload.selectAudioFile')
                };
            default:
                return {
                    supportedFormats: ['.jpg', '.png', '.mp3', '.wav', '.mp4'],
                    acceptTypes: 'image/*,audio/*,video/*',
                    Icon: Film,
                    text: t('fileUpload.selectMediaFile')
                };
        }
    };

    const { supportedFormats, acceptTypes, Icon, text } = getConfig();

    const formatFileSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024);
        if (mb >= 1) {
            return `${mb.toFixed(1)} MB`;
        } else {
            return `${(bytes / 1024).toFixed(0)} KB`;
        }
    };

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-6">
                {!selectedFile ? (
                    <div
                        className={cn(
                            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                            dragOver
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-muted-foreground hover:bg-accent/50",
                            isProcessing && "opacity-50 cursor-not-allowed"
                        )}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={onDragEnter}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => !isProcessing && fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={acceptTypes}
                            onChange={onFileInputChange}
                            className="hidden"
                            disabled={isProcessing}
                        />

                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Icon className="w-8 h-8 text-primary" />
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {text}
                                </h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    {t('fileUpload.dragOrClick')}
                                </p>

                                <Button
                                    variant="outline"
                                    className="mb-4"
                                    disabled={isProcessing}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    {t('fileUpload.selectFile')}
                                </Button>

                                <div className="text-xs text-muted-foreground">
                                    <p className="mb-1">{t('fileUpload.supportedFormats')}</p>
                                    <p className="font-mono">
                                        {supportedFormats.join(', ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">{t('fileUpload.selectedFile')}</h3>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setSelectedFile(null)}
                                disabled={isProcessing}
                                className="h-8 w-8"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg border">
                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Icon className="w-6 h-6 text-primary" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm mb-1 truncate">
                                    {selectedFile.name}
                                </div>

                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span>{t('fileUpload.size')}: {formatFileSize(selectedFile.size)}</span>
                                    <span>{t('fileUpload.type')}: {getMediaType(selectedFile.name)}</span>
                                </div>

                                    <div className="mt-2 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isProcessing}
                                    >
                                        {t('fileUpload.changeFile')}
                                    </Button>
                                    </div>
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={acceptTypes}
                                onChange={onFileInputChange}
                                className="hidden"
                                disabled={isProcessing}
                            />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};