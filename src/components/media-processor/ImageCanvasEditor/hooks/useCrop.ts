/**
 * 裁剪工具 Hook
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, Rect, FabricImage } from 'fabric';
import type { CropArea } from '../types';

export function useCrop(
    canvas: Canvas | null,
    backgroundImage: FabricImage | null,
    isActive: boolean,
    onCropApplied: (croppedImageUrl: string) => void
) {
    const [cropArea, setCropArea] = useState<CropArea | null>(null);
    const cropRectRef = useRef<Rect | null>(null);
    const overlayRectsRef = useRef<Rect[]>([]);

    // 创建裁剪框
    useEffect(() => {
        if (!canvas || !backgroundImage) return;

        if (isActive) {
            // 创建初始裁剪框（居中，占 80%）
            const imgWidth = backgroundImage.width! * (backgroundImage.scaleX || 1);
            const imgHeight = backgroundImage.height! * (backgroundImage.scaleY || 1);
            const imgLeft = backgroundImage.left || 0;
            const imgTop = backgroundImage.top || 0;

            const cropWidth = imgWidth * 0.8;
            const cropHeight = imgHeight * 0.8;
            const cropLeft = imgLeft + (imgWidth - cropWidth) / 2;
            const cropTop = imgTop + (imgHeight - cropHeight) / 2;

            // 创建裁剪框
            const cropRect = new Rect({
                left: cropLeft,
                top: cropTop,
                width: cropWidth,
                height: cropHeight,
                fill: 'transparent',
                stroke: '#ffffff',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                cornerColor: '#ffffff',
                cornerStrokeColor: '#000000',
                cornerSize: 10,
                transparentCorners: false,
                hasRotatingPoint: false,
                lockRotation: true,
            });

            // 创建遮罩层（四个矩形覆盖裁剪区域外部）
            const overlays = createOverlays(canvas, cropRect, imgLeft, imgTop, imgWidth, imgHeight);

            canvas.add(...overlays, cropRect);
            canvas.setActiveObject(cropRect);
            canvas.renderAll();

            cropRectRef.current = cropRect;
            overlayRectsRef.current = overlays;

            // 监听裁剪框变化
            const updateOverlays = () => {
                if (!cropRectRef.current) return;
                updateOverlayPositions(overlays, cropRectRef.current, imgLeft, imgTop, imgWidth, imgHeight);
                canvas.renderAll();
            };

            cropRect.on('moving', updateOverlays);
            cropRect.on('scaling', updateOverlays);
            cropRect.on('modified', updateOverlays);

            setCropArea({
                left: cropLeft,
                top: cropTop,
                width: cropWidth,
                height: cropHeight,
            });
        } else {
            // 清理裁剪框和遮罩
            if (cropRectRef.current) {
                canvas.remove(cropRectRef.current);
                cropRectRef.current = null;
            }
            overlayRectsRef.current.forEach(rect => canvas.remove(rect));
            overlayRectsRef.current = [];
            setCropArea(null);
            canvas.renderAll();
        }
    }, [canvas, backgroundImage, isActive]);

    // 应用裁剪
    const applyCrop = useCallback(() => {
        if (!canvas || !backgroundImage || !cropRectRef.current) return;

        const cropRect = cropRectRef.current;
        const scaleX = backgroundImage.scaleX || 1;
        const scaleY = backgroundImage.scaleY || 1;
        const imgLeft = backgroundImage.left || 0;
        const imgTop = backgroundImage.top || 0;

        // 计算相对于原图的裁剪区域
        const cropX = (cropRect.left! - imgLeft) / scaleX;
        const cropY = (cropRect.top! - imgTop) / scaleY;
        const cropW = (cropRect.width! * (cropRect.scaleX || 1)) / scaleX;
        const cropH = (cropRect.height! * (cropRect.scaleY || 1)) / scaleY;

        // 获取原图
        const bgElement = backgroundImage.getElement() as HTMLCanvasElement | HTMLImageElement;
        const sourceWidth = bgElement.width || (bgElement as HTMLImageElement).naturalWidth;
        const sourceHeight = bgElement.height || (bgElement as HTMLImageElement).naturalHeight;

        // 创建裁剪后的 canvas
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = Math.round(cropW);
        resultCanvas.height = Math.round(cropH);
        const ctx = resultCanvas.getContext('2d')!;

        ctx.drawImage(
            bgElement,
            Math.round(cropX), Math.round(cropY),
            Math.round(cropW), Math.round(cropH),
            0, 0,
            resultCanvas.width, resultCanvas.height
        );

        onCropApplied(resultCanvas.toDataURL('image/png'));
    }, [canvas, backgroundImage, onCropApplied]);

    // 取消裁剪
    const cancelCrop = useCallback(() => {
        if (!canvas) return;

        if (cropRectRef.current) {
            canvas.remove(cropRectRef.current);
            cropRectRef.current = null;
        }
        overlayRectsRef.current.forEach(rect => canvas.remove(rect));
        overlayRectsRef.current = [];
        setCropArea(null);
        canvas.renderAll();
    }, [canvas]);

    return { cropArea, applyCrop, cancelCrop };
}

// 创建遮罩层
function createOverlays(
    canvas: Canvas,
    cropRect: Rect,
    imgLeft: number,
    imgTop: number,
    imgWidth: number,
    imgHeight: number
): Rect[] {
    const overlayColor = 'rgba(0, 0, 0, 0.5)';

    const overlays = [
        new Rect({ fill: overlayColor, selectable: false, evented: false }), // top
        new Rect({ fill: overlayColor, selectable: false, evented: false }), // bottom
        new Rect({ fill: overlayColor, selectable: false, evented: false }), // left
        new Rect({ fill: overlayColor, selectable: false, evented: false }), // right
    ];

    updateOverlayPositions(overlays, cropRect, imgLeft, imgTop, imgWidth, imgHeight);

    return overlays;
}

// 更新遮罩层位置
function updateOverlayPositions(
    overlays: Rect[],
    cropRect: Rect,
    imgLeft: number,
    imgTop: number,
    imgWidth: number,
    imgHeight: number
) {
    const cropLeft = cropRect.left!;
    const cropTop = cropRect.top!;
    const cropWidth = cropRect.width! * (cropRect.scaleX || 1);
    const cropHeight = cropRect.height! * (cropRect.scaleY || 1);
    const cropRight = cropLeft + cropWidth;
    const cropBottom = cropTop + cropHeight;

    // Top overlay
    overlays[0].set({
        left: imgLeft,
        top: imgTop,
        width: imgWidth,
        height: Math.max(0, cropTop - imgTop),
    });

    // Bottom overlay
    overlays[1].set({
        left: imgLeft,
        top: cropBottom,
        width: imgWidth,
        height: Math.max(0, imgTop + imgHeight - cropBottom),
    });

    // Left overlay
    overlays[2].set({
        left: imgLeft,
        top: cropTop,
        width: Math.max(0, cropLeft - imgLeft),
        height: cropHeight,
    });

    // Right overlay
    overlays[3].set({
        left: cropRight,
        top: cropTop,
        width: Math.max(0, imgLeft + imgWidth - cropRight),
        height: cropHeight,
    });
}
