/**
 * 文字工具 Hook
 */
import { useCallback, useEffect } from 'react';
import { Canvas, IText, TPointerEventInfo, TPointerEvent } from 'fabric';
import type { TextOptions } from '../types';

export function useText(
    canvas: Canvas | null,
    isActive: boolean,
    options: TextOptions,
    onTextAdded: () => void
) {
    // 点击添加文字
    useEffect(() => {
        if (!canvas || !isActive) return;

        const handleMouseDown = (e: TPointerEventInfo<TPointerEvent>) => {
            // 如果点击的是已有对象，不添加新文字
            if (e.target) return;

            const pointer = e.absolutePointer || canvas.getPointer(e.e);

            const text = new IText('文字', {
                left: pointer.x,
                top: pointer.y,
                fontSize: options.fontSize,
                fill: options.color,
                fontFamily: 'Arial, sans-serif',
            });

            canvas.add(text);
            canvas.setActiveObject(text);

            // 进入编辑模式
            text.enterEditing();
            text.selectAll();

            canvas.renderAll();
            onTextAdded();
        };

        canvas.on('mouse:down', handleMouseDown);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
        };
    }, [canvas, isActive, options.color, options.fontSize, onTextAdded]);

    // 更新选中文字的样式
    const updateSelectedText = useCallback((newOptions: Partial<TextOptions>) => {
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === 'i-text') {
            const text = activeObject as IText;

            if (newOptions.color !== undefined) {
                text.set('fill', newOptions.color);
            }
            if (newOptions.fontSize !== undefined) {
                text.set('fontSize', newOptions.fontSize);
            }

            canvas.renderAll();
        }
    }, [canvas]);

    return { updateSelectedText };
}
