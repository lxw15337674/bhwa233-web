import { FFmpeg } from '@ffmpeg/ffmpeg';

type FFmpegLoadState = 'not_loaded' | 'loading' | 'loaded' | 'error';

// 是否为开发环境
const isDev = process.env.NODE_ENV === 'development';

class FFmpegManager {
    private ffmpeg: FFmpeg | null = null;
    private state: FFmpegLoadState = 'not_loaded';
    private loadingPromise: Promise<{ ffmpeg: FFmpeg; isMultiThread: boolean; }> | null = null;
    public isMultiThread = false;

    /**
     * 检测浏览器是否支持多线程
     */
    private checkMultiThreadSupport(): boolean {
        return typeof SharedArrayBuffer !== 'undefined';
    }

    public async getInstance(): Promise<{ ffmpeg: FFmpeg; isMultiThread: boolean; }> {
        if (isDev) console.log('[FFmpegManager] getInstance 调用，当前状态:', this.state);

        if (this.state === 'loaded' && this.ffmpeg) {
            if (isDev) console.log('[FFmpegManager] FFmpeg 已加载，直接返回实例');
            return { ffmpeg: this.ffmpeg, isMultiThread: this.isMultiThread };
        }
        if (this.state === 'loading' && this.loadingPromise) {
            if (isDev) console.log('[FFmpegManager] FFmpeg 正在加载中，返回现有 Promise');
            return this.loadingPromise;
        }
        
        if (isDev) console.log('[FFmpegManager] 开始加载 FFmpeg...');
        this.state = 'loading';
        this.loadingPromise = this.load();
        return this.loadingPromise;
    }

    private async load(): Promise<{ ffmpeg: FFmpeg; isMultiThread: boolean; }> {
        try {
            if (isDev) console.time('[FFmpegManager] 加载时间');

            const ffmpeg = new FFmpeg();

            // 检测多线程支持
            this.isMultiThread = this.checkMultiThreadSupport();
            
            const coreVersion = this.isMultiThread ? 'core-mt' : 'core';
            const baseURL = `/wasm-libs/ffmpeg/${coreVersion}`;

            if (isDev) {
                console.log(`[FFmpegManager] 加载 FFmpeg ${this.isMultiThread ? '多线程' : '单线程'} 版本...`);
                console.log(`[FFmpegManager] 基础 URL: ${baseURL}`);
            }

            // 从本地加载（无需 toBlobURL）
            await ffmpeg.load({
                coreURL: `${baseURL}/ffmpeg-core.js`,
                wasmURL: `${baseURL}/ffmpeg-core.wasm`,
                workerURL: this.isMultiThread ? `${baseURL}/ffmpeg-core.worker.js` : undefined
            });

            if (isDev) {
                console.timeEnd('[FFmpegManager] 加载时间');
                console.log('[FFmpegManager] ✅ FFmpeg 加载成功!');
            }

            this.ffmpeg = ffmpeg;
            this.state = 'loaded';
            return { ffmpeg, isMultiThread: this.isMultiThread };
        } catch (err) {
            console.error('[FFmpegManager] ❌ FFmpeg 加载失败:', err);
            this.state = 'error';
            this.ffmpeg = null;
            this.loadingPromise = null; // 重置 Promise，允许重试
            throw err;
        }
    }
}

// 导出一个单例
export const ffmpegManager = new FFmpegManager(); 