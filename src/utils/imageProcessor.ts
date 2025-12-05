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
    isAnimated?: boolean;
    frameCount?: number;
}

export interface ImageProcessingOptions {
    // 压缩
    quality: number;           // 1-100

    // 格式
    outputFormat: 'jpeg' | 'png' | 'webp';

    // 尺寸
    scale: number;             // 0.1-2
    targetWidth: number | null;
    targetHeight: number | null;
    keepAspectRatio: boolean;

    // 旋转翻转
    rotation: 0 | 90 | 180 | 270;
    flipHorizontal: boolean;
    flipVertical: boolean;

    // 裁剪
    crop: {
        enabled: boolean;
        left: number;
        top: number;
        width: number;
        height: number;
    };

    // 颜色调整
    brightness: number;        // -100 到 100，0 为原始值
    contrast: number;          // -100 到 100，0 为原始值

    // 滤镜
    blur: number;              // 0-20，0 为不模糊
    sharpen: number;           // 0-10，0 为不锐化

    // 其他
    autoRotate: boolean;       // 根据 EXIF 自动旋转
    stripMetadata: boolean;    // 去除 EXIF 信息
    outputFilename: string;    // 输出文件名，如果为空则自动生成
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
    crop: {
        enabled: false,
        left: 0,
        top: 0,
        width: 0,
        height: 0,
    },
    brightness: 0,
    contrast: 0,
    blur: 0,
    sharpen: 0,
    autoRotate: false,
    stripMetadata: false,
    outputFilename: '', // Add default empty string for output filename
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
    };
    return extensions[format] || '.jpg';
}

/**
 * 生成输出文件名
 */
export function generateOutputFilename(
    originalName: string,
    format: ImageProcessingOptions['outputFormat'],
    customFilename?: string // New optional parameter
): string {
    if (customFilename) {
        // Remove existing extension from custom filename if present
        const baseCustomName = customFilename.replace(/\.[^/.]+$/, '');
        const extension = getFileExtension(format);
        return `${baseCustomName}${extension}`;
    }
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
        // 0. 自动旋转（根据 EXIF）
        if (options.autoRotate) {
            image = applyAutoRotate(image);
        }

        // 1. 应用裁剪（在其他变换之前）
        if (options.crop.enabled) {
            image = applyCrop(image, options.crop);
        }

        // 2. 应用旋转
        image = applyRotation(image, options.rotation);

        // 3. 应用翻转
        image = applyFlip(image, options.flipHorizontal, options.flipVertical);

        // 4. 应用缩放
        image = applyResize(image, options);

        // 5. 应用亮度/对比度调整
        if (options.brightness !== 0 || options.contrast !== 0) {
            image = applyBrightnessContrast(image, options.brightness, options.contrast);
        }

        // 6. 应用模糊
        if (options.blur > 0) {
            image = applyBlur(image, options.blur);
        }

        // 7. 应用锐化
        if (options.sharpen > 0) {
            image = applySharpen(image, options.sharpen);
        }

        // 8. 导出为目标格式
        const { blob } = exportImage(image, options);

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
 * 自动旋转（根据 EXIF）
 */
function applyAutoRotate(image: VipsImage): VipsImage {
    try {
        const rotated = image.autorot();
        image.delete();
        return rotated;
    } catch {
        // 如果没有 EXIF 信息或 autorot 失败，返回原图
        return image;
    }
}

/**
 * 应用裁剪
 */
function applyCrop(
    image: VipsImage,
    crop: ImageProcessingOptions['crop']
): VipsImage {
    // 确保裁剪区域在图片范围内
    const left = Math.max(0, Math.min(crop.left, image.width - 1));
    const top = Math.max(0, Math.min(crop.top, image.height - 1));
    const width = Math.min(crop.width, image.width - left);
    const height = Math.min(crop.height, image.height - top);

    if (width <= 0 || height <= 0) {
        return image;
    }

    const cropped = image.crop(left, top, width, height);
    image.delete();
    return cropped;
}

/**
 * 应用旋转
 */
function applyRotation(image: VipsImage, rotation: ImageProcessingOptions['rotation']): VipsImage {
    if (rotation === 0) return image;

    let rotated: VipsImage;
    switch (rotation) {
        case 90:
            rotated = image.rot90();
            break;
        case 180:
            rotated = image.rot180();
            break;
        case 270:
            rotated = image.rot270();
            break;
        default:
            return image;
    }
    image.delete();
    return rotated;
}

/**
 * 应用翻转
 */
function applyFlip(image: VipsImage, horizontal: boolean, vertical: boolean): VipsImage {
    if (horizontal) {
        const flipped = image.flipHor();
        image.delete();
        image = flipped;
    }
    if (vertical) {
        const flipped = image.flipVer();
        image.delete();
        image = flipped;
    }
    return image;
}

/**
 * 应用缩放
 */
function applyResize(image: VipsImage, options: ImageProcessingOptions): VipsImage {
    if (options.targetWidth || options.targetHeight) {
        // 指定尺寸模式
        const targetW = options.targetWidth || image.width;
        const targetH = options.targetHeight || image.height;

        const scaleW = targetW / image.width;
        const scaleH = targetH / image.height;

        let resized: VipsImage;
        if (options.keepAspectRatio) {
            const scale = Math.min(scaleW, scaleH);
            if (scale !== 1) {
                resized = image.resize(scale);
            } else {
                return image;
            }
        } else {
            // If aspect ratio is not kept, apply both horizontal and vertical scales
            if (scaleW !== 1 || scaleH !== 1) {
                resized = image.resize(scaleW, { vscale: scaleH });
            } else {
                return image;
            }
        }
        image.delete();
        return resized;
    } else if (options.scale !== 1) {
        // 比例缩放模式
        const resized = image.resize(options.scale);
        image.delete();
        return resized;
    }
    return image;
}

/**
 * 应用亮度/对比度调整
 * brightness: -100 到 100
 * contrast: -100 到 100
 */
function applyBrightnessContrast(image: VipsImage, brightness: number, contrast: number): VipsImage {
    // 将 -100~100 的值转换为 linear 函数的参数
    // linear(a, b) 公式: out = a * in + b
    // a 控制对比度，b 控制亮度

    // 对比度：-100~100 映射到 0.5~1.5
    const a = 1 + contrast / 100;

    // 亮度：-100~100 映射到 -128~128
    const b = brightness * 1.28;

    const adjusted = image.linear(a, b);
    image.delete();
    return adjusted;
}

/**
 * 应用高斯模糊
 * blur: 0-20，sigma 值
 */
function applyBlur(image: VipsImage, blur: number): VipsImage {
    // sigma 值越大，模糊越强
    const sigma = Math.min(blur, 20);
    const blurred = image.gaussblur(sigma);
    image.delete();
    return blurred;
}

/**
 * 应用锐化
 * sharpen: 0-10
 */
function applySharpen(image: VipsImage, sharpen: number): VipsImage {
    // sigma 控制锐化程度
    const sigma = 1 + sharpen * 0.3;
    const sharpened = image.sharpen({ sigma });
    image.delete();
    return sharpened;
}

/**
 * 导出图片
 */
function exportImage(image: VipsImage, options: ImageProcessingOptions): { blob: Blob; outputBuffer: Uint8Array } {
    const formatSuffix = `.${options.outputFormat === 'jpeg' ? 'jpg' : options.outputFormat}`;
    const exportOptions: { Q?: number; strip?: boolean } = {};

    // 对于支持质量参数的格式
    if (['jpeg', 'webp'].includes(options.outputFormat)) {
        exportOptions.Q = options.quality;
    }

    // 是否去除元数据
    if (options.stripMetadata) {
        exportOptions.strip = true;
    }

    const outputBuffer = image.writeToBuffer(formatSuffix, exportOptions);

    // 创建 Blob - 需要将 Uint8Array 复制到新的 ArrayBuffer
    const arrayBuffer = new ArrayBuffer(outputBuffer.length);
    const view = new Uint8Array(arrayBuffer);
    view.set(outputBuffer);
    const blob = new Blob([arrayBuffer], { type: getMimeType(options.outputFormat) });

    return { blob, outputBuffer };
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
    const supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '') || file.type.startsWith('image/');
}
