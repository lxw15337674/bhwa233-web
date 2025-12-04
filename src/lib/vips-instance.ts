/**
 * wasm-vips 单例管理器
 * 从本地 public 目录加载 wasm-vips，提供图片处理能力
 */

// wasm-vips 本地路径
const VIPS_LOCAL_URL = '/wasm-vips/vips-es6.js';

export interface VipsInstance {
    Image: {
        newFromBuffer: (buffer: ArrayBuffer) => VipsImage;
        newFromFile: (path: string) => VipsImage;
    };
    // 其他需要的方法
}

export interface VipsImage {
    width: number;
    height: number;
    format: string;

    // 缩放
    resize: (scale: number) => VipsImage;
    thumbnailImage: (width: number, options?: { height?: number }) => VipsImage;

    // 旋转
    rot90: () => VipsImage;
    rot180: () => VipsImage;
    rot270: () => VipsImage;

    // 翻转
    fliphor: () => VipsImage;
    flipver: () => VipsImage;

    // 导出
    writeToBuffer: (suffix: string, options?: { Q?: number }) => Uint8Array;

    // 资源释放
    delete: () => void;
}

class VipsManager {
    private instance: VipsInstance | null = null;
    private loadingPromise: Promise<VipsInstance> | null = null;
    private isLoading = false;
    private loadError: Error | null = null;

    /**
     * 检测浏览器是否支持 SharedArrayBuffer
     */
    checkBrowserSupport(): { supported: boolean; error?: string } {
        // 检查 SharedArrayBuffer
        if (typeof SharedArrayBuffer === 'undefined') {
            return {
                supported: false,
                error: '您的浏览器不支持 SharedArrayBuffer，无法使用图片处理功能。请使用最新版本的 Chrome、Firefox 或 Edge 浏览器。'
            };
        }

        // 检查 WebAssembly
        if (typeof WebAssembly === 'undefined') {
            return {
                supported: false,
                error: '您的浏览器不支持 WebAssembly，无法使用图片处理功能。'
            };
        }

        return { supported: true };
    }

    /**
     * 获取 Vips 实例（单例模式 + 懒加载）
     */
    async getInstance(): Promise<VipsInstance> {
        // 已加载，直接返回
        if (this.instance) {
            return this.instance;
        }

        // 正在加载，等待完成
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        // 检查浏览器支持
        const support = this.checkBrowserSupport();
        if (!support.supported) {
            throw new Error(support.error);
        }

        // 开始加载
        this.isLoading = true;
        this.loadError = null;

        this.loadingPromise = this.loadVips();

        try {
            this.instance = await this.loadingPromise;
            return this.instance;
        } catch (error) {
            this.loadError = error instanceof Error ? error : new Error('加载失败');
            throw this.loadError;
        } finally {
            this.isLoading = false;
            this.loadingPromise = null;
        }
    }

    /**
     * 从本地 public 目录加载 wasm-vips
     * 使用 webpackIgnore 跳过 webpack 处理，由浏览器原生加载 ES 模块
     */
    private async loadVips(): Promise<VipsInstance> {
        try {
            console.log('[vips] 开始加载 wasm-vips...');
            console.time('[vips] 总加载时间');

            // 从本地 public 目录动态导入 wasm-vips ES6 模块
            console.time('[vips] 导入 wasm-vips');
            const Vips = (await import(/* webpackIgnore: true */ VIPS_LOCAL_URL)).default;
            console.timeEnd('[vips] 导入 wasm-vips');

            // 初始化 Vips，配置动态库路径
            console.time('[vips] Vips 初始化');
            console.log('[vips] 开始初始化 Vips...');
            const vips = await Vips({
                // 禁用动态库加载，避免加载 HEIF/JXL 等格式的额外 wasm 文件
                dynamicLibraries: [],
                // 指定文件路径
                locateFile: (fileName: string) => `/wasm-vips/${fileName}`,
                // 打印日志便于调试
                print: (text: string) => console.log('[vips]', text),
                printErr: (text: string) => console.error('[vips]', text),
            });
            console.timeEnd('[vips] Vips 初始化');

            console.log('[vips] wasm-vips 加载完成!');
            console.timeEnd('[vips] 总加载时间');

            return vips as VipsInstance;
        } catch (error) {
            console.error('[vips] Failed to load wasm-vips:', error);
            throw new Error('图片处理引擎加载失败，请刷新页面重试。');
        }
    }

    /**
     * 获取加载状态
     */
    getStatus(): { loaded: boolean; loading: boolean; error: Error | null } {
        return {
            loaded: this.instance !== null,
            loading: this.isLoading,
            error: this.loadError,
        };
    }

    /**
     * 重置实例（用于错误恢复）
     */
    reset(): void {
        this.instance = null;
        this.loadingPromise = null;
        this.isLoading = false;
        this.loadError = null;
    }
}

// 导出单例
export const vipsManager = new VipsManager();
