import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

type FFmpegLoadState = 'not_loaded' | 'loading' | 'loaded' | 'error';

class FFmpegManager {
    private ffmpeg: FFmpeg | null = null;
    private state: FFmpegLoadState = 'not_loaded';
    private loadingPromise: Promise<{ ffmpeg: FFmpeg; isMultiThread: boolean; }> | null = null;
    public isMultiThread = false;

    public async getInstance(): Promise<{ ffmpeg: FFmpeg; isMultiThread: boolean; }> {
        console.log('[FFmpegManager] getInstance 调用，当前状态:', this.state);

        if (this.state === 'loaded' && this.ffmpeg) {
            console.log('[FFmpegManager] FFmpeg 已加载，直接返回实例');
            return { ffmpeg: this.ffmpeg, isMultiThread: this.isMultiThread };
        }
        if (this.state === 'loading' && this.loadingPromise) {
            console.log('[FFmpegManager] FFmpeg 正在加载中，返回现有 Promise');
            return this.loadingPromise;
        }
        
        console.log('[FFmpegManager] 开始加载 FFmpeg...');
        this.state = 'loading';
        this.loadingPromise = this.load();
        return this.loadingPromise;
    }

    private async load(): Promise<{ ffmpeg: FFmpeg; isMultiThread: boolean; }> {
        try {
            console.log('[FFmpegManager] 初始化 FFmpeg 单例...');
            const ffmpeg = new FFmpeg();

            const checkMultiThreadSupport = () => typeof SharedArrayBuffer !== 'undefined';
            this.isMultiThread = checkMultiThreadSupport();
            
            const coreVersion = this.isMultiThread ? 'core-mt' : 'core';
            const baseURL = `https://unpkg.com/@ffmpeg/${coreVersion}@0.12.10/dist/umd`;
            console.log(`[FFmpegManager] 加载 FFmpeg ${this.isMultiThread ? '多线程' : '单线程'} 版本...`);
            console.log(`[FFmpegManager] 基础 URL: ${baseURL}`);

            const startTime = Date.now();

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                workerURL: this.isMultiThread ? await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript') : undefined
            });

            const loadTime = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`[FFmpegManager] ✅ FFmpeg 单例加载成功！耗时: ${loadTime}秒`);

            this.ffmpeg = ffmpeg;
            this.state = 'loaded';
            return { ffmpeg, isMultiThread: this.isMultiThread };
        } catch (err) {
            console.error('[FFmpegManager] ❌ FFmpeg 单例加载失败:', err);
            this.state = 'error';
            this.ffmpeg = null;
            this.loadingPromise = null; // 重置 Promise，允许重试
            throw err;
        }
    }
}

// 导出一个单例
export const ffmpegManager = new FFmpegManager(); 