/**
 * 图片处理 Web Worker
 * 在后台线程中处理图片，避免阻塞主线程
 */

import { packToIco } from '@/utils/ico-packer';
import { packToSvg } from '@/utils/svg-packer';

// Worker 消息类型
export interface WorkerRequest {
    type: 'process' | 'getExif';
    id: string;
    buffer: ArrayBuffer;
    fileName: string;
    options: ImageProcessingOptions;
}

export interface WorkerProgressResponse {
    type: 'progress';
    id: string;
    percent: number;
    message: string;
}

export interface WorkerSuccessResponse {
    type: 'success';
    id: string;
    buffer: ArrayBuffer;
    metadata: ImageMetadata;
}

export interface WorkerExifResponse {
    type: 'exif';
    id: string;
    exifData: ExifMetadata;
}

export interface WorkerErrorResponse {
    type: 'error';
    id: string;
    error: string;
}

export type WorkerResponse = WorkerProgressResponse | WorkerSuccessResponse | WorkerExifResponse | WorkerErrorResponse;

// EXIF 元数据接口
export interface ExifMetadata {
    // 设备信息
    make?: string;           // 相机品牌
    model?: string;          // 相机型号
    software?: string;       // 编辑软件
    lensModel?: string;      // 镜头型号

    // 拍摄时间
    dateTime?: string;       // 拍摄时间
    dateTimeOriginal?: string;

    // 拍摄参数
    exposureTime?: string;   // 快门速度
    fNumber?: number;        // 光圈
    iso?: number;            // ISO
    focalLength?: number;    // 焦距
    focalLength35mm?: number;
    whiteBalance?: number;   // 白平衡 (0=自动, 1=手动)
    flash?: number;          // 闪光灯状态
    exposureBias?: number;   // 曝光补偿
    meteringMode?: number;   // 测光模式

    // 图像信息
    colorSpace?: string;     // 色彩空间
    xResolution?: number;    // X 分辨率 (DPI)
    yResolution?: number;    // Y 分辨率 (DPI)
    orientation?: number;    // 方向 (1-8)

    // GPS 信息 (隐私敏感)
    gpsLatitude?: number;    // 纬度
    gpsLongitude?: number;   // 经度
    gpsAltitude?: number;    // 海拔
    gpsLatitudeRef?: string; // N/S
    gpsLongitudeRef?: string;// E/W

    // 其他
    artist?: string;         // 作者
    copyright?: string;      // 版权
}

// 类型定义（与 imageProcessor.ts 保持一致）
interface ImageProcessingOptions {
    quality: number;
    outputFormat: 'jpeg' | 'png' | 'webp' | 'ico' | 'svg';
    scale: number;
    targetWidth: number | null;
    targetHeight: number | null;
    keepAspectRatio: boolean;
    rotation: 0 | 90 | 180 | 270;
    flipHorizontal: boolean;
    flipVertical: boolean;
    crop: {
        enabled: boolean;
        left: number;
        top: number;
        width: number;
        height: number;
    };
    brightness: number;
    contrast: number;
    blur: number;
    sharpen: number;
    autoRotate: boolean;
    stripMetadata: boolean;
}

interface ImageMetadata {
    width: number;
    height: number;
    size: number;
    format: string;
    name: string;
    isAnimated?: boolean;
    frameCount?: number;
}

// VipsImage 接口
interface VipsImage {
    width: number;
    height: number;
    bands: number; // 通道数
    getInt(name: string): number;
    getDouble(name: string): number;
    getString(name: string): string;
    getArrayInt(name: string): number[];
    getFields(): string[];
    resize(scale: number, options?: { vscale?: number; kernel?: string }): VipsImage;
    rot90(): VipsImage;
    rot180(): VipsImage;
    rot270(): VipsImage;
    autorot(): VipsImage;
    flipHor(): VipsImage;
    flipVer(): VipsImage;
    crop(left: number, top: number, width: number, height: number): VipsImage;
    extractArea(left: number, top: number, width: number, height: number): VipsImage;
    linear(a: number | number[], b: number | number[]): VipsImage;
    gaussblur(sigma: number): VipsImage;
    sharpen(options?: { sigma?: number }): VipsImage;
    join(other: VipsImage, direction: string, options?: { expand?: boolean }): VipsImage;
    writeToBuffer(suffix: string, options?: Record<string, unknown>): Uint8Array;
    delete(): void;
    // New methods for ICO support
    newFromImage(value: number | number[]): VipsImage;
    bandjoin(other: VipsImage | VipsImage[]): VipsImage;
    embed(left: number, top: number, width: number, height: number, options?: { extend?: string; background?: number[] }): VipsImage;
}

interface VipsInstance {
    Image: {
        newFromBuffer(buffer: ArrayBuffer, options?: string): VipsImage;
    };
}

// Vips 实例（懒加载）
let vipsInstance: VipsInstance | null = null;
let vipsLoading: Promise<VipsInstance> | null = null;

/**
 * 获取基础 URL
 */
function getBaseUrl(): string {
    // Worker 中使用 self.location.origin
    return self.location.origin;
}

/**
 * 加载 wasm-vips
 */
async function loadVips(): Promise<VipsInstance> {
    if (vipsInstance) {
        return vipsInstance;
    }

    if (vipsLoading) {
        return vipsLoading;
    }

    const baseUrl = getBaseUrl();

    vipsLoading = (async () => {
        const Vips = (await import(/* webpackIgnore: true */ `${baseUrl}/wasm-libs/vips/vips-es6.js`)).default;

        const vips = await Vips({
            dynamicLibraries: [],
            locateFile: (fileName: string) => `${baseUrl}/wasm-libs/vips/${fileName}`,
        });

        vipsInstance = vips as VipsInstance;
        return vipsInstance;
    })();

    return vipsLoading;
}

/**
 * 发送进度消息
 */
function sendProgress(id: string, percent: number, message: string) {
    self.postMessage({
        type: 'progress',
        id,
        percent,
        message,
    } as WorkerProgressResponse);
}

/**
 * 清理 EXIF 字符串值
 * vips 返回的 EXIF 字符串格式: "值 (值, 类型, 组件数, 字节数)"
 * 例如: "DJI (DJI, ASCII, 4 components, 4 bytes)" → "DJI"
 * 多值: "DJI (DJI, ASCII, 4 bytes) FC8582 (FC8582, ASCII, 7 bytes)" → "DJI FC8582"
 */
function cleanExifString(value: string): string {
    // 移除所有括号及其内容: (xxx, xxx, xxx)
    const cleaned = value.replace(/\s*\([^)]*\)/g, '').trim();
    return cleaned || value; // 如果清理后为空，返回原值
}

/**
 * 安全获取图片字符串属性
 */
function safeGetString(image: VipsImage, name: string): string | undefined {
    try {
        const value = image.getString(name);
        if (!value) return undefined;
        return cleanExifString(value);
    } catch {
        return undefined;
    }
}

/**
 * 安全获取图片整数属性
 */
function safeGetInt(image: VipsImage, name: string): number | undefined {
    try {
        const value = image.getInt(name);
        return value || undefined;
    } catch {
        return undefined;
    }
}

/**
 * 安全获取图片浮点数属性
 */
function safeGetDouble(image: VipsImage, name: string): number | undefined {
    try {
        const value = image.getDouble(name);
        return value || undefined;
    } catch {
        return undefined;
    }
}

/**
 * 从图片读取 EXIF 元数据
 */
function extractExifMetadata(image: VipsImage): ExifMetadata {
    const exif: ExifMetadata = {};

    // 设备信息
    exif.make = safeGetString(image, 'exif-ifd0-Make');
    exif.model = safeGetString(image, 'exif-ifd0-Model');
    exif.software = safeGetString(image, 'exif-ifd0-Software');
    exif.lensModel = safeGetString(image, 'exif-ifd2-LensModel');

    // 拍摄时间
    exif.dateTime = safeGetString(image, 'exif-ifd0-DateTime');
    exif.dateTimeOriginal = safeGetString(image, 'exif-ifd2-DateTimeOriginal');

    // 拍摄参数
    exif.exposureTime = safeGetString(image, 'exif-ifd2-ExposureTime');
    exif.fNumber = safeGetDouble(image, 'exif-ifd2-FNumber');
    exif.iso = safeGetInt(image, 'exif-ifd2-ISOSpeedRatings');
    exif.focalLength = safeGetDouble(image, 'exif-ifd2-FocalLength');
    exif.focalLength35mm = safeGetInt(image, 'exif-ifd2-FocalLengthIn35mmFilm');
    exif.whiteBalance = safeGetInt(image, 'exif-ifd2-WhiteBalance');
    exif.flash = safeGetInt(image, 'exif-ifd2-Flash');
    exif.exposureBias = safeGetDouble(image, 'exif-ifd2-ExposureBiasValue');
    exif.meteringMode = safeGetInt(image, 'exif-ifd2-MeteringMode');

    // 图像信息
    exif.orientation = safeGetInt(image, 'exif-ifd0-Orientation');
    exif.xResolution = safeGetDouble(image, 'exif-ifd0-XResolution');
    exif.yResolution = safeGetDouble(image, 'exif-ifd0-YResolution');

    // 色彩空间
    const colorSpace = safeGetInt(image, 'exif-ifd2-ColorSpace');
    if (colorSpace === 1) {
        exif.colorSpace = 'sRGB';
    } else if (colorSpace === 65535) {
        exif.colorSpace = 'Uncalibrated';
    }

    // GPS 信息
    exif.gpsLatitude = safeGetDouble(image, 'exif-ifd3-GPSLatitude');
    exif.gpsLongitude = safeGetDouble(image, 'exif-ifd3-GPSLongitude');
    exif.gpsAltitude = safeGetDouble(image, 'exif-ifd3-GPSAltitude');
    exif.gpsLatitudeRef = safeGetString(image, 'exif-ifd3-GPSLatitudeRef');
    exif.gpsLongitudeRef = safeGetString(image, 'exif-ifd3-GPSLongitudeRef');

    // 其他
    exif.artist = safeGetString(image, 'exif-ifd0-Artist');
    exif.copyright = safeGetString(image, 'exif-ifd0-Copyright');

    return exif;
}

/**
 * 处理 EXIF 读取请求
 */
async function handleGetExifRequest(request: WorkerRequest) {
    const { id, buffer } = request;

    try {
        const vips = await loadVips();
        const image = vips.Image.newFromBuffer(buffer);

        try {
            const exifData = extractExifMetadata(image);

            self.postMessage({
                type: 'exif',
                id,
                exifData,
            } as WorkerExifResponse);
        } finally {
            image.delete();
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            id,
            error: error instanceof Error ? error.message : '读取 EXIF 失败',
        } as WorkerErrorResponse);
    }
}

/**
 * 处理静态图片
 */
async function processStaticImage(
    vips: VipsInstance,
    buffer: ArrayBuffer,
    options: ImageProcessingOptions,
    requestId: string
): Promise<{ outputBuffer: Uint8Array; width: number; height: number }> {
    sendProgress(requestId, 10, '读取图片...');

    let image: VipsImage = vips.Image.newFromBuffer(buffer);

    try {
        // 自动旋转（根据 EXIF）
        if (options.autoRotate) {
            sendProgress(requestId, 15, '自动旋转...');
            try {
                const rotated = image.autorot();
                image.delete();
                image = rotated;
            } catch {
                // 忽略错误
            }
        }

        // 裁剪
        if (options.crop.enabled) {
            sendProgress(requestId, 20, '裁剪...');
            const left = Math.max(0, Math.min(options.crop.left, image.width - 1));
            const top = Math.max(0, Math.min(options.crop.top, image.height - 1));
            const width = Math.min(options.crop.width, image.width - left);
            const height = Math.min(options.crop.height, image.height - top);

            if (width > 0 && height > 0) {
                const cropped = image.crop(left, top, width, height);
                image.delete();
                image = cropped;
            }
        }

        // 旋转
        if (options.rotation !== 0) {
            sendProgress(requestId, 30, '旋转...');
            let rotatedImage: VipsImage;
            switch (options.rotation) {
                case 90:
                    rotatedImage = image.rot90();
                    break;
                case 180:
                    rotatedImage = image.rot180();
                    break;
                case 270:
                    rotatedImage = image.rot270();
                    break;
                default:
                    rotatedImage = image;
            }
            if (rotatedImage !== image) {
                image.delete();
                image = rotatedImage;
            }
        }

        // 翻转
        if (options.flipHorizontal || options.flipVertical) {
            sendProgress(requestId, 40, '翻转...');
            if (options.flipHorizontal) {
                const flipped = image.flipHor();
                image.delete();
                image = flipped;
            }
            if (options.flipVertical) {
                const flipped = image.flipVer();
                image.delete();
                image = flipped;
            }
        }

        // 缩放
        if (options.scale !== 1 || options.targetWidth || options.targetHeight) {
            sendProgress(requestId, 50, '缩放...');

            if (options.targetWidth || options.targetHeight) {
                // 指定尺寸模式
                const targetW = options.targetWidth || image.width;
                const targetH = options.targetHeight || image.height;
                const scaleW = targetW / image.width;
                const scaleH = targetH / image.height;

                if (options.keepAspectRatio) {
                    // 保持宽高比：等比缩放（适应模式）
                    const scale = Math.min(scaleW, scaleH);
                    if (scale !== 1) {
                        const resized = image.resize(scale);
                        image.delete();
                        image = resized;
                    }
                } else {
                    // 不保持宽高比：拉伸到目标尺寸
                    if (scaleW !== 1 || scaleH !== 1) {
                        const resized = image.resize(scaleW, { vscale: scaleH });
                        image.delete();
                        image = resized;
                    }
                }
            } else if (options.scale !== 1) {
                // 比例缩放模式
                const resized = image.resize(options.scale);
                image.delete();
                image = resized;
            }
        }        // 亮度/对比度
        if (options.brightness !== 0 || options.contrast !== 0) {
            sendProgress(requestId, 60, '调整亮度对比度...');
            const a = 1 + options.contrast / 100;
            const b = options.brightness * 1.28;
            const adjusted = image.linear(a, b);
            image.delete();
            image = adjusted;
        }

        // 模糊
        if (options.blur > 0) {
            sendProgress(requestId, 70, '模糊...');
            const blurred = image.gaussblur(Math.min(options.blur, 20));
            image.delete();
            image = blurred;
        }

        // 锐化
        if (options.sharpen > 0) {
            sendProgress(requestId, 75, '锐化...');
            const sharpened = image.sharpen({ sigma: 1 + options.sharpen * 0.3 });
            image.delete();
            image = sharpened;
        }

        sendProgress(requestId, 85, '导出...');

        // 导出
        let outputBuffer: Uint8Array;

        // 特殊格式处理 (ico, svg) - 先导出为 PNG
        if (options.outputFormat === 'ico' || options.outputFormat === 'svg') {
            let exportImage = image;
            let needDelete = false;

            // ICO 优化：限制最大尺寸为 256 (ICO 标准限制)
            if (options.outputFormat === 'ico') {
                const MAX_ICO_SIZE = 256;
                
                // 1. 确保有 Alpha 通道 (如果原图是 JPG 等)
                if (exportImage.bands === 3) {
                     // 添加不透明 Alpha 通道 (255)
                     const alpha = exportImage.newFromImage(255);
                     const withAlpha = exportImage.bandjoin(alpha);
                     alpha.delete(); // 释放 alpha 图像
                     if (needDelete) exportImage.delete();
                     exportImage = withAlpha;
                     needDelete = true;
                }

                // 2. 限制最大尺寸 (Downscale only)
                // 如果用户没有指定尺寸，或者指定尺寸超过 256，则缩小到 256
                // 如果用户指定了较小尺寸（如 32x32），则保持该尺寸
                if (exportImage.width > MAX_ICO_SIZE || exportImage.height > MAX_ICO_SIZE) {
                    const scale = Math.min(MAX_ICO_SIZE / exportImage.width, MAX_ICO_SIZE / exportImage.height);
                    const resized = exportImage.resize(scale, { kernel: 'lanczos3' });
                    if (needDelete) exportImage.delete();
                    exportImage = resized;
                    needDelete = true;
                }
            }

            const pngBuffer = exportImage.writeToBuffer('.png', { strip: options.stripMetadata });
            
            // 保存尺寸，因为后面要删除 exportImage
            const finalWidth = exportImage.width;
            const finalHeight = exportImage.height;

            if (needDelete && exportImage !== image) {
                exportImage.delete();
            }

            if (options.outputFormat === 'ico') {
                // 使用保存的尺寸
                outputBuffer = packToIco(pngBuffer, finalWidth, finalHeight);
            } else {
                outputBuffer = packToSvg(pngBuffer, image.width, image.height);
            }
        } else {
            const formatSuffix = `.${options.outputFormat === 'jpeg' ? 'jpg' : options.outputFormat}`;
            const exportOptions: Record<string, unknown> = {};

            if (['jpeg', 'webp'].includes(options.outputFormat)) {
                exportOptions.Q = options.quality;
            }

            if (options.stripMetadata) {
                exportOptions.strip = true;
            }

            outputBuffer = image.writeToBuffer(formatSuffix, exportOptions);
        }

        return {
            outputBuffer,
            width: image.width,
            height: image.height,
        };
    } finally {
        image.delete();
    }
}

/**
 * 获取 MIME 类型
 */
function getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        ico: 'image/x-icon',
        svg: 'image/svg+xml',
    };
    return mimeTypes[format] || 'image/jpeg';
}

/**
 * 获取文件扩展名
 */
function getFileExtension(format: string): string {
    const extensions: Record<string, string> = {
        jpeg: '.jpg',
        png: '.png',
        webp: '.webp',
        ico: '.ico',
        svg: '.svg',
    };
    return extensions[format] || '.jpg';
}

/**
 * 处理图片主函数
 */
async function handleProcessRequest(request: WorkerRequest) {
    const { id, buffer, fileName, options } = request;

    try {
        sendProgress(id, 0, '加载处理引擎...');

        const vips = await loadVips();

        sendProgress(id, 5, '分析图片...');

        // 处理静态图片
        const result = await processStaticImage(vips, buffer, options, id);

        sendProgress(id, 95, '完成处理...');

        // 生成输出文件名
        const baseName = fileName.replace(/\.[^/.]+$/, '');
        const extension = getFileExtension(options.outputFormat);
        const outputName = `${baseName}_edited${extension}`;

        // 创建 ArrayBuffer 副本用于传输
        const transferBuffer = result.outputBuffer.buffer.slice(
            result.outputBuffer.byteOffset,
            result.outputBuffer.byteOffset + result.outputBuffer.byteLength
        );

        const metadata: ImageMetadata = {
            width: result.width,
            height: result.height,
            size: result.outputBuffer.byteLength,
            format: getMimeType(options.outputFormat),
            name: outputName,
            isAnimated: false,
            frameCount: 1,
        };

        self.postMessage(
            {
                type: 'success',
                id,
                buffer: transferBuffer,
                metadata,
            } as WorkerSuccessResponse,
            { transfer: [transferBuffer] }
        );
    } catch (error) {
        let errorMessage = '处理失败';

        if (error instanceof Error) {
            // 提供更友好的错误信息
            if (error.message.includes('Array buffer allocation failed') ||
                error.message.includes('out of memory') ||
                error.message.includes('OOM')) {
                errorMessage = '图片太大，内存不足。请尝试使用较小的图片或减少缩放比例。';
            } else if (error.message.includes('VipsForeignLoad')) {
                errorMessage = '无法读取图片，格式可能不支持或文件已损坏。';
            } else if (error.message.includes('VipsForeignSave')) {
                errorMessage = '导出图片失败，请尝试其他输出格式。';
            } else {
                errorMessage = error.message;
            }
        }

        self.postMessage({
            type: 'error',
            id,
            error: errorMessage,
        } as WorkerErrorResponse);
    }
}

// 监听消息
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const request = event.data;

    if (request.type === 'process') {
        handleProcessRequest(request);
    } else if (request.type === 'getExif') {
        handleGetExifRequest(request);
    }
};

// 导出空对象使 TypeScript 将此文件视为模块
export { };
