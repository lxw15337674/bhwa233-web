import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  compressVideo,
  validateVideoFile,
  getVideoCompressionParams,
  MAX_FILE_SIZE,
  VideoCompressionParams,
} from './videoCompressor';
import { ffmpegManager } from '../lib/ffmpeg-instance';
import { FFmpeg } from '@ffmpeg/ffmpeg';

// Mock the ffmpeg instance to avoid actual Wasm loading and execution
vi.mock('../lib/ffmpeg-instance', () => ({
  ffmpegManager: {
    getInstance: vi.fn(),
  },
}));

// Mock fetchFile from @ffmpeg/util as it's used internally
vi.mock('@ffmpeg/util', async (importOriginal) => {
    const original = await importOriginal<typeof import('@ffmpeg/util')>();
    return {
        ...original,
        fetchFile: vi.fn(() => Promise.resolve(new Uint8Array([1, 2, 3, 4, 5]))),
    };
});


describe('videoCompressor', () => {
  const mockFfmpeg = {
    writeFile: vi.fn(),
    readFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    exec: vi.fn().mockResolvedValue(0),
    on: vi.fn(),
    off: vi.fn(),
    deleteFile: vi.fn(),
    terminate: vi.fn(),
  } as unknown as FFmpeg;

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup the mock implementation for getInstance
    (ffmpegManager.getInstance as vi.Mock).mockResolvedValue({
      ffmpeg: mockFfmpeg,
      isMultiThread: false,
    });
  });

  describe('validateVideoFile', () => {
    it('should return valid for a correct file', () => {
      const file = new File([''], 'video.mp4', { type: 'video/mp4' });
      expect(validateVideoFile(file)).toEqual({ valid: true });
    });

    it('should return an error for a file that is too large', () => {
      const largeFile = new File([''], 'large_video.mp4', { type: 'video/mp4' });
      Object.defineProperty(largeFile, 'size', { value: MAX_FILE_SIZE + 1 });
      const result = validateVideoFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('超过 1.5GB 限制');
    });

    it('should return an error for an unsupported file type', () => {
      const textFile = new File(['hello'], 'document.txt', { type: 'text/plain' });
      const result = validateVideoFile(textFile);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不支持的视频格式');
    });
     it('should return an error for a null file', () => {
      const result = validateVideoFile(null as any);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('不支持的视频格式');
    });
  });

  describe('getVideoCompressionParams', () => {
    it('should generate correct params for 1080p MP4', () => {
      const params = getVideoCompressionParams('mp4', '1080p', 1920, 1080);
      expect(params.video).toEqual(expect.arrayContaining(['-crf', '20']));
      expect(params.audio).toEqual(['-c:a', 'copy']);
      expect(params.video).not.toEqual(expect.arrayContaining(['-vf']));
    });

    it('should generate correct params for 360p MP4 with audio compression', () => {
      const params = getVideoCompressionParams('mp4', '360p', 1280, 720);
      expect(params.video).toEqual(expect.arrayContaining(['-crf', '26']));
      expect(params.audio).toEqual(['-c:a', 'aac', '-b:a', '128k']);
    });

    it('should include scaling params when original resolution is higher', () => {
      const params = getVideoCompressionParams('mp4', '720p', 1920, 1080);
      expect(params.video).toEqual(
        expect.arrayContaining(['-vf', 'scale=1280:720:force_original_aspect_ratio=decrease'])
      );
    });

    it('should use libvpx-vp9 for WebM format', () => {
      const params = getVideoCompressionParams('webm', '1080p');
      expect(params.video).toEqual(expect.arrayContaining(['-c:v', 'libvpx-vp9']));
    });
     it('should use libopus for WebM format and 360p', () => {
      const params = getVideoCompressionParams('webm', '360p');
      expect(params.audio).toEqual(expect.arrayContaining(['-c:a', 'libopus']));
    });
  });

  describe('compressVideo', () => {
    const file = new File(['dummy video content'], 'test.mp4', { type: 'video/mp4' });
    const params: VideoCompressionParams = {
      outputFormat: 'mp4',
      resolution: '720p',
    };

    it('should call ffmpeg.exec with the correct arguments', async () => {
      await compressVideo(file, mockFfmpeg, params, false);

      const expectedArgs = [
        '-y',
        '-nostdin',
        '-loglevel', 'info',
        '-stats',
        '-i', 'input.mp4',
        // No threads argument for single thread
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
        '-c:a', 'copy',
        'output.mp4'
      ];

      expect(mockFfmpeg.exec).toHaveBeenCalledWith(expectedArgs);
    });

    it('should include multi-threading args when isMultiThread is true', async () => {
        await compressVideo(file, mockFfmpeg, params, true);
        expect(mockFfmpeg.exec).toHaveBeenCalledWith(expect.arrayContaining(['-threads', '0']));
    });


    it('should write the file to ffmpeg memory', async () => {
      await compressVideo(file, mockFfmpeg, params, false);
      expect(mockFfmpeg.writeFile).toHaveBeenCalledWith('input.mp4', expect.any(Uint8Array));
    });

    it('should return a Blob with the correct MIME type', async () => {
      const result = await compressVideo(file, mockFfmpeg, params, false);
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('video/mp4');
    });

    it('should report progress at different stages', async () => {
      const onProgress = vi.fn();

      // Mock ffmpeg.on to immediately call the provided callback with simulated log messages
      (mockFfmpeg.on as vi.Mock).mockImplementation((event, callback) => {
        if (event === 'log') {
          // Simulate initial duration log
          callback({ message: 'Duration: 00:00:10.00, start: 0.000000, bitrate: 1000.00 kb/s' });
          // Simulate encoder config log
          callback({ message: '[libx264 @ 0x...] Some encoder config message' });
          // Simulate output stream setup log
          callback({ message: `Output #0, mp4, to 'output.mp4':` });
          // Simulate processing start log
          callback({ message: 'Press [q] to stop, [?] for help.' });
          // Simulate progress updates
          callback({ message: 'frame= 100 fps=10.00 q=28.0 size= 100kB time=00:00:02.00 bitrate=400.0kbits/s speed=0.2x' });
          callback({ message: 'frame= 500 fps=20.00 q=28.0 size= 500kB time=00:00:05.00 bitrate=800.0kbits/s speed=0.5x' });
          callback({ message: 'frame= 950 fps=25.00 q=28.0 size= 950kB time=00:00:09.50 bitrate=950.0kbits/s speed=0.9x' });
        }
      });

      // Start compression
      await compressVideo(file, mockFfmpeg, params, false, null, onProgress);

      // Assertions for each stage
      expect(onProgress).toHaveBeenCalledWith(2, '正在初始化编码器...', undefined);
      expect(onProgress).toHaveBeenCalledWith(5, '正在配置编码器...', undefined);
      expect(onProgress).toHaveBeenCalledWith(8, '正在设置输出流...', undefined);
      expect(onProgress).toHaveBeenCalledWith(10, '开始处理视频...', undefined);
      expect(onProgress).toHaveBeenCalledWith(20, expect.stringContaining('正在压缩视频...'), expect.any(String));
      expect(onProgress).toHaveBeenCalledWith(50, expect.stringContaining('正在压缩视频...'), expect.any(String));
      expect(onProgress).toHaveBeenCalledWith(95, '即将完成...', expect.any(String));

      // Ensure off is called
      expect(mockFfmpeg.off).toHaveBeenCalledWith('log', expect.any(Function));
    });

    it('should throw an error if file validation fails', async () => {
      const invalidFile = new File([''], 'text.txt', { type: 'text/plain' });
      await expect(compressVideo(invalidFile, mockFfmpeg, params, false)).rejects.toThrow(
        '不支持的视频格式'
      );
      expect(mockFfmpeg.exec).not.toHaveBeenCalled();
    });

    it('should clean up files from ffmpeg memory after execution', async () => {
      await compressVideo(file, mockFfmpeg, params, false);
      expect(mockFfmpeg.deleteFile).toHaveBeenCalledWith('input.mp4');
      expect(mockFfmpeg.deleteFile).toHaveBeenCalledWith('output.mp4');
    });

     it('should clean up files even if ffmpeg.exec fails', async () => {
      (mockFfmpeg.exec as vi.Mock).mockRejectedValue(new Error('FFmpeg execution failed'));

      await expect(compressVideo(file, mockFfmpeg, params, false)).rejects.toThrow('FFmpeg execution failed');
      
      expect(mockFfmpeg.deleteFile).toHaveBeenCalledWith('input.mp4');
      expect(mockFfmpeg.deleteFile).toHaveBeenCalledWith('output.mp4');
    });
  });
});