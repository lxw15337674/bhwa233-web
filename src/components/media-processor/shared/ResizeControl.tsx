import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageMetadata, ImageProcessingOptions } from '@/utils/imageProcessor';

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
    const [currentWidth, setCurrentWidth] = useState(0);
    const [currentHeight, setCurrentHeight] = useState(0);
    const [keepAspectRatioState, setKeepAspectRatioState] = useState(true);

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

    // Calculate scaled dimensions for display (only works if metadata available)
    const getScaledDimensions = () => {
        if (!inputMetadata) return { width: 0, height: 0 };
        const isRotated = options.rotation === 90 || options.rotation === 270;
        const baseWidth = isRotated ? inputMetadata.height : inputMetadata.width;
        const baseHeight = isRotated ? inputMetadata.width : inputMetadata.height;
        return {
            width: Math.round(baseWidth * options.scale),
            height: Math.round(baseHeight * options.scale),
        };
    };
    const scaledDimensions = getScaledDimensions();

    return (
        <div className="space-y-3">
            <Label>尺寸调整</Label>
            <Tabs defaultValue="percentage" className="w-full" onValueChange={(value) => {
                if (value === 'percentage') {
                    updateOptions({ targetWidth: null, targetHeight: null });
                } else {
                    updateOptions({ scale: 1 });
                    if (inputMetadata) {
                        setCurrentWidth(inputMetadata.width);
                        setCurrentHeight(inputMetadata.height);
                        setKeepAspectRatioState(true);
                        updateOptions({ targetWidth: inputMetadata.width, targetHeight: inputMetadata.height, keepAspectRatio: true });
                    }
                }
            }}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="percentage">按比例缩放</TabsTrigger>
                    <TabsTrigger value="fixed">指定尺寸</TabsTrigger>
                </TabsList>
                <TabsContent value="percentage" className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="scale-slider">缩放比例</Label>
                        <span className="text-sm font-medium">{Math.round(options.scale * 100)}%</span>
                    </div>
                    <Slider
                        id="scale-slider"
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
                </TabsContent>
                <TabsContent value="fixed" className="space-y-4 pt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="width-input">宽度 (px)</Label>
                            <Input
                                id="width-input"
                                type="number"
                                value={currentWidth === 0 ? '' : currentWidth}
                                onChange={handleWidthChange}
                                min={1}
                            />
                        </div>
                        <div>
                            <Label htmlFor="height-input">高度 (px)</Label>
                            <Input
                                id="height-input"
                                type="number"
                                value={currentHeight === 0 ? '' : currentHeight}
                                onChange={handleHeightChange}
                                min={1}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                        <Label htmlFor="keep-aspect-ratio">保持宽高比</Label>
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
                        <Label>常用尺寸</Label>
                        <div className="flex flex-wrap gap-2">
                            {inputMetadata && (
                                <Button variant="outline" size="sm" onClick={() => applyPreset(inputMetadata.width, inputMetadata.height)}>
                                    原图尺寸
                                </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => applyPreset(1920, 1080)}>
                                1920x1080 (FHD)
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => applyPreset(1280, 720)}>
                                1280x720 (HD)
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
