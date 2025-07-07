import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle2 } from 'lucide-react';
import { isValidVideoFile, SUPPORTED_VIDEO_FORMATS } from '@/utils/audioConverter';

interface FileUploadAreaProps {
    selectedFile: File | null;
    dragOver: boolean;
    onFileSelect: (file: File) => void;
    onReset: () => void;
    onDragEnter: () => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onFileInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef?: React.RefObject<HTMLInputElement | null>;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
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

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (!isValidVideoFile(file.name)) {
                alert(`不支持的文件格式。支持的格式: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`);
                return;
            }
            onFileSelect(file);
        }
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
                                <p className="font-medium text-lg">{selectedFile.name}</p>
                                <p className="text-muted-foreground">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <p className="text-sm text-green-600 mt-2">已添加到转换列表</p>
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
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                            <div>
                                <p className="text-lg font-medium">
                                    {dragOver ? '释放文件以上传' : '把文件拖到这里或者 点击选取'}
                                </p>
                                <p className="text-muted-foreground text-sm mt-2">
                                    支持 MP4, AVI, MOV, MKV, WMV, FLV 等格式
                                </p>
                                <p className="text-muted-foreground text-xs">无文件大小限制</p>
                            </div>
                        </div>
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="video/*"
                        onChange={handleFileInputChange}
                    />
                </div>
            </CardContent>
        </Card>
    );
};
