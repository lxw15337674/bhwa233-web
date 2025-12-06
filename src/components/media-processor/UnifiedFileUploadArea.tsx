'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileAudio, ImageIcon, Film, Clipboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProcessorCategory } from '@/types/media-processor';
import { SUPPORTED_AUDIO_FORMATS, getMediaType } from '@/utils/audioConverter';

interface UnifiedFileUploadAreaProps {
    selectedFile: File | null;
    category: ProcessorCategory;
    dragOver: boolean;
    onFileSelect: (file: File) => void;
    onReset: () => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    disabled?: boolean;
    onPasteFromClipboard?: () => void;
}

export const UnifiedFileUploadArea: React.FC<UnifiedFileUploadAreaProps> = ({
    selectedFile,
    category,
    dragOver,
    onFileSelect,
    onReset,
    onDragEnter,
    onDragLeave,
    onDrop,
    onFileInputChange,
    fileInputRef,
    disabled = false,
    onPasteFromClipboard
}) => {
    // 根据分类配置上传参数
    const getConfig = () => {
        switch (category) {
            case 'image':
            case 'editor':
                return {
                    supportedFormats: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'],
                    acceptTypes: 'image/*',
                    Icon: ImageIcon,
                    text: '选择图片文件'
                };
            case 'audio':
                return {
                    supportedFormats: SUPPORTED_AUDIO_FORMATS,
                    acceptTypes: 'audio/*',
                    Icon: FileAudio,
                    text: '选择音频文件'
                };
            default:
                // 默认为通用或根据需求调整
                return {
                    supportedFormats: ['.jpg', '.png', '.mp3', '.wav', '.mp4'],
                    acceptTypes: 'image/*,audio/*,video/*',
                    Icon: Film,
                    text: '选择媒体文件'
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
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                        onDragOver={(e) => e.preventDefault()}
                        onDragEnter={onDragEnter}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => !disabled && fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept={acceptTypes}
                            onChange={onFileInputChange}
                            className="hidden"
                            disabled={disabled}
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
                                    拖拽文件到此处或点击选择文件
                                </p>

                                <Button
                                    variant="outline"
                                    className="mb-4"
                                    disabled={disabled}
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    选择文件
                                </Button>

                                {(category === 'image' || category === 'editor') && onPasteFromClipboard && (
                                    <Button
                                        variant="outline"
                                        className="mb-4 ml-2"
                                        disabled={disabled}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPasteFromClipboard();
                                        }}
                                    >
                                        <Clipboard className="w-4 h-4 mr-2" />
                                        粘贴图片
                                    </Button>
                                )}

                                <div className="text-xs text-muted-foreground">
                                    <p className="mb-1">支持的格式：</p>
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
                            <h3 className="text-lg font-semibold">已选择文件</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onReset}
                                disabled={disabled}
                                className="h-8 w-8 p-0"
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
                                    <span>大小: {formatFileSize(selectedFile.size)}</span>
                                    <span>类型: {getMediaType(selectedFile.name)}</span>
                                </div>

                                    <div className="mt-2 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={disabled}
                                    >
                                        更换文件
                                    </Button>
                                        {(category === 'image' || category === 'editor') && onPasteFromClipboard && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={onPasteFromClipboard}
                                                disabled={disabled}
                                            >
                                                <Clipboard className="w-3 h-3 mr-1" />
                                                粘贴
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={acceptTypes}
                                onChange={onFileInputChange}
                                className="hidden"
                                disabled={disabled}
                            />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}; 