/**
 * 图片处理工具函数
 * 封装 wasm-vips 的常用操作
 */

import { VipsInstance, VipsImage } from '@/lib/vips-instance';

export interface ImageMetadata {
    width: number;
    height: number;
    size: number;
    format: string;
    name: string;
}

export interface ImageProcessingOptions {
    // 压缩
    quality: number;           // 1-100

    // 格式
    outputFormat: 'jpeg' | 'png' | 'webp' | 'avif';

    // 尺寸
    scale: number;             // 0.1-2
    targetWidth: number | null;
    targetHeight: number | null;
    keepAspectRatio: boolean;

    // 旋转翻转
    rotation: 0 | 90 | 180 | 270;
    flipHorizontal: boolean;
    flipVertical: boolean;
}

export const defaultImageOptions: ImageProcessingOptions = {
    quality: 80,
    outputFormat: 'jpeg',
    scale: 1,
    targetWidth: null,
    targetHeight: null,
    keepAspectRatio: true,
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
};

/**
 * 从 File 获取图片元数据
 */
export async function getImageMetadata(file: File): Promise<ImageMetadata> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({
                width: img.naturalWidth,
                height: img.naturalHeight,
                size: file.size,
                format: file.type || `image/${file.name.split('.').pop()?.toLowerCase()}`,
                name: file.name,
            });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('无法读取图片信息'));
        };

        img.src = url;
    });
}

/**
 * 获取格式对应的 MIME 类型
 */
export function getMimeType(format: ImageProcessingOptions['outputFormat']): string {
    const mimeTypes: Record<string, string> = {
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        avif: 'image/avif',
    };
    return mimeTypes[format] || 'image/jpeg';
}

/**
 * 获取格式对应的文件后缀
 */
export function getFileExtension(format: ImageProcessingOptions['outputFormat']): string {
    const extensions: Record<string, string> = {
        jpeg: '.jpg',
        png: '.png',
        webp: '.webp',
        avif: '.avif',
    };
    return extensions[format] || '.jpg';
}

/**
 * 生成输出文件名
 */
export function generateOutputFilename(originalName: string, format: ImageProcessingOptions['outputFormat']): string {
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const extension = getFileExtension(format);
    return `${baseName}_edited${extension}`;
}

/**
 * 处理图片
 */
export async function processImage(
    vips: VipsInstance,
    file: File,
    options: ImageProcessingOptions
): Promise<{ blob: Blob; metadata: ImageMetadata }> {
    // 读取文件为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 创建 Vips 图像
    let image: VipsImage = vips.Image.newFromBuffer(arrayBuffer);

    try {
        // 1. 应用旋转
        if (options.rotation === 90) {
            const rotated = image.rot90();
            image.delete();
            image = rotated;
        } else if (options.rotation === 180) {
            const rotated = image.rot180();
            image.delete();
            image = rotated;
        } else if (options.rotation === 270) {
            const rotated = image.rot270();
            image.delete();
            image = rotated;
        }

        // 2. 应用翻转
        if (options.flipHorizontal) {
            const flipped = image.fliphor();
            image.delete();
            image = flipped;
        }

        if (options.flipVertical) {
            const flipped = image.flipver();
            image.delete();
            image = flipped;
        }

        // 3. 应用缩放
        if (options.targetWidth || options.targetHeight) {
            // 指定尺寸模式
            const targetW = options.targetWidth || image.width;
            const targetH = options.targetHeight || image.height;

            // 保持比例，取较小的缩放比
            const scaleW = targetW / image.width;
            const scaleH = targetH / image.height;
            const scale = options.keepAspectRatio ? Math.min(scaleW, scaleH) : scaleW;
            const resized = image.resize(scale);
            image.delete();
            image = resized;
        } else if (options.scale !== 1) {
            // 比例缩放模式
            const resized = image.resize(options.scale);
            image.delete();
            image = resized;
        }

        // 4. 导出为目标格式
        const formatSuffix = `.${options.outputFormat === 'jpeg' ? 'jpg' : options.outputFormat}`;
        const exportOptions: { Q?: number } = {};

        // 对于支持质量参数的格式
        if (['jpeg', 'webp', 'avif'].includes(options.outputFormat)) {
            exportOptions.Q = options.quality;
        }

        const outputBuffer = image.writeToBuffer(formatSuffix, exportOptions);

        // 创建 Blob - 需要将 Uint8Array 转换为普通 ArrayBuffer
        const arrayBuffer = new ArrayBuffer(outputBuffer.length);
        const view = new Uint8Array(arrayBuffer);
        view.set(outputBuffer);
        const blob = new Blob([arrayBuffer], { type: getMimeType(options.outputFormat) });

        // 获取输出元数据
        const metadata: ImageMetadata = {
            width: image.width,
            height: image.height,
            size: blob.size,
            format: getMimeType(options.outputFormat),
            name: generateOutputFilename(file.name, options.outputFormat),
        };

        return { blob, metadata };
    } finally {
        // 清理资源
        image.delete();
    }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 计算压缩比例
 */
export function calculateCompressionRatio(originalSize: number, newSize: number): string {
    const ratio = ((originalSize - newSize) / originalSize) * 100;
    if (ratio > 0) {
        return `-${ratio.toFixed(1)}%`;
    } else if (ratio < 0) {
        return `+${Math.abs(ratio).toFixed(1)}%`;
    }
    return '0%';
}

/**
 * 验证图片文件
 */
export function validateImageFile(file: File): boolean {
    const supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '') || file.type.startsWith('image/');
}
