import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageMetadata, ImageProcessingOptions } from '@/utils/imageProcessor';
import { useTranslation } from '@/components/TranslationProvider';

interface ResizeControlProps {
    options: ImageProcessingOptions;
    updateOptions: (options: Partial<ImageProcessingOptions>) => void;
    inputMetadata?: ImageMetadata | null; // Optional for batch mode
}

export const ResizeControl: React.FC<ResizeControlProps> = ({
    options,
    updateOptions,
    inputMetadata,
}) => {
    const { t } = useTranslation();
    const [currentWidth, setCurrentWidth] = useState(0);
    const [currentHeight, setCurrentHeight] = useState(0);
    const [keepAspectRatioState, setKeepAspectRatioState] = useState(false);

    // Sync local state with options/metadata
    useEffect(() => {
        if (inputMetadata) {
            // If we have metadata (single image mode), sync with it if not set
            if (options.targetWidth === null && currentWidth === 0) {
                setCurrentWidth(inputMetadata.width);
            }
            if (options.targetHeight === null && currentHeight === 0) {
                setCurrentHeight(inputMetadata.height);
            }
        }
    }, [inputMetadata, options.targetWidth, options.targetHeight]);

    // Also sync if options change externally (e.g. reset)
    useEffect(() => {
        if (options.targetWidth !== null) setCurrentWidth(options.targetWidth);
        if (options.targetHeight !== null) setCurrentHeight(options.targetHeight);
        if (options.keepAspectRatio !== undefined) setKeepAspectRatioState(options.keepAspectRatio);
    }, [options.targetWidth, options.targetHeight, options.keepAspectRatio]);


    const handleWidthChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const newWidth = parseInt(e.target.value, 10);
        if (isNaN(newWidth) || newWidth <= 0) {
            setCurrentWidth(0);
            updateOptions({ targetWidth: null });
            return;
        }
        setCurrentWidth(newWidth);
        let newHeight = currentHeight;

        if (keepAspectRatioState && inputMetadata && inputMetadata.width > 0) {
            newHeight = Math.round(newWidth / inputMetadata.width * inputMetadata.height);
            setCurrentHeight(newHeight);
        }
        updateOptions({ targetWidth: newWidth, targetHeight: newHeight || null, keepAspectRatio: keepAspectRatioState });
    }, [currentHeight, keepAspectRatioState, inputMetadata, updateOptions]);

    const handleHeightChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const newHeight = parseInt(e.target.value, 10);
        if (isNaN(newHeight) || newHeight <= 0) {
            setCurrentHeight(0);
            updateOptions({ targetHeight: null });
            return;
        }
        setCurrentHeight(newHeight);
        let newWidth = currentWidth;
        if (keepAspectRatioState && inputMetadata && inputMetadata.height > 0) {
            newWidth = Math.round(newHeight / inputMetadata.height * inputMetadata.width);
            setCurrentWidth(newWidth);
        }
        updateOptions({ targetWidth: newWidth || null, targetHeight: newHeight, keepAspectRatio: keepAspectRatioState });
    }, [currentWidth, keepAspectRatioState, inputMetadata, updateOptions]);

    const applyPreset = useCallback((width: number, height: number) => {
        if (width <= 0 || height <= 0) return;
        setCurrentWidth(width);
        setCurrentHeight(height);
        // 保持当前的宽高比设置，不强制改变
        updateOptions({ targetWidth: width, targetHeight: height, keepAspectRatio: keepAspectRatioState });
    }, [keepAspectRatioState, updateOptions]);
    
    const isPresetActive = useCallback((w: number, h: number) => {
        return currentWidth === w && currentHeight === h;
    }, [currentWidth, currentHeight]);

    return (
        <div className="space-y-4">
            <Label>{t('imageProcessor.resize')}</Label>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="width-input">{t('imageProcessor.width')} (px)</Label>
                    <Input
                        id="width-input"
                        type="number"
                        value={currentWidth === 0 ? '' : currentWidth}
                        onChange={handleWidthChange}
                        min={1}
                        max={99999}
                    />
                </div>
                <div>
                    <Label htmlFor="height-input">{t('imageProcessor.height')} (px)</Label>
                    <Input
                        id="height-input"
                        type="number"
                        value={currentHeight === 0 ? '' : currentHeight}
                        onChange={handleHeightChange}
                        min={1}
                        max={99999}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between mt-4">
                <Label htmlFor="keep-aspect-ratio">{t('imageProcessor.keepAspectRatio')}</Label>
                <Switch
                    id="keep-aspect-ratio"
                    checked={keepAspectRatioState}
                    onCheckedChange={(checked) => {
                        setKeepAspectRatioState(checked);
                        updateOptions({ keepAspectRatio: checked });
                        // 如果开启保持宽高比，重新计算高度
                        if (checked && inputMetadata && currentWidth > 0) {
                            const newHeight = Math.round(currentWidth / inputMetadata.width * inputMetadata.height);
                            setCurrentHeight(newHeight);
                            updateOptions({ targetHeight: newHeight });
                        }
                    }}
                />
            </div>

            <div className="space-y-2 mt-4">
                <Label>{t('imageProcessor.presetSizes')}</Label>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={
                            (inputMetadata && isPresetActive(inputMetadata.width, inputMetadata.height)) ||
                            (!inputMetadata && currentWidth === 0 && currentHeight === 0)
                                ? "secondary"
                                : "outline"
                        }
                        size="sm"
                        onClick={() => {
                            if (inputMetadata) {
                                applyPreset(inputMetadata.width, inputMetadata.height);
                            } else {
                                setCurrentWidth(0);
                                setCurrentHeight(0);
                                updateOptions({ targetWidth: null, targetHeight: null });
                            }
                        }}
                    >
                        {t('imageProcessor.originalSize')}
                    </Button>
                    <Button
                        variant={isPresetActive(1920, 1080) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => applyPreset(1920, 1080)}
                    >
                        1920x1080 (FHD)
                    </Button>
                    <Button
                        variant={isPresetActive(1280, 720) ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => applyPreset(1280, 720)}
                    >
                        1280x720 (HD)
                    </Button>
                </div>
            </div>
        </div>
    );
};
