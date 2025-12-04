/**
 * 模糊算法
 */

/**
 * 简单的盒式模糊（Box Blur）
 */
export function boxBlurArea(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
): void {
    const imageData = ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    const tempData = new Uint8ClampedArray(data);

    const diameter = radius * 2 + 1;

    // 水平模糊
    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            let r = 0, g = 0, b = 0, a = 0;
            let count = 0;

            for (let dx = -radius; dx <= radius; dx++) {
                const nx = px + dx;
                if (nx >= 0 && nx < width) {
                    const i = (py * width + nx) * 4;
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                    a += data[i + 3];
                    count++;
                }
            }

            const i = (py * width + px) * 4;
            tempData[i] = r / count;
            tempData[i + 1] = g / count;
            tempData[i + 2] = b / count;
            tempData[i + 3] = a / count;
        }
    }

    // 垂直模糊
    for (let py = 0; py < height; py++) {
        for (let px = 0; px < width; px++) {
            let r = 0, g = 0, b = 0, a = 0;
            let count = 0;

            for (let dy = -radius; dy <= radius; dy++) {
                const ny = py + dy;
                if (ny >= 0 && ny < height) {
                    const i = (ny * width + px) * 4;
                    r += tempData[i];
                    g += tempData[i + 1];
                    b += tempData[i + 2];
                    a += tempData[i + 3];
                    count++;
                }
            }

            const i = (py * width + px) * 4;
            data[i] = r / count;
            data[i + 1] = g / count;
            data[i + 2] = b / count;
            data[i + 3] = a / count;
        }
    }

    ctx.putImageData(imageData, x, y);
}

/**
 * 沿路径进行模糊处理
 */
export function blurAlongPath(
    sourceCanvas: HTMLCanvasElement,
    points: Array<{ x: number; y: number }>,
    brushSize: number,
    blurRadius: number
): HTMLCanvasElement {
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = sourceCanvas.width;
    resultCanvas.height = sourceCanvas.height;

    const ctx = resultCanvas.getContext('2d')!;
    ctx.drawImage(sourceCanvas, 0, 0);

    // 沿路径的每个点进行模糊
    for (const point of points) {
        const x = Math.max(0, Math.round(point.x - brushSize / 2));
        const y = Math.max(0, Math.round(point.y - brushSize / 2));
        const width = Math.min(brushSize, resultCanvas.width - x);
        const height = Math.min(brushSize, resultCanvas.height - y);

        if (width > 0 && height > 0) {
            boxBlurArea(ctx, x, y, width, height, blurRadius);
        }
    }

    return resultCanvas;
}
