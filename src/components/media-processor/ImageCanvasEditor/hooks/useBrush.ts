/**
 * 画笔工具 Hook
 */
import { useCallback, useEffect } from 'react';
import { Canvas, PencilBrush } from 'fabric';
import type { BrushOptions } from '../types';

export function useBrush(
    canvas: Canvas | null,
    isActive: boolean,
    options: BrushOptions,
    onDrawEnd: () => void
) {
    // 初始化画笔
    useEffect(() => {
        if (!canvas) return;

        if (isActive) {
            canvas.isDrawingMode = true;
            const brush = new PencilBrush(canvas);
            brush.color = options.color;
            brush.width = options.size;
            canvas.freeDrawingBrush = brush;
        } else {
            canvas.isDrawingMode = false;
        }
    }, [canvas, isActive, options.color, options.size]);

    // 监听绘制结束
    useEffect(() => {
        if (!canvas || !isActive) return;

        const handlePathCreated = () => {
            onDrawEnd();
        };

        canvas.on('path:created', handlePathCreated);

        return () => {
            canvas.off('path:created', handlePathCreated);
        };
    }, [canvas, isActive, onDrawEnd]);

    // 更新画笔选项
    const updateBrush = useCallback((newOptions: Partial<BrushOptions>) => {
        if (!canvas || !canvas.freeDrawingBrush) return;

        if (newOptions.color !== undefined) {
            canvas.freeDrawingBrush.color = newOptions.color;
        }
        if (newOptions.size !== undefined) {
            canvas.freeDrawingBrush.width = newOptions.size;
        }
    }, [canvas]);

    return { updateBrush };
}
