/**
 * 图片处理工具函数
 * 提供图片元数据读取、格式转换等工具函数
 * 
 * 注意：图片处理的核心功能已迁移到 Web Worker
 * @see @/workers/image-processor.worker.ts
 * @see @/hooks/useImageWorker.ts
 */

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
    outputFormat: 'jpeg' | 'png' | 'webp' | 'avif' | 'ico' | 'svg';

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
    keepAspectRatio: false,
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
        avif: 'image/avif',
        ico: 'image/x-icon',
        svg: 'image/svg+xml',
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
        ico: '.ico',
        svg: '.svg',
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
 * 注意：图片处理功能已迁移到 Web Worker 实现
 * 请使用 @/workers/image-processor.worker.ts 和 @/hooks/useImageWorker.ts
 * 这样可以避免阻塞主线程，提供更好的用户体验
 */

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
    const supportedFormats = ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'svg', 'ico', 'avif'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    return supportedFormats.includes(extension || '') || file.type.startsWith('image/');
}

export interface PreprocessResult {
    file: File;
    originalFormat?: 'svg' | 'ico';
    originalFile?: File;
}

/**
 * 预处理特殊格式的图片
 * 将 SVG、ICO 等 Vips 不原生支持的格式转换为 PNG
 * 返回转换后的文件和原始格式信息
 */
export async function preprocessImageFile(file: File): Promise<PreprocessResult> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();

    // 检测格式
    const isSvg = fileType === 'image/svg+xml' || fileName.endsWith('.svg');
    const isIco = fileType === 'image/x-icon' || fileType === 'image/vnd.microsoft.icon' || fileName.endsWith('.ico');

    // 如果不需要预处理，直接返回原文件
    if (!isSvg && !isIco) {
        return { file };
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            try {
                // 创建 Canvas
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width;
                canvas.height = img.naturalHeight || img.height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    reject(new Error('无法创建 Canvas 上下文'));
                    return;
                }

                // 绘制图片到 Canvas
                ctx.drawImage(img, 0, 0);

                // 转换为 PNG Blob
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);

                    if (!blob) {
                        reject(new Error('无法转换图片格式'));
                        return;
                    }

                    // 创建新的 File 对象，保留原文件名但改为 .png
                    const baseName = file.name.replace(/\.[^/.]+$/, '');
                    const newFile = new File([blob], `${baseName}.png`, {
                        type: 'image/png',
                        lastModified: Date.now(),
                    });

                    resolve({
                        file: newFile,
                        originalFormat: isSvg ? 'svg' : 'ico',
                        originalFile: file,
                    });
                }, 'image/png');
            } catch (error) {
                URL.revokeObjectURL(url);
                reject(error);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('无法加载图片进行预处理'));
        };

        img.src = url;
    });
}

/**
 * 根据目标尺寸渲染 SVG
 * 用于在处理前将 SVG 按最终尺寸转换为高分辨率位图
 */
export async function renderSvgAtTargetSize(
    svgFile: File,
    targetWidth: number,
    targetHeight: number
): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(svgFile);

        img.onload = () => {
            try {
                // 创建 Canvas，使用目标尺寸
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    URL.revokeObjectURL(url);
                    reject(new Error('无法创建 Canvas 上下文'));
                    return;
                }

                // 绘制 SVG 到目标尺寸
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

                // 转换为 PNG Blob
                canvas.toBlob((blob) => {
                    URL.revokeObjectURL(url);

                    if (!blob) {
                        reject(new Error('无法转换 SVG'));
                        return;
                    }

                    const baseName = svgFile.name.replace(/\.[^/.]+$/, '');
                    const newFile = new File([blob], `${baseName}.png`, {
                        type: 'image/png',
                        lastModified: Date.now(),
                    });

                    resolve(newFile);
                }, 'image/png');
            } catch (error) {
                URL.revokeObjectURL(url);
                reject(error);
            }
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('无法加载 SVG'));
        };

        img.src = url;
    });
}
