'use client';

import React, { useEffect, useCallback } from 'react';
import {
    RotateCw,
    RotateCcw,
    FlipHorizontal,
    FlipVertical,
    RefreshCw,
    Download,
    Lock,
    Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useImageProcessorStore } from '@/stores/media-processor/image-store';
import { ImageProcessingOptions } from '@/utils/imageProcessor';
import { useThrottle } from '@/hooks/useThrottle';

export const ImageEditorPanel: React.FC = () => {
    const {
        inputFile,
        inputMetadata,
        options,
        outputBlob,
        isProcessing,
        vipsLoaded,
        updateOptions,
        resetOptions,
        processImage,
        downloadOutput,
    } = useImageProcessorStore();

    // 防抖处理图片
    const throttledProcess = useThrottle(() => {
        if (inputFile && vipsLoaded) {
            processImage();
        }
    }, 500);

    // 当选项变化时自动处理
    useEffect(() => {
        if (inputFile && vipsLoaded) {
            throttledProcess();
        }
    }, [options, inputFile, vipsLoaded]);

    // 处理旋转
    const handleRotate = (direction: 'cw' | 'ccw' | '180') => {
        const currentRotation = options.rotation;
        let newRotation: 0 | 90 | 180 | 270;

        if (direction === 'cw') {
            newRotation = ((currentRotation + 90) % 360) as 0 | 90 | 180 | 270;
        } else if (direction === 'ccw') {
            newRotation = ((currentRotation - 90 + 360) % 360) as 0 | 90 | 180 | 270;
        } else {
            newRotation = ((currentRotation + 180) % 360) as 0 | 90 | 180 | 270;
        }

        updateOptions({ rotation: newRotation });
    };

    // 处理翻转
    const handleFlip = (direction: 'horizontal' | 'vertical') => {
        if (direction === 'horizontal') {
            updateOptions({ flipHorizontal: !options.flipHorizontal });
        } else {
            updateOptions({ flipVertical: !options.flipVertical });
        }
    };

    // 处理格式变化
    const handleFormatChange = (value: string) => {
        if (value) {
            updateOptions({ outputFormat: value as ImageProcessingOptions['outputFormat'] });
        }
    };

    // 计算缩放后的尺寸
    const getScaledDimensions = useCallback(() => {
        if (!inputMetadata) return { width: 0, height: 0 };

        // 考虑旋转
        const isRotated = options.rotation === 90 || options.rotation === 270;
        const baseWidth = isRotated ? inputMetadata.height : inputMetadata.width;
        const baseHeight = isRotated ? inputMetadata.width : inputMetadata.height;

        return {
            width: Math.round(baseWidth * options.scale),
            height: Math.round(baseHeight * options.scale),
        };
    }, [inputMetadata, options.rotation, options.scale]);

    const scaledDimensions = getScaledDimensions();

    if (!inputFile) {
        return null;
    }

    return (
        <Card className="p-4 space-y-6">
            {/* 压缩质量 */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>压缩质量</Label>
                    <span className="text-sm font-medium">{options.quality}%</span>
                </div>
                <Slider
                    value={[options.quality]}
                    onValueChange={(value) => updateOptions({ quality: value[0] })}
                    min={1}
                    max={100}
                    step={1}
                    disabled={options.outputFormat === 'png'}
                />
                {options.outputFormat === 'png' && (
                    <p className="text-xs text-muted-foreground">PNG 格式为无损压缩，质量设置不生效</p>
                )}
            </div>

            {/* 输出格式 */}
            <div className="space-y-3">
                <Label>输出格式</Label>
                <ToggleGroup
                    type="single"
                    value={options.outputFormat}
                    onValueChange={handleFormatChange}
                    className="justify-start flex-wrap"
                >
                    <ToggleGroupItem value="jpeg" aria-label="JPEG">
                        JPEG
                    </ToggleGroupItem>
                    <ToggleGroupItem value="png" aria-label="PNG">
                        PNG
                    </ToggleGroupItem>
                    <ToggleGroupItem value="webp" aria-label="WebP">
                        WebP
                    </ToggleGroupItem>
                    <ToggleGroupItem value="avif" aria-label="AVIF">
                        AVIF
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            {/* 尺寸调整 */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>缩放比例</Label>
                    <span className="text-sm font-medium">{Math.round(options.scale * 100)}%</span>
                </div>
                <Slider
                    value={[options.scale * 100]}
                    onValueChange={(value) => updateOptions({ scale: value[0] / 100 })}
                    min={10}
                    max={200}
                    step={5}
                />
                {inputMetadata && (
                    <p className="text-xs text-muted-foreground">
                        输出尺寸: {scaledDimensions.width} × {scaledDimensions.height}
                    </p>
                )}
            </div>

            {/* 旋转/翻转 */}
            <div className="space-y-3">
                <Label>旋转 / 翻转</Label>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotate('ccw')}
                        title="逆时针旋转 90°"
                    >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        -90°
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotate('180')}
                        title="旋转 180°"
                    >
                        180°
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRotate('cw')}
                        title="顺时针旋转 90°"
                    >
                        <RotateCw className="w-4 h-4 mr-1" />
                        +90°
                    </Button>
                    <Button
                        variant={options.flipHorizontal ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFlip('horizontal')}
                        title="水平翻转"
                    >
                        <FlipHorizontal className="w-4 h-4" />
                    </Button>
                    <Button
                        variant={options.flipVertical ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFlip('vertical')}
                        title="垂直翻转"
                    >
                        <FlipVertical className="w-4 h-4" />
                    </Button>
                </div>
                {(options.rotation !== 0 || options.flipHorizontal || options.flipVertical) && (
                    <p className="text-xs text-muted-foreground">
                        当前: 旋转 {options.rotation}°
                        {options.flipHorizontal && ' + 水平翻转'}
                        {options.flipVertical && ' + 垂直翻转'}
                    </p>
                )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2 pt-2">
                <Button
                    variant="outline"
                    onClick={resetOptions}
                    className="flex-1"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    重置参数
                </Button>
                <Button
                    onClick={downloadOutput}
                    disabled={!outputBlob || isProcessing}
                    className="flex-1"
                >
                    <Download className="w-4 h-4 mr-2" />
                    下载图片
                </Button>
            </div>
        </Card>
    );
};
