import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

type FFmpegLoadState = 'not_loaded' | 'loading' | 'loaded' | 'error';

class FFmpegManager {
    private ffmpeg: FFmpeg | null = null;
    private state: FFmpegLoadState = 'not_loaded';
    private loadingPromise: Promise<{ ffmpeg: FFmpeg; isMultiThread: boolean; }> | null = null;
    public isMultiThread = false;

    public async getInstance(): Promise<{ ffmpeg: FFmpeg; isMultiThread: boolean; }> {
        if (this.state === 'loaded' && this.ffmpeg) {
            return { ffmpeg: this.ffmpeg, isMultiThread: this.isMultiThread };
        }
        if (this.state === 'loading' && this.loadingPromise) {
            return this.loadingPromise;
        }
        
        this.state = 'loading';
        this.loadingPromise = this.load();
        return this.loadingPromise;
    }

    private async load(): Promise<{ ffmpeg: FFmpeg; isMultiThread: boolean; }> {
        try {
            console.log('Initializing FFmpeg singleton...');
            const ffmpeg = new FFmpeg();

            const checkMultiThreadSupport = () => typeof SharedArrayBuffer !== 'undefined';
            this.isMultiThread = checkMultiThreadSupport();
            
            const coreVersion = this.isMultiThread ? 'core-mt' : 'core';
            const baseURL = `https://unpkg.com/@ffmpeg/${coreVersion}@0.12.10/dist/umd`;
            console.log(`Loading FFmpeg ${this.isMultiThread ? 'multi-threaded' : 'single-threaded'} version...`);

            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                workerURL: this.isMultiThread ? await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript') : undefined
            });

            console.log('FFmpeg singleton loaded successfully!');
            this.ffmpeg = ffmpeg;
            this.state = 'loaded';
            return { ffmpeg, isMultiThread: this.isMultiThread };
        } catch (err) {
            console.error('Failed to load FFmpeg singleton:', err);
            this.state = 'error';
            this.ffmpeg = null;
            throw err;
        }
    }
}

// 导出一个单例
export const ffmpegManager = new FFmpegManager(); 