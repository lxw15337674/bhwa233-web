/**
 * 马赛克工具 Hook
 * 方案 F：使用 clipPath 蒙版，不再替换图片
 */
import { useEffect, useRef } from 'react';
import { Canvas, FabricImage, TPointerEventInfo, TPointerEvent } from 'fabric';
import type { MosaicOptions } from '../types';

interface UseMosaicProps {
    canvas: Canvas | null;
    backgroundImage: FabricImage | null;
    isActive: boolean;
    options: MosaicOptions;
    addMosaicCircle: (x: number, y: number, radius: number, type: 'pixel' | 'blur') => void;
    onMosaicApplied: () => void;
}

export function useMosaic({
    canvas,
    backgroundImage,
    isActive,
    options,
    addMosaicCircle,
    onMosaicApplied,
}: UseMosaicProps) {
    const isDrawing = useRef(false);
    const lastPoint = useRef<{ x: number; y: number } | null>(null);
    const hasDrawn = useRef(false);

    useEffect(() => {
        if (!canvas || !backgroundImage || !isActive) return;

        // 禁用对象选择
        canvas.selection = false;
        canvas.isDrawingMode = false;
        canvas.defaultCursor = 'crosshair';

        const handleMouseDown = (e: TPointerEventInfo<TPointerEvent>) => {
            isDrawing.current = true;
            hasDrawn.current = false;
            const pointer = canvas.getPointer(e.e);
            lastPoint.current = { x: pointer.x, y: pointer.y };
            applyMosaicAtPoint(pointer.x, pointer.y);
        };

        const handleMouseMove = (e: TPointerEventInfo<TPointerEvent>) => {
            if (!isDrawing.current) return;

            const pointer = canvas.getPointer(e.e);

            // 插值绘制，确保连续
            if (lastPoint.current) {
                const dx = pointer.x - lastPoint.current.x;
                const dy = pointer.y - lastPoint.current.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const step = options.size / 4;
                const steps = Math.ceil(distance / step);

                for (let i = 1; i <= steps; i++) {
                    const t = i / steps;
                    const x = lastPoint.current.x + dx * t;
                    const y = lastPoint.current.y + dy * t;
                    applyMosaicAtPoint(x, y);
                }
            }

            lastPoint.current = { x: pointer.x, y: pointer.y };
        };

        const handleMouseUp = () => {
            if (isDrawing.current && hasDrawn.current) {
                isDrawing.current = false;
                lastPoint.current = null;
                onMosaicApplied();
            }
            isDrawing.current = false;
        };

        const applyMosaicAtPoint = (x: number, y: number) => {
            if (!backgroundImage) return;

            // 检查点是否在背景图范围内
            const bgLeft = backgroundImage.left || 0;
            const bgTop = backgroundImage.top || 0;
            const bgWidth = backgroundImage.width! * (backgroundImage.scaleX || 1);
            const bgHeight = backgroundImage.height! * (backgroundImage.scaleY || 1);

            if (x < bgLeft || x > bgLeft + bgWidth || y < bgTop || y > bgTop + bgHeight) {
                return;
            }

            // 添加马赛克圆形
            const radius = options.size / 2;
            addMosaicCircle(x, y, radius, options.type);
            hasDrawn.current = true;
        };

        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', handleMouseUp);

        return () => {
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
            canvas.selection = true;
            canvas.defaultCursor = 'default';
        };
    }, [canvas, backgroundImage, isActive, options, addMosaicCircle, onMosaicApplied]);

    return {};
}
