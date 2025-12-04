/**
 * 像素化算法
 */

/**
 * 对指定区域进行像素化处理
 */
export function pixelateArea(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    blockSize: number
): void {
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;

    for (let py = 0; py < height; py += blockSize) {
        for (let px = 0; px < width; px += blockSize) {
            // 计算当前块的平均颜色
            let r = 0, g = 0, b = 0, a = 0;
            let count = 0;

            const blockW = Math.min(blockSize, width - px);
            const blockH = Math.min(blockSize, height - py);

            for (let by = 0; by < blockH; by++) {
                for (let bx = 0; bx < blockW; bx++) {
                    const i = ((py + by) * width + (px + bx)) * 4;
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    a += data[i + 3];
                    count++;
                }
            }

            r = Math.round(r / count);
            g = Math.round(g / count);
            b = Math.round(b / count);
            a = Math.round(a / count);

            // 用平均颜色填充整个块
            for (let by = 0; by < blockH; by++) {
                for (let bx = 0; bx < blockW; bx++) {
                    const i = ((py + by) * width + (px + bx)) * 4;
                    data[i] = r;
                    data[i + 1] = g;
                    data[i + 2] = b;
                    data[i + 3] = a;
                }
            }
        }
    }

    ctx.putImageData(imageData, x, y);
}

/**
 * 沿路径进行像素化处理
 */
export function pixelateAlongPath(
    sourceCanvas: HTMLCanvasElement,
    points: Array<{ x: number; y: number }>,
    brushSize: number,
    blockSize: number
): HTMLCanvasElement {
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = sourceCanvas.width;
    resultCanvas.height = sourceCanvas.height;

    const ctx = resultCanvas.getContext('2d')!;
    ctx.drawImage(sourceCanvas, 0, 0);

    // 沿路径的每个点进行像素化
    for (const point of points) {
        const x = Math.max(0, Math.round(point.x - brushSize / 2));
        const y = Math.max(0, Math.round(point.y - brushSize / 2));
        const width = Math.min(brushSize, resultCanvas.width - x);
        const height = Math.min(brushSize, resultCanvas.height - y);

        if (width > 0 && height > 0) {
            pixelateArea(ctx, x, y, width, height, blockSize);
        }
    }

    return resultCanvas;
}
