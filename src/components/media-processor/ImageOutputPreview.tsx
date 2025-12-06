'use client';

import React from 'react';
import Image from 'next/image';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useImageProcessorStore } from '@/stores/media-processor/image-store';
import { formatFileSize, calculateCompressionRatio } from '@/utils/imageProcessor';
import { ImageExifPanel } from './ImageExifPanel';

export const ImageOutputPreview: React.FC = () => {
    const {
        inputFile,
        inputUrl,
        outputUrl,
        outputMetadata,
        inputMetadata,
        isProcessing,
    } = useImageProcessorStore();

    // 处理中状态
    if (isProcessing) {
        return (
            <Card className="p-4">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span>处理中...</span>
                    </div>
                </div>
            </Card>
        );
    }

    // 显示的图片 URL（优先显示处理后，否则显示原图）
    const displayUrl = outputUrl || inputUrl;

    // 无图片可显示时显示占位
    if (!displayUrl) {
        return (
            <Card className="p-4">
                <div className="relative aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>请上传图片</p>
                    </div>
                </div>
            </Card>
        );
    }

    // 计算压缩比（只有处理后才显示）
    const compressionRatio = inputMetadata && outputMetadata
        ? calculateCompressionRatio(inputMetadata.size, outputMetadata.size)
        : null;

    // 格式化格式名称 (image/jpeg -> jpeg)
    const formatType = (format: string) => {
        return format.replace(/^image\//, '');
    };

    // 当前显示的元数据（处理后 or 原图）
    const displayMetadata = outputMetadata || inputMetadata;

    return (
        <Card className="p-4">
            {/* 图片预览 */}
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <Image
                    src={displayUrl}
                    alt="处理后预览"
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'contain' }}
                />
            </div>

            {/* 底部信息栏 */}
            <div className="mt-3 space-y-3">
                {/* 图片信息 - 表格对比显示 */}
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16"></TableHead>
                            <TableHead className="text-center">格式</TableHead>
                            <TableHead className="text-center">尺寸</TableHead>
                            <TableHead className="text-center">大小</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* 原图 */}
                        {inputMetadata && (
                            <TableRow>
                                <TableCell className="font-medium text-muted-foreground">原图</TableCell>
                                <TableCell className="text-center">{formatType(inputMetadata.format)}</TableCell>
                                <TableCell className="text-center">{inputMetadata.width} × {inputMetadata.height}</TableCell>
                                <TableCell className="text-center">{formatFileSize(inputMetadata.size)}</TableCell>
                            </TableRow>
                        )}
                        {/* 处理后 */}
                        <TableRow>
                            <TableCell className="font-medium text-muted-foreground">结果</TableCell>
                            <TableCell className="text-center">{formatType(outputMetadata.format)}</TableCell>
                            <TableCell className="text-center">{outputMetadata.width} × {outputMetadata.height}</TableCell>
                            <TableCell className="text-center">
                                <span>{formatFileSize(outputMetadata.size)}</span>
                                {compressionRatio && (
                                    <span className={`ml-2 px-2 py-0.5 rounded font-medium ${compressionRatio.startsWith('-')
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                        }`}>
                                        {compressionRatio}
                                    </span>
                                )}
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>

            </div>
        </Card>
    );
};
