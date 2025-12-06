'use client';

import React, { useEffect, useRef } from 'react';
import {
    RotateCw,
    RotateCcw,
    RefreshCw,
    Download,
    Play,
    Loader2,
    AlertTriangle,
    Zap,
    Replace,
    Clipboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useImageProcessorStore } from '@/stores/media-processor/image-store';
import { ImageProcessingOptions } from '@/utils/imageProcessor';
import { QualitySlider } from './shared/QualitySlider';
import { FormatSelector } from './shared/FormatSelector';
import { ResizeControl } from './shared/ResizeControl';
import { ExifSwitch } from './shared/ExifSwitch';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';

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
        setInputFile,
        validateFile,
    } = useImageProcessorStore();

    // 更换图片的文件输入引用
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 处理文件选择
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && validateFile(file)) {
            setInputFile(file);
        }
        // 清空 input 以便重复选择同一文件
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 触发文件选择
    const handleChangeImage = () => {
        fileInputRef.current?.click();
    };

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

    // 使用 useClipboardPaste Hook (只选择第一个图片)
    const { handlePaste } = useClipboardPaste({
        onFilesSelected: (files) => {
            if (files.length > 0) {
                // 只处理第一张图片，替换当前图片
                const file = files[0];
                if (validateFile(file)) {
                    setInputFile(file);
                }
            }
        },
        debug: true,
        fileFilter: (file) => file.type.startsWith('image/')
    });

    return (
        <Card className="p-4 space-y-6">
            {/* 错误提示 */}
            {processError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{processError}</AlertDescription>
                </Alert>
            )}

            {/* 状态提示 */}
            {!inputFile && (
                <Alert>
                    <AlertDescription className="text-center">
                        请先上传或粘贴图片开始处理
                    </AlertDescription>
                </Alert>
            )}

            {/* 添加/更换图片和粘贴图片 */}
            <div className="flex gap-2">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button
                    onClick={handlePaste}
                    disabled={isProcessing}
                    variant="outline"
                    size="sm"
                    title="从剪贴板粘贴图片"
                    className="flex-1"
                >
                    <Clipboard className="w-4 h-4 mr-1" />
                    粘贴图片
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleChangeImage}
                    className="flex-1"
                >
                    <Replace className="w-4 h-4 mr-1" />
                    {inputFile ? '更换图片' : '添加图片'}
                </Button>
            </div>

            <Separator />

            {/* 压缩质量 */}
            <QualitySlider
                value={options.quality}
                onChange={(val) => updateOptions({ quality: val })}
                disabled={options.outputFormat === 'png'}
            />

            {/* 输出格式 */}
            <FormatSelector
                value={options.outputFormat}
                onChange={(val) => updateOptions({ outputFormat: val })}
            />

            {/* 尺寸调整 */}
            <ResizeControl
                options={options}
                updateOptions={updateOptions}
                inputMetadata={inputMetadata}
            />

            {/* 旋转 */}
            {inputFile && (
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
            )}

            <Separator />

            {/* 其他选项 */}
            <div className="space-y-4">
                <Label>其他选项</Label>

                {/* 去除 EXIF */}
                <ExifSwitch
                    checked={options.stripMetadata}
                    onCheckedChange={(checked) => updateOptions({ stripMetadata: checked })}
                />

                {/* 输出文件名 */}
                <div className="space-y-2">
                    <Label htmlFor="output-filename">输出文件名</Label>
                    <Input
                        id="output-filename"
                        type="text"
                        placeholder={inputMetadata?.name ? `例如: ${inputMetadata.name.split('.').slice(0, -1).join('.')}_edited` : '自定义文件名'}
                        value={options.outputFilename || ''}
                        onChange={(e) => updateOptions({ outputFilename: e.target.value })}
                    />
                </div>
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
                        disabled={!inputFile || isProcessing}
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
                        disabled={!inputFile || !outputBlob || isProcessing}
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