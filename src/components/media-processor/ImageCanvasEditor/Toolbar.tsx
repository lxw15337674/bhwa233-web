/**
 * 工具栏组件
 */
'use client';

import React from 'react';
import {
    Pencil,
    Type,
    Grid3X3,
    Crop,
    Undo2,
    Redo2,
    MousePointer2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import type { EditorTool } from './types';

interface ToolbarProps {
    currentTool: EditorTool;
    onToolChange: (tool: EditorTool) => void;
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    isCropping: boolean;
    onCropConfirm: () => void;
    onCropCancel: () => void;
}

const tools: Array<{
    id: EditorTool;
    icon: React.ReactNode;
    label: string;
}> = [
        { id: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: '选择' },
        { id: 'brush', icon: <Pencil className="w-4 h-4" />, label: '画笔' },
        { id: 'text', icon: <Type className="w-4 h-4" />, label: '文字' },
        { id: 'mosaic-pixel', icon: <Grid3X3 className="w-4 h-4" />, label: '马赛克' },
        { id: 'crop', icon: <Crop className="w-4 h-4" />, label: '裁剪' },
    ];

export const Toolbar: React.FC<ToolbarProps> = ({
    currentTool,
    onToolChange,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    isCropping,
    onCropConfirm,
    onCropCancel,
}) => {
    return (
        <TooltipProvider>
            <div className="flex items-center gap-1">
                {/* 工具按钮 */}
                {tools.map((tool) => (
                    <Tooltip key={tool.id}>
                        <TooltipTrigger asChild>
                            <Button
                                variant={currentTool === tool.id ||
                                    (tool.id === 'mosaic-pixel' && currentTool === 'mosaic-blur')
                                    ? 'default'
                                    : 'ghost'}
                                size="sm"
                                onClick={() => onToolChange(tool.id)}
                                disabled={isCropping && tool.id !== 'crop'}
                            >
                                {tool.icon}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{tool.label}</p>
                        </TooltipContent>
                    </Tooltip>
                ))}

                <Separator orientation="vertical" className="h-6 mx-2" />

                {/* 撤销/重做 */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onUndo}
                            disabled={!canUndo || isCropping}
                        >
                            <Undo2 className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>撤销</p>
                    </TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRedo}
                            disabled={!canRedo || isCropping}
                        >
                            <Redo2 className="w-4 h-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>重做</p>
                    </TooltipContent>
                </Tooltip>

                {/* 裁剪确认/取消 */}
                {isCropping && (
                    <>
                        <Separator orientation="vertical" className="h-6 mx-2" />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onCropCancel}
                        >
                            取消裁剪
                        </Button>
                        <Button
                            size="sm"
                            onClick={onCropConfirm}
                        >
                            应用裁剪
                        </Button>
                    </>
                )}
            </div>
        </TooltipProvider>
    );
};
