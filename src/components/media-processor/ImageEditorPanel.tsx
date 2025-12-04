'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import {
    RotateCw,
    RotateCcw,
    RefreshCw,
    Download,
    ShieldX,
    Play,
    Loader2,
    AlertTriangle,
    Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useImageProcessorStore } from '@/stores/media-processor/image-store';
import { ImageProcessingOptions } from '@/utils/imageProcessor';

export const ImageEditorPanel: React.FC = () => {
    const {
        inputFile,
        inputMetadata,
        options,
        autoProcess,
        outputBlob,
        isProcessing,
        processError,
        updateOptions,
        resetOptions,
        setAutoProcess,
        processImage,
        downloadOutput,
    } = useImageProcessorStore();

    // 防抖定时器
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // 上一次 options 的序列化值，用于检测变化
    const prevOptionsRef = useRef<string>('');

    // 自动处理：当开启自动处理且 options 变化时，防抖触发处理
    useEffect(() => {
        if (!autoProcess || !inputFile) return;

        const currentOptionsStr = JSON.stringify(options);

        // 首次加载或 options 没变化时不触发
        if (prevOptionsRef.current === '' || prevOptionsRef.current === currentOptionsStr) {
            prevOptionsRef.current = currentOptionsStr;
            return;
        }

        prevOptionsRef.current = currentOptionsStr;

        // 清除之前的定时器
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // 500ms 防抖
        debounceTimerRef.current = setTimeout(() => {
            processImage();
        }, 500);

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [autoProcess, inputFile, options, processImage]);

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
            {/* 错误提示 */}
            {processError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{processError}</AlertDescription>
                </Alert>
            )}

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

            {/* 旋转 */}
            <div className="space-y-3">
                <Label>旋转</Label>
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
                        onClick={() => handleRotate('cw')}
                        title="顺时针旋转 90°"
                    >
                        <RotateCw className="w-4 h-4 mr-1" />
                        +90°
                    </Button>
                </div>
                {options.rotation !== 0 && (
                    <p className="text-xs text-muted-foreground">
                        当前: 旋转 {options.rotation}°
                    </p>
                )}
            </div>

            <Separator />

            {/* 其他选项 */}
            <div className="space-y-4">
                <Label>其他选项</Label>

                {/* 去除 EXIF */}
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 font-normal cursor-pointer">
                        <ShieldX className="w-4 h-4" />
                        去除 EXIF 信息
                    </Label>
                    <Switch
                        checked={options.stripMetadata}
                        onCheckedChange={(checked) => updateOptions({ stripMetadata: checked })}
                    />
                </div>
                <p className="text-xs text-muted-foreground -mt-2">
                    移除 GPS 位置、拍摄设备等隐私信息
                </p>
            </div>

            <Separator />

            {/* 操作按钮 */}
            <div className="flex flex-col gap-2 pt-2">
                {/* 自动处理开关 */}
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 font-normal cursor-pointer">
                        <Zap className="w-4 h-4" />
                        自动处理
                    </Label>
                    <Switch
                        checked={autoProcess}
                        onCheckedChange={setAutoProcess}
                    />
                </div>
                <p className="text-xs text-muted-foreground -mt-1 mb-2">
                    调整参数后自动处理图片
                </p>

                {/* 手动处理按钮 - 仅在关闭自动处理时显示 */}
                {!autoProcess && (
                    <Button
                        onClick={processImage}
                        disabled={isProcessing}
                        className="w-full"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                处理中...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                开始处理
                            </>
                        )}
                    </Button>
                )}

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={resetOptions}
                        className="flex-1"
                        disabled={isProcessing}
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
            </div>
        </Card>
    );
};
