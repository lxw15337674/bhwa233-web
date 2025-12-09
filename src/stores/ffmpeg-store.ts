import { create } from 'zustand';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

interface FFmpegState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  ffmpeg: FFmpeg | null;
  isMultiThread: boolean;
  loadFFmpeg: () => Promise<void>; // Renamed to avoid conflict with 'load' in store
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
      
      // Using jsdelivr CDN for loading.
      // Note: Using core-mt (multi-threaded version) for better performance.
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core-mt@0.12.10/dist/umd';

      console.log(`[FFmpegStore] Loading FFmpeg (${isMultiThread ? 'multi-threaded' : 'single-threaded'}) from ${baseURL}...`);
      
      // Add log listener for debugging and progress (can be extended later)
      ffmpeg.on('log', ({ message }) => {
        // console.log('[FFmpeg Core Log]:', message); // Uncomment for verbose logging
      });

      // Load FFmpeg core, WASM, and worker
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
      });

      console.log('[FFmpegStore] ✅ FFmpeg loaded successfully.');

      set({ 
        isLoaded: true, 
        isLoading: false, 
        ffmpeg,
        isMultiThread,
        error: null // Clear any previous errors on successful load
      });
    } catch (error: any) {
      console.error('[FFmpegStore] ❌ FFmpeg loading failed:', error);
      set({ 
        isLoading: false, 
        error: error.message || 'Failed to load FFmpeg',
        isLoaded: false, // Ensure isLoaded is false on error
        ffmpeg: null
      });
    }
  }
}));
