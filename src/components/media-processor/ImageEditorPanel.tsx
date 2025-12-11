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
    Upload,
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
import { useTranslation } from '@/components/TranslationProvider';

export const ImageEditorPanel: React.FC = () => {
    const { t } = useTranslation();
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
                        {t('imageProcessor.uploadOrPaste')}
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
                    title={t('imageProcessor.pasteFromClipboard')}
                    className="flex-1"
                >
                    <Clipboard className="w-4 h-4 mr-1" />
                    {t('imageProcessor.pasteFromClipboard')}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChangeImage}
                    className="flex-1"
                >
                    <Upload className="w-4 h-4 mr-1" />
                    {inputFile ? t('imageProcessor.changeImage') : t('imageProcessor.addImage')}
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
                defaultTabValue="fixed"
            />

            {/* 旋转 */}
            {inputFile && (
                <div className="space-y-3">
                    <Label>{t('imageProcessor.rotation')}</Label>
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRotate('ccw')}
                            title={t('imageProcessor.rotateCCW')}
                        >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            -90°
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRotate('cw')}
                            title={t('imageProcessor.rotateCW')}
                        >
                            <RotateCw className="w-4 h-4 mr-1" />
                            +90°
                        </Button>
                    </div>
                    {options.rotation !== 0 && (
                        <p className="text-xs text-muted-foreground">
                            {t('imageProcessor.currentRotation', { degrees: options.rotation })}
                        </p>
                    )}
                </div>
            )}

            <Separator />

            {/* 其他选项 */}
            <div className="space-y-4">
                <Label>{t('imageProcessor.otherOptions')}</Label>

                {/* 去除 EXIF */}
                <ExifSwitch
                    checked={options.stripMetadata}
                    onCheckedChange={(checked) => updateOptions({ stripMetadata: checked })}
                />

                {/* 输出文件名 */}
                <div className="space-y-2">
                    <Label htmlFor="output-filename">{t('imageProcessor.outputFilename')}</Label>
                    <Input
                        id="output-filename"
                        type="text"
                        placeholder={inputMetadata?.name 
                            ? t('imageProcessor.filenamePlaceholder', { name: inputMetadata.name.split('.').slice(0, -1).join('.') })
                            : t('imageProcessor.customFilename')}
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
                        {t('imageProcessor.autoProcess')}
                    </Label>
                    <Switch
                        checked={autoProcess}
                        onCheckedChange={setAutoProcess}
                    />
                </div>
                <p className="text-xs text-muted-foreground -mt-1 mb-2">
                    {t('imageProcessor.autoProcessHint')}
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
                                {t('imageProcessor.processing')}
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                {t('imageProcessor.startProcess')}
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
                        {t('imageProcessor.resetParams')}
                    </Button>
                    <Button
                        onClick={downloadOutput}
                        disabled={!inputFile || !outputBlob || isProcessing}
                        className="flex-1"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        {t('imageProcessor.download')}
                    </Button>
                </div>
            </div>
        </Card>
    );
};