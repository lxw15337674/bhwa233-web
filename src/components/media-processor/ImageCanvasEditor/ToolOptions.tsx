/**
 * 工具选项面板
 */
'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { EditorTool, BrushOptions, TextOptions, MosaicOptions } from './types';

// 预设颜色
const PRESET_COLORS = [
    '#ff0000', // 红
    '#ff9500', // 橙
    '#ffcc00', // 黄
    '#34c759', // 绿
    '#007aff', // 蓝
    '#5856d6', // 紫
    '#000000', // 黑
    '#ffffff', // 白
];

interface ToolOptionsProps {
    tool: EditorTool;
    brushOptions: BrushOptions;
    textOptions: TextOptions;
    mosaicOptions: MosaicOptions;
    onBrushChange: (options: Partial<BrushOptions>) => void;
    onTextChange: (options: Partial<TextOptions>) => void;
    onMosaicChange: (options: Partial<MosaicOptions>) => void;
}

export const ToolOptions: React.FC<ToolOptionsProps> = ({
    tool,
    brushOptions,
    textOptions,
    mosaicOptions,
    onBrushChange,
    onTextChange,
    onMosaicChange,
}) => {
    if (tool === 'select' || tool === 'crop') {
        return null;
    }

    return (
        <div className="flex items-center gap-4 p-2 bg-muted/50 rounded-lg">
            {/* 画笔选项 */}
            {tool === 'brush' && (
                <>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">颜色</Label>
                        <div className="flex gap-1">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${brushOptions.color === color
                                            ? 'border-primary scale-110'
                                            : 'border-transparent hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => onBrushChange({ color })}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">粗细</Label>
                        <Slider
                            value={[brushOptions.size]}
                            onValueChange={([size]) => onBrushChange({ size })}
                            min={1}
                            max={30}
                            step={1}
                            className="w-24"
                        />
                        <span className="text-xs text-muted-foreground w-6">{brushOptions.size}</span>
                    </div>
                </>
            )}

            {/* 文字选项 */}
            {tool === 'text' && (
                <>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">颜色</Label>
                        <div className="flex gap-1">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${textOptions.color === color
                                            ? 'border-primary scale-110'
                                            : 'border-transparent hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() => onTextChange({ color })}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">字号</Label>
                        <Slider
                            value={[textOptions.fontSize]}
                            onValueChange={([fontSize]) => onTextChange({ fontSize })}
                            min={12}
                            max={72}
                            step={2}
                            className="w-24"
                        />
                        <span className="text-xs text-muted-foreground w-6">{textOptions.fontSize}</span>
                    </div>
                </>
            )}

            {/* 马赛克选项 */}
            {(tool === 'mosaic-pixel' || tool === 'mosaic-blur') && (
                <>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">类型</Label>
                        <ToggleGroup
                            type="single"
                            value={mosaicOptions.type}
                            onValueChange={(value) => {
                                if (value) onMosaicChange({ type: value as 'pixel' | 'blur' });
                            }}
                            size="sm"
                        >
                            <ToggleGroupItem value="pixel" className="text-xs">
                                像素化
                            </ToggleGroupItem>
                            <ToggleGroupItem value="blur" className="text-xs">
                                模糊
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs whitespace-nowrap">大小</Label>
                        <Slider
                            value={[mosaicOptions.size]}
                            onValueChange={([size]) => onMosaicChange({ size })}
                            min={20}
                            max={100}
                            step={5}
                            className="w-24"
                        />
                        <span className="text-xs text-muted-foreground w-6">{mosaicOptions.size}</span>
                    </div>
                </>
            )}
        </div>
    );
};
