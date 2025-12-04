import { create } from 'zustand';
import {
    ImageMetadata,
    ImageProcessingOptions,
    defaultImageOptions,
    getImageMetadata,
    generateOutputFilename,
    validateImageFile,
} from '@/utils/imageProcessor';

// 最大文件大小 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

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

// Worker 消息类型
interface WorkerRequest {
    type: 'process' | 'getExif';
    id: string;
    buffer: ArrayBuffer;
    fileName: string;
    options: ImageProcessingOptions;
}

interface WorkerProgressResponse {
    type: 'progress';
    id: string;
    percent: number;
    message: string;
}

interface WorkerSuccessResponse {
    type: 'success';
    id: string;
    buffer: ArrayBuffer;
    metadata: ImageMetadata;
}

interface WorkerExifResponse {
    type: 'exif';
    id: string;
    exifData: ExifMetadata;
}

interface WorkerErrorResponse {
    type: 'error';
    id: string;
    error: string;
}

type WorkerResponse = WorkerProgressResponse | WorkerSuccessResponse | WorkerExifResponse | WorkerErrorResponse;

// Worker 单例
let workerInstance: Worker | null = null;
let currentRequestId: string = '';

function getWorker(): Worker {
    if (!workerInstance) {
        workerInstance = new Worker(
            new URL('@/workers/image-processor.worker.ts', import.meta.url)
        );
    }
    return workerInstance;
}

interface ProcessingProgress {
    percent: number;
    message: string;
}

interface ImageProcessorStore {
    // 输入状态
    inputFile: File | null;
    inputUrl: string | null;
    inputMetadata: ImageMetadata | null;
    exifMetadata: ExifMetadata | null;

    // 处理选项
    options: ImageProcessingOptions;

    // 自动处理
    autoProcess: boolean;

    // 输出状态
    outputBlob: Blob | null;
    outputUrl: string | null;
    outputMetadata: ImageMetadata | null;

    // 处理状态
    isProcessing: boolean;
    processError: string | null;
    progress: ProcessingProgress | null;

    // Actions
    setInputFile: (file: File) => Promise<void>;
    updateOptions: (options: Partial<ImageProcessingOptions>) => void;
    resetOptions: () => void;
    setAutoProcess: (auto: boolean) => void;
    processImage: () => Promise<void>;
    loadExifMetadata: () => Promise<void>;
    downloadOutput: () => void;
    reset: () => void;
    validateFile: (file: File) => { valid: boolean; error?: string };
    cancelProcessing: () => void;
}

export const useImageProcessorStore = create<ImageProcessorStore>()((set, get) => ({
    // 初始状态
    inputFile: null,
    inputUrl: null,
    inputMetadata: null,
    exifMetadata: null,

    options: { ...defaultImageOptions },

    autoProcess: true, // 默认开启自动处理

    outputBlob: null,
    outputUrl: null,
    outputMetadata: null,

    isProcessing: false,
    processError: null,
    progress: null,

    /**
     * 设置输入文件
     */
    setInputFile: async (file: File) => {
        // 清理旧的 URL
        const { inputUrl, outputUrl } = get();
        if (inputUrl) URL.revokeObjectURL(inputUrl);
        if (outputUrl) URL.revokeObjectURL(outputUrl);

        // 创建预览 URL
        const url = URL.createObjectURL(file);

        // 获取元数据
        try {
            const metadata = await getImageMetadata(file);

            // 根据原图格式设置默认输出格式
            let defaultFormat: ImageProcessingOptions['outputFormat'] = 'jpeg';
            if (metadata.format.includes('png')) {
                defaultFormat = 'png';
            } else if (metadata.format.includes('webp')) {
                defaultFormat = 'webp';
            }

            set({
                inputFile: file,
                inputUrl: url,
                inputMetadata: metadata,
                exifMetadata: null,
                outputBlob: null,
                outputUrl: null,
                outputMetadata: null,
                processError: null,
                progress: null,
                options: {
                    ...defaultImageOptions,
                    outputFormat: defaultFormat,
                },
            });

            // 上传后立即进行一次处理和读取 EXIF
            get().processImage();
            get().loadExifMetadata();
        } catch (error) {
            set({
                processError: error instanceof Error ? error.message : '读取图片失败',
            });
        }
    },

    /**
     * 更新处理选项
     */
    updateOptions: (newOptions: Partial<ImageProcessingOptions>) => {
        set((state) => ({
            options: { ...state.options, ...newOptions },
        }));
    },

    /**
     * 重置选项到默认值
     */
    resetOptions: () => {
        const { inputMetadata } = get();

        // 根据原图格式设置默认输出格式
        let defaultFormat: ImageProcessingOptions['outputFormat'] = 'jpeg';
        if (inputMetadata?.format.includes('png')) {
            defaultFormat = 'png';
        } else if (inputMetadata?.format.includes('webp')) {
            defaultFormat = 'webp';
        }

        set({
            options: {
                ...defaultImageOptions,
                outputFormat: defaultFormat,
            },
        });
    },

    /**
     * 设置自动处理
     */
    setAutoProcess: (auto: boolean) => {
        set({ autoProcess: auto });
    },

    /**
     * 处理图片（使用 Web Worker）
     */
    processImage: async () => {
        const { inputFile, options, outputUrl } = get();

        if (!inputFile) {
            return;
        }

        // 清理旧的输出 URL
        if (outputUrl) {
            URL.revokeObjectURL(outputUrl);
        }

        set({ isProcessing: true, processError: null, progress: { percent: 0, message: '准备中...' } });

        try {
            const worker = getWorker();

            // 生成请求 ID
            const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            currentRequestId = requestId;

            // 读取文件
            const buffer = await inputFile.arrayBuffer();

            // 创建 Promise 等待 Worker 响应
            const result = await new Promise<{ blob: Blob; metadata: ImageMetadata }>((resolve, reject) => {
                const handleMessage = (event: MessageEvent<WorkerResponse>) => {
                    const response = event.data;

                    // 检查请求 ID
                    if (response.id !== requestId) {
                        return;
                    }

                    switch (response.type) {
                        case 'progress':
                            set({
                                progress: {
                                    percent: response.percent,
                                    message: response.message,
                                },
                            });
                            break;

                        case 'success':
                            worker.removeEventListener('message', handleMessage);
                            const blob = new Blob([response.buffer], {
                                type: response.metadata.format,
                            });
                            resolve({ blob, metadata: response.metadata });
                            break;

                        case 'error':
                            worker.removeEventListener('message', handleMessage);
                            reject(new Error(response.error));
                            break;
                    }
                };

                worker.addEventListener('message', handleMessage);

                // 发送请求
                const request: WorkerRequest = {
                    type: 'process',
                    id: requestId,
                    buffer,
                    fileName: inputFile.name,
                    options,
                };

                worker.postMessage(request, { transfer: [buffer] });
            });

            const url = URL.createObjectURL(result.blob);

            set({
                outputBlob: result.blob,
                outputUrl: url,
                outputMetadata: result.metadata,
                isProcessing: false,
                progress: { percent: 100, message: '完成' },
            });
        } catch (error) {
            if ((error as Error).message !== '已取消') {
                set({
                    processError: error instanceof Error ? error.message : '处理失败',
                    isProcessing: false,
                    progress: null,
                });
            }
        }
    },

    /**
     * 取消处理
     */
    cancelProcessing: () => {
        currentRequestId = ''; // 使当前请求的响应被忽略
        set({
            isProcessing: false,
            progress: null,
        });
    },

    /**
     * 读取 EXIF 元数据
     */
    loadExifMetadata: async () => {
        const { inputFile } = get();

        if (!inputFile) {
            return;
        }

        try {
            const worker = getWorker();
            const buffer = await inputFile.arrayBuffer();
            const requestId = `exif-${Date.now()}`;

            const result = await new Promise<ExifMetadata>((resolve, reject) => {
                const handleMessage = (event: MessageEvent<WorkerResponse>) => {
                    const response = event.data;

                    if (response.id !== requestId) return;

                    if (response.type === 'exif') {
                        worker.removeEventListener('message', handleMessage);
                        resolve(response.exifData);
                    } else if (response.type === 'error') {
                        worker.removeEventListener('message', handleMessage);
                        reject(new Error(response.error));
                    }
                };

                worker.addEventListener('message', handleMessage);

                const request: WorkerRequest = {
                    type: 'getExif',
                    id: requestId,
                    buffer,
                    fileName: inputFile.name,
                    options: get().options,
                };

                worker.postMessage(request, { transfer: [buffer] });
            });

            set({ exifMetadata: result });
        } catch (error) {
            // EXIF 读取失败不影响主流程，静默处理
            console.warn('读取 EXIF 失败:', error);
            set({ exifMetadata: null });
        }
    },

    /**
     * 下载输出文件
     */
    downloadOutput: () => {
        const { outputBlob, inputFile, options } = get();

        if (!outputBlob || !inputFile) {
            return;
        }

        const filename = generateOutputFilename(inputFile.name, options.outputFormat);

        const url = URL.createObjectURL(outputBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 重置所有状态
     */
    reset: () => {
        const { inputUrl, outputUrl } = get();

        // 清理 URL
        if (inputUrl) URL.revokeObjectURL(inputUrl);
        if (outputUrl) URL.revokeObjectURL(outputUrl);

        set({
            inputFile: null,
            inputUrl: null,
            inputMetadata: null,
            exifMetadata: null,
            options: { ...defaultImageOptions },
            outputBlob: null,
            outputUrl: null,
            outputMetadata: null,
            isProcessing: false,
            processError: null,
            progress: null,
        });
    },

    /**
     * 验证文件
     */
    validateFile: (file: File) => {
        // 检查文件大小
        if (file.size > MAX_FILE_SIZE) {
            const sizeMB = (file.size / 1024 / 1024).toFixed(2);
            return {
                valid: false,
                error: `文件过大 (${sizeMB}MB)，最大支持 50MB`,
            };
        }

        // 检查格式
        if (!validateImageFile(file)) {
            return {
                valid: false,
                error: '不支持的文件格式',
            };
        }

        return { valid: true };
    },
}));
