import { create } from 'zustand';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

interface FFmpegState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  ffmpeg: FFmpeg | null;
  isMultiThread: boolean;
  loadFFmpeg: () => Promise<void>;
}

export const useFFmpegStore = create<FFmpegState>((set, get) => ({
  isLoaded: false,
  isLoading: false,
  error: null,
  ffmpeg: null,
  isMultiThread: false,

  loadFFmpeg: async () => {
    const state = get();
    // If already loaded or currently loading, prevent re-initialization
    if (state.isLoaded || state.isLoading) {
      console.log('[FFmpegStore] FFmpeg already loaded or loading.');
      return;
    }

    set({ isLoading: true, error: null });
    console.log('[FFmpegStore] Initiating FFmpeg load...');

    try {
      const ffmpeg = new FFmpeg();
      
      // Detect multi-thread support (SharedArrayBuffer)
      const isMultiThread = typeof SharedArrayBuffer !== 'undefined';
      
      // 使用 unpkg CDN，参考 cnvrt 项目的实现方式
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';

      console.log(`[FFmpegStore] Loading FFmpeg from ${baseURL}...`);
      
      // Load FFmpeg core and WASM（不使用 worker）
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      console.log('[FFmpegStore] ✅ FFmpeg loaded successfully.');

      set({ 
        isLoaded: true, 
        isLoading: false, 
        ffmpeg,
        isMultiThread,
        error: null
      });
    } catch (error: any) {
      console.error('[FFmpegStore] ❌ FFmpeg loading failed:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load FFmpeg',
        isLoaded: false,
        ffmpeg: null
      });
    }
  }
}));
