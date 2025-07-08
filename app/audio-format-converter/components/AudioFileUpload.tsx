'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, CheckCircle2, FileAudio } from 'lucide-react';
import { SUPPORTED_AUDIO_FORMATS } from '@/utils/audioConverter';

interface AudioFileUploadProps {
    selectedFile: File | null;
    dragOver: boolean;
    onFileSelect: (file: File) => void;
    onReset: () => void;
    onDragEnter: () => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export const AudioFileUpload: React.FC<AudioFileUploadProps> = ({
    selectedFile,
    dragOver,
    onFileSelect,
    onReset,
    onDragEnter,
    onDragLeave,
    onDrop,
    onFileInputChange,
    fileInputRef
}) => {
    const handleClick = () => {
        fileInputRef?.current?.click();
    };

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-6">
                <div
                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 cursor-pointer ${selectedFile
                        ? 'border-green-500 bg-green-500/10'
                        : dragOver
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary hover:bg-primary/5'
                        }`}
                    onDrop={onDrop}
                    onDragOver={(e) => e.preventDefault()}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onClick={handleClick}
                >
                    {selectedFile ? (
                        <div className="space-y-4">
                            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                            <div>
                                <p className="font-medium text-lg line-clamp-1" title={selectedFile.name}>
                                    {selectedFile.name}
                                </p>
                                <p className="text-muted-foreground">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReset();
                                }}
                                className="border-border hover:bg-accent"
                            >
                                重新选择
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <FileAudio className="h-12 w-12 mx-auto text-muted-foreground" />
                            <div>
                                <p className="text-lg font-medium">
                                    {dragOver ? '释放文件以上传' : '把音频文件拖到这里或者 点击选取'}
                                </p>
                                <p className="text-muted-foreground text-sm mt-2">
                                    支持 MP3, AAC, WAV, OGG, M4A, FLAC 等格式
                                </p>
                                <p className="text-muted-foreground text-xs">无文件大小限制</p>
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept={SUPPORTED_AUDIO_FORMATS.map(format => `.${format}`).join(',')}
                        onChange={onFileInputChange}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
