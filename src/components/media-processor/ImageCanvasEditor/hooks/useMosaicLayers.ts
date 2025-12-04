/**
 * 马赛克图层管理 Hook
 * 方案 F：预生成马赛克图层 + clipPath 蒙版
 */
import { useCallback, useRef, useState } from 'react';
import { Canvas, FabricImage, Circle, Group } from 'fabric';
import { pixelateArea } from '../utils/pixelate';
import { boxBlurArea } from '../utils/blur';

export interface MosaicLayersState {
    pixelImage: FabricImage | null;
    blurImage: FabricImage | null;
}

/**
 * 生成全图马赛克版本
 */
function createPixelatedImage(
    sourceCanvas: HTMLCanvasElement,
    blockSize: number
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(sourceCanvas, 0, 0);

    // 对整个图片进行像素化
    pixelateArea(ctx, 0, 0, canvas.width, canvas.height, blockSize);

    return canvas;
}

/**
 * 生成全图模糊版本
 */
function createBlurredImage(
    sourceCanvas: HTMLCanvasElement,
    blurRadius: number
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(sourceCanvas, 0, 0);

    // 对整个图片进行模糊（分块处理避免性能问题）
    const chunkSize = 500;
    for (let y = 0; y < canvas.height; y += chunkSize) {
        for (let x = 0; x < canvas.width; x += chunkSize) {
            const w = Math.min(chunkSize, canvas.width - x);
            const h = Math.min(chunkSize, canvas.height - y);
            boxBlurArea(ctx, x, y, w, h, blurRadius);
        }
    }

    return canvas;
}

export function useMosaicLayers(canvas: Canvas | null, backgroundImage: FabricImage | null) {
    const [layers, setLayers] = useState<MosaicLayersState>({
        pixelImage: null,
        blurImage: null,
    });

    // 存储蒙版圆形的历史
    const clipCirclesRef = useRef<{ pixel: Circle[]; blur: Circle[] }>({
        pixel: [],
        blur: [],
    });

    const isInitializedRef = useRef(false);

    /**
     * 初始化马赛克图层
     */
    const initMosaicLayers = useCallback(async () => {
        if (!canvas || !backgroundImage || isInitializedRef.current) return;

        const bgElement = backgroundImage.getElement() as HTMLImageElement | HTMLCanvasElement;
        const width = bgElement.width || (bgElement as HTMLImageElement).naturalWidth;
        const height = bgElement.height || (bgElement as HTMLImageElement).naturalHeight;

        if (!width || !height) return;

        // 创建源图的 canvas
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = width;
        sourceCanvas.height = height;
        const sourceCtx = sourceCanvas.getContext('2d')!;
        sourceCtx.drawImage(bgElement, 0, 0);

        // 生成像素化版本
        const pixelCanvas = createPixelatedImage(sourceCanvas, 10);
        const pixelDataUrl = pixelCanvas.toDataURL();

        // 生成模糊版本
        const blurCanvas = createBlurredImage(sourceCanvas, 8);
        const blurDataUrl = blurCanvas.toDataURL();

        // 创建 FabricImage
        const [pixelImg, blurImg] = await Promise.all([
            FabricImage.fromURL(pixelDataUrl),
            FabricImage.fromURL(blurDataUrl),
        ]);

        // 设置与背景图相同的位置和缩放
        const commonProps = {
            left: backgroundImage.left,
            top: backgroundImage.top,
            scaleX: backgroundImage.scaleX,
            scaleY: backgroundImage.scaleY,
            selectable: false,
            evented: false,
            visible: false, // 初始不可见
        };

        pixelImg.set(commonProps);
        blurImg.set(commonProps);

        // 设置空的 clipPath（使用 Group 包含多个圆形）
        const pixelClipGroup = new Group([], {
            absolutePositioned: true,
        });
        const blurClipGroup = new Group([], {
            absolutePositioned: true,
        });

        pixelImg.clipPath = pixelClipGroup;
        blurImg.clipPath = blurClipGroup;

        // 添加到画布（在背景图之上）
        const bgIndex = canvas.getObjects().indexOf(backgroundImage);
        canvas.insertAt(bgIndex + 1, pixelImg);
        canvas.insertAt(bgIndex + 2, blurImg);
        canvas.renderAll();

        setLayers({
            pixelImage: pixelImg,
            blurImage: blurImg,
        });

        isInitializedRef.current = true;

        console.log('Mosaic layers initialized');
    }, [canvas, backgroundImage]);

    /**
     * 添加马赛克圆形到蒙版
     */
    const addMosaicCircle = useCallback((
        x: number,
        y: number,
        radius: number,
        type: 'pixel' | 'blur'
    ) => {
        const targetImage = type === 'pixel' ? layers.pixelImage : layers.blurImage;
        if (!targetImage || !canvas) return;

        // 确保图层可见
        targetImage.set('visible', true);

        // 创建新的圆形
        const circle = new Circle({
            left: x - radius,
            top: y - radius,
            radius: radius,
            absolutePositioned: true,
        });

        // 获取当前的 clipPath
        const currentClip = targetImage.clipPath as Group;
        if (currentClip) {
            // 添加新圆形到组中
            currentClip.add(circle);
            // 需要重新设置 clipPath 以触发更新
            targetImage.clipPath = currentClip;
            targetImage.dirty = true;
        }

        // 保存到历史
        clipCirclesRef.current[type].push(circle);

        canvas.renderAll();
    }, [canvas, layers]);

    /**
     * 获取当前蒙版状态的快照（用于撤销）
     */
    const getClipSnapshot = useCallback(() => {
        return {
            pixel: clipCirclesRef.current.pixel.length,
            blur: clipCirclesRef.current.blur.length,
        };
    }, []);

    /**
     * 恢复到指定的蒙版状态
     */
    const restoreClipSnapshot = useCallback((snapshot: { pixel: number; blur: number }) => {
        if (!canvas) return;

        // 恢复像素层
        if (layers.pixelImage) {
            const pixelClip = layers.pixelImage.clipPath as Group;
            if (pixelClip) {
                // 移除多余的圆形
                const toRemove = clipCirclesRef.current.pixel.slice(snapshot.pixel);
                toRemove.forEach(circle => pixelClip.remove(circle));
                clipCirclesRef.current.pixel = clipCirclesRef.current.pixel.slice(0, snapshot.pixel);

                layers.pixelImage.dirty = true;
                if (snapshot.pixel === 0) {
                    layers.pixelImage.set('visible', false);
                }
            }
        }

        // 恢复模糊层
        if (layers.blurImage) {
            const blurClip = layers.blurImage.clipPath as Group;
            if (blurClip) {
                const toRemove = clipCirclesRef.current.blur.slice(snapshot.blur);
                toRemove.forEach(circle => blurClip.remove(circle));
                clipCirclesRef.current.blur = clipCirclesRef.current.blur.slice(0, snapshot.blur);

                layers.blurImage.dirty = true;
                if (snapshot.blur === 0) {
                    layers.blurImage.set('visible', false);
                }
            }
        }

        canvas.renderAll();
    }, [canvas, layers]);

    /**
     * 重置图层（裁剪后调用）
     */
    const resetLayers = useCallback(() => {
        if (canvas && layers.pixelImage) {
            canvas.remove(layers.pixelImage);
        }
        if (canvas && layers.blurImage) {
            canvas.remove(layers.blurImage);
        }

        setLayers({
            pixelImage: null,
            blurImage: null,
        });

        clipCirclesRef.current = { pixel: [], blur: [] };
        isInitializedRef.current = false;
    }, [canvas, layers]);

    return {
        layers,
        initMosaicLayers,
        addMosaicCircle,
        getClipSnapshot,
        restoreClipSnapshot,
        resetLayers,
    };
}
