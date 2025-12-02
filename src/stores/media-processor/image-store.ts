import { create } from 'zustand';
import { vipsManager, VipsInstance } from '@/lib/vips-instance';
import {
    ImageMetadata,
    ImageProcessingOptions,
    defaultImageOptions,
    getImageMetadata,
    processImage,
    generateOutputFilename,
    validateImageFile,
} from '@/utils/imageProcessor';

interface ImageProcessorStore {
    // Vips 实例状态
    vips: VipsInstance | null;
    vipsLoading: boolean;
    vipsLoaded: boolean;
    vipsError: string | null;

    // 输入状态
    inputFile: File | null;
    inputUrl: string | null;
    inputMetadata: ImageMetadata | null;

    // 处理选项
    options: ImageProcessingOptions;

    // 输出状态
    outputBlob: Blob | null;
    outputUrl: string | null;
    outputMetadata: ImageMetadata | null;

    // 处理状态
    isProcessing: boolean;
    processError: string | null;

    // Actions
    initVips: () => Promise<void>;
    setInputFile: (file: File) => Promise<void>;
    updateOptions: (options: Partial<ImageProcessingOptions>) => void;
    resetOptions: () => void;
    processImage: () => Promise<void>;
    downloadOutput: () => void;
    reset: () => void;
    validateFile: (file: File) => boolean;
}

export const useImageProcessorStore = create<ImageProcessorStore>()((set, get) => ({
    // 初始状态
    vips: null,
    vipsLoading: false,
    vipsLoaded: false,
    vipsError: null,

    inputFile: null,
    inputUrl: null,
    inputMetadata: null,

    options: { ...defaultImageOptions },

    outputBlob: null,
    outputUrl: null,
    outputMetadata: null,

    isProcessing: false,
    processError: null,

    /**
     * 初始化 Vips
     */
    initVips: async () => {
        const { vipsLoaded, vipsLoading } = get();

        if (vipsLoaded || vipsLoading) {
            return;
        }

        // 先检查浏览器支持
        const support = vipsManager.checkBrowserSupport();
        if (!support.supported) {
            set({ vipsError: support.error || '浏览器不支持' });
            return;
        }

        set({ vipsLoading: true, vipsError: null });

        try {
            const vips = await vipsManager.getInstance();
            set({
                vips,
                vipsLoaded: true,
                vipsLoading: false,
            });
        } catch (error) {
            set({
                vipsError: error instanceof Error ? error.message : '加载失败',
                vipsLoading: false,
            });
        }
    },

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
            } else if (metadata.format.includes('avif')) {
                defaultFormat = 'avif';
            }

            set({
                inputFile: file,
                inputUrl: url,
                inputMetadata: metadata,
                outputBlob: null,
                outputUrl: null,
                outputMetadata: null,
                processError: null,
                options: {
                    ...defaultImageOptions,
                    outputFormat: defaultFormat,
                },
            });
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
        } else if (inputMetadata?.format.includes('avif')) {
            defaultFormat = 'avif';
        }

        set({
            options: {
                ...defaultImageOptions,
                outputFormat: defaultFormat,
            },
        });
    },

    /**
     * 处理图片
     */
    processImage: async () => {
        const { vips, inputFile, options, outputUrl } = get();

        if (!vips || !inputFile) {
            return;
        }

        // 清理旧的输出 URL
        if (outputUrl) {
            URL.revokeObjectURL(outputUrl);
        }

        set({ isProcessing: true, processError: null });

        try {
            const result = await processImage(vips, inputFile, options);

            const url = URL.createObjectURL(result.blob);

            set({
                outputBlob: result.blob,
                outputUrl: url,
                outputMetadata: result.metadata,
                isProcessing: false,
            });
        } catch (error) {
            set({
                processError: error instanceof Error ? error.message : '处理失败',
                isProcessing: false,
            });
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
            options: { ...defaultImageOptions },
            outputBlob: null,
            outputUrl: null,
            outputMetadata: null,
            isProcessing: false,
            processError: null,
        });
    },

    /**
     * 验证文件
     */
    validateFile: validateImageFile,
}));
