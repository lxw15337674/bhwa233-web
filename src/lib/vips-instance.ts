/**
 * wasm-vips 单例管理器
 * 通过 CDN 加载 wasm-vips，提供图片处理能力
 */

// 声明 Vips 类型
declare global {
    interface Window {
        Vips?: any;
    }
}

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
     * 从 CDN 动态加载 wasm-vips
     */
    private async loadVips(): Promise<VipsInstance> {
        const CDN_URL = 'https://cdn.jsdelivr.net/npm/wasm-vips@0.0.16/lib/vips-es6.js';

        try {
            // 动态导入 ES6 模块
            const VipsModule = await import(/* webpackIgnore: true */ CDN_URL);
            const Vips = VipsModule.default;

            // 初始化 Vips
            const vips = await Vips({
                // 配置 WASM 文件路径
                locateFile: (fileName: string) => {
                    return `https://cdn.jsdelivr.net/npm/wasm-vips@0.0.16/lib/${fileName}`;
                },
            });

            return vips as VipsInstance;
        } catch (error) {
            console.error('Failed to load wasm-vips:', error);
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
