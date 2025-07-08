import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { MediaMetadata, formatFileSize, formatDuration } from './audioConverter';

// 视频格式配置
export const VIDEO_FORMATS = {
  mp4: { label: 'MP4', ext: 'mp4', mime: 'video/mp4' },
  webm: { label: 'WebM', ext: 'webm', mime: 'video/webm' },
  avi: { label: 'AVI', ext: 'avi', mime: 'video/x-msvideo' },
  mov: { label: 'MOV', ext: 'mov', mime: 'video/quicktime' }
} as const;

// 清晰度配置
export const VIDEO_RESOLUTIONS = {
  '1080p': { 
    label: '1080p', 
    width: 1920, 
    height: 1080, 
    description: '高清画质，适合收藏保存',
    compressionFactor: 0.7
  },
  '720p': { 
    label: '720p', 
    width: 1280, 
    height: 720, 
    description: '标准画质，分享上传推荐',
    compressionFactor: 0.5
  },
  '360p': { 
    label: '360p', 
    width: 640, 
    height: 360, 
    description: '小文件，快速传输',
    compressionFactor: 0.2
  }
} as const;

// 文件大小限制（1.5GB）
export const MAX_FILE_SIZE = 1.5 * 1024 * 1024 * 1024;

// 类型定义
export type VideoFormat = keyof typeof VIDEO_FORMATS;
export type VideoResolution = keyof typeof VIDEO_RESOLUTIONS;

export interface VideoCompressionParams {
  outputFormat: VideoFormat;
  resolution: VideoResolution;
}

export interface VideoCompressionEstimate {
  estimatedSizeMB: number;
  compressionRatio: number;
  estimatedTimeMinutes: number;
  audioProcessing: 'original' | 'compressed';
  note: string;
}

// FFmpeg参数配置
export const getVideoCompressionParams = (
  format: VideoFormat, 
  resolution: VideoResolution,
  originalWidth?: number,
  originalHeight?: number
): { video: string[], audio: string[], description: string } => {
  const resConfig = VIDEO_RESOLUTIONS[resolution];
  
  // 检查是否需要缩放
  const needsScaling = originalWidth && originalHeight && 
    (originalWidth > resConfig.width || originalHeight > resConfig.height);
  
  // 视频参数
  const videoParams = ['-c:v', 'libx264', '-preset', 'fast'];
  
  // 添加缩放参数
  if (needsScaling) {
    videoParams.unshift('-vf', `scale=${resConfig.width}:${resConfig.height}:force_original_aspect_ratio=decrease`);
  }
  
  // 根据分辨率设置CRF值
  const crfValues = {
    '1080p': '20',
    '720p': '23', 
    '360p': '26'
  };
  videoParams.push('-crf', crfValues[resolution]);
  
  // 音频参数 - 360p压缩音频，其他保持原质量
  const audioParams = resolution === '360p' 
    ? ['-c:a', 'aac', '-b:a', '128k']
    : ['-c:a', 'copy'];
  
  // 格式特定的调整
  if (format === 'webm') {
    videoParams[1] = 'libvpx-vp9'; // 使用VP9编码器
    if (resolution === '360p') {
      audioParams[1] = 'libopus'; // WebM使用Opus音频
    }
  } else if (format === 'avi' && resolution === '360p') {
    audioParams[1] = 'libmp3lame'; // AVI使用MP3音频
    audioParams[2] = '-b:a';
    audioParams[3] = '128k';
  }
  
  const description = `${resConfig.label} ${VIDEO_FORMATS[format].label}${
    resolution === '360p' ? ' (音频压缩)' : ' (保持原音频)'
  }`;
  
  return {
    video: videoParams,
    audio: audioParams,
    description
  };
};

// 文件大小验证
export const validateVideoFile = (file: File): { valid: boolean; error?: string } => {
  // 检查文件是否存在
  if (!file) {
    return {
      valid: false,
      error: '不支持的视频格式，请选择常见的视频文件'
    };
  }

  // 检查文件大小
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = file.size / (1024 * 1024);
    return {
      valid: false,
      error: `文件大小 ${formatFileSize(sizeMB)} 超过 1.5GB 限制，请选择较小的视频文件`
    };
  }
  
  // 检查文件类型
  const supportedTypes = [
    'video/mp4', 'video/avi', 'video/mov', 'video/mkv', 
    'video/webm', 'video/wmv', 'video/flv', 'video/3gp'
  ];
  
  if (!supportedTypes.some(type => file.type.startsWith(type)) && 
    !file.name?.match(/\.(mp4|avi|mov|mkv|webm|wmv|flv|3gp)$/i)) {
    return {
      valid: false,
      error: '不支持的视频格式，请选择常见的视频文件'
    };
  }
  
  return { valid: true };
};

// 预估输出大小
export const estimateVideoCompression = (
  metadata: MediaMetadata | null,
  file: File,
  format: VideoFormat,
  resolution: VideoResolution
): VideoCompressionEstimate => {
  const resConfig = VIDEO_RESOLUTIONS[resolution];
  const originalSizeMB = file.size / (1024 * 1024);
  
  // 基础压缩比
  let compressionFactor: number = resConfig.compressionFactor;
  
  // 格式调整
  const formatMultipliers = {
    mp4: 1.0,
    webm: 0.85,  // WebM通常更小
    avi: 1.1,    // AVI稍大
    mov: 1.0
  };
  compressionFactor = compressionFactor * formatMultipliers[format];
  
  // 如果有原视频信息，进行更精确的计算
  if (metadata?.video) {
    const originalRes = metadata.video.width * metadata.video.height;
    const targetRes = resConfig.width * resConfig.height;
    
    // 如果原分辨率小于目标分辨率，不会增大文件
    if (originalRes <= targetRes) {
      compressionFactor = Math.min(compressionFactor, 0.9);
    }
  }
  
  const estimatedSizeMB = originalSizeMB * compressionFactor;
  const compressionRatio = Math.round((1 - compressionFactor) * 100);
  
  // 预估处理时间（基于文件大小的经验公式）
  const baseTimeMinutes = originalSizeMB / 100; // 每100MB约1分钟
  const resolutionMultiplier = {
    '1080p': 1.2,
    '720p': 1.0,
    '360p': 0.8
  };
  const estimatedTimeMinutes = Math.max(0.5, baseTimeMinutes * resolutionMultiplier[resolution]);
  
  const audioProcessing = resolution === '360p' ? 'compressed' : 'original';
  
  let note = `预估基于 ${resConfig.label} 输出`;
  if (metadata?.video) {
    const needsDownscale = metadata.video.width > resConfig.width || 
                          metadata.video.height > resConfig.height;
    if (!needsDownscale) {
      note += '，原分辨率较小，主要优化编码';
    }
  }
  
  return {
    estimatedSizeMB: Math.max(0.1, estimatedSizeMB),
    compressionRatio: Math.max(0, compressionRatio),
    estimatedTimeMinutes,
    audioProcessing,
    note
  };
};

// 视频压缩主函数
export const compressVideo = async (
  file: File,
  ffmpeg: FFmpeg,
  params: VideoCompressionParams,
  isMultiThread: boolean,
  metadata?: MediaMetadata | null,
  onProgress?: (progress: number, step: string, remainingTime?: string) => void
): Promise<Blob> => {
  const { outputFormat, resolution } = params;
  const inputExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
  const inputFileName = `input.${inputExtension}`;
  const outputFileName = `output.${VIDEO_FORMATS[outputFormat].ext}`;
  
  // 验证文件
  const validation = validateVideoFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  await ffmpeg.writeFile(inputFileName, await fetchFile(file));
  
  let totalDuration = 0;
  let lastProgress = 0;
  const startTime = Date.now();
  let lastProgressTime = startTime;
  
  // 获取FFmpeg参数
  const ffmpegParams = getVideoCompressionParams(
    outputFormat, 
    resolution,
    metadata?.video?.width,
    metadata?.video?.height
  );
  
  console.log(`Video compression strategy: ${ffmpegParams.description}`);
  console.log(`FFmpeg params: ${[...ffmpegParams.video, ...ffmpegParams.audio].join(' ')}`);
  
  const progressListener = ({ message }: { message: string }) => {
    // 添加调试日志，记录所有进度相关的消息
    if (message.includes('frame=') || message.includes('time=') || message.includes('Progress') || message.includes('speed=')) {
      console.log('Progress message:', message);
    }

    // 解析总时长
    if (message.includes('Duration:') && totalDuration === 0) {
      const durationMatch = message.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
      if (durationMatch) {
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseFloat(durationMatch[3]);
        totalDuration = hours * 3600 + minutes * 60 + seconds;
        console.log(`Video duration detected: ${totalDuration}s`);
        onProgress?.(2, '正在初始化编码器...', undefined);
      }
    }

    // 检测编码器初始化阶段
    if (message.includes('libx264') || message.includes('libvpx')) {
      if (lastProgress < 5) {
        onProgress?.(5, '正在配置编码器...', undefined);
        lastProgress = 5;
      }
      return;
    }

    // 检测输出流设置阶段
    if (message.includes('Output #0') || message.includes('Stream #0:')) {
      if (lastProgress < 8) {
        onProgress?.(8, '正在设置输出流...', undefined);
        lastProgress = 8;
      }
      return;
    }

    // 检测处理开始的标志
    if (message.includes('Press [q] to stop') || (message.includes('frame=') && lastProgress < 10)) {
      onProgress?.(10, '开始处理视频...', undefined);
      lastProgress = 10;
    }

    // 处理包含frame=的消息（即使包含负时间戳）
    if (message.includes('frame=')) {
      const frameMatch = message.match(/frame=\s*(\d+)/);
      if (frameMatch) {
        const currentFrame = parseInt(frameMatch[1]);
        console.log(`Current frame: ${currentFrame}`);

        // 如果消息同时包含有效的time=信息，优先使用
        if (message.includes('time=') && !message.includes('time=-') && totalDuration > 0) {
          const timeMatch = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const seconds = parseFloat(timeMatch[3]);
            const currentTime = hours * 3600 + minutes * 60 + seconds;

            if (currentTime >= 0 && currentTime <= totalDuration * 1.1) {
              const rawProgress = Math.min(currentTime / totalDuration, 1) * 100;
              const progress = Math.round(Math.max(rawProgress, lastProgress));

              if (progress > lastProgress) {
                const now = Date.now();

                let remainingTimeStr: string | undefined;
                if (progress > 10 && progress < 100) {
                  const elapsedTime = (now - startTime) / 1000;
                  const estimatedTotalTime = elapsedTime / (progress / 100);
                  const remainingSeconds = estimatedTotalTime - elapsedTime;

                  if (remainingSeconds > 0) {
                    remainingTimeStr = formatRemainingTime(remainingSeconds);
                  }
                }

                lastProgress = progress;
                lastProgressTime = now;

                const stepText = progress >= 95
                  ? '即将完成...'
                  : `正在压缩视频... ${progress}%`;

                onProgress?.(progress, stepText, remainingTimeStr);
                return; // 成功处理，退出
              }
            }
          }
        }

        // 如果time=无效或不存在，使用frame=信息
        if (totalDuration > 0 && currentFrame > 0) {
          const assumedFps = metadata?.video?.frameRate || 30;
          const estimatedCurrentTime = currentFrame / assumedFps;

          const rawProgress = Math.min(estimatedCurrentTime / totalDuration, 1) * 100;
          const progress = Math.round(Math.max(rawProgress, lastProgress));

          if (progress > lastProgress) {
            const now = Date.now();

            let remainingTimeStr: string | undefined;
            if (progress > 10 && progress < 100) {
              const elapsedTime = (now - startTime) / 1000;
              const estimatedTotalTime = elapsedTime / (progress / 100);
              const remainingSeconds = estimatedTotalTime - elapsedTime;

              if (remainingSeconds > 0) {
                remainingTimeStr = formatRemainingTime(remainingSeconds);
              }
            }

            lastProgress = progress;
            lastProgressTime = now;

            const stepText = progress >= 95
              ? '即将完成...' 
              : `正在压缩视频... ${progress}% (基于帧数 ${currentFrame})`;

            onProgress?.(progress, stepText, remainingTimeStr);
          }
        }

        // 即使无法计算准确进度，也要推进一点，避免卡住
        else if (currentFrame === 0 && lastProgress === 10) {
          // 检测到开始处理的第一帧，给个小进度
          onProgress?.(12, '正在处理第一帧...', undefined);
          lastProgress = 12;
        }
      }
    }

    // 兜底方案：如果长时间没有进度更新，使用时间推算
    const now = Date.now();
    if (now - lastProgressTime > 5000 && lastProgress < 90) { // 5秒没更新且未接近完成
      const simpleProgress = Math.min(lastProgress + 1, 85); // 缓慢推进
      if (simpleProgress > lastProgress) {
        lastProgress = simpleProgress;
        lastProgressTime = now;
        onProgress?.(simpleProgress, '正在处理中...', undefined);
        console.log(`Fallback progress: ${simpleProgress}%`);
      }
    }
  };
  
  // 临时添加进度监听器
  ffmpeg.on('log', progressListener);
  
  try {
    const threadArgs = isMultiThread ? ['-threads', '0'] : [];
    
    const args = [
      '-y',                    // 覆盖输出文件
      '-nostdin',              // 不等待用户输入
      '-loglevel', 'info',     // 详细日志级别
      '-stats',                // 强制统计输出
      '-i', inputFileName,
      ...threadArgs,
      ...ffmpegParams.video,
      ...ffmpegParams.audio,
      outputFileName
    ];
    
    console.log('FFmpeg command:', args.join(' '));
    
    await ffmpeg.exec(args);
    
    // 读取输出文件
    const data = await ffmpeg.readFile(outputFileName);
    
    return new Blob([data], {
      type: VIDEO_FORMATS[outputFormat].mime
    });
  } finally {
    // 移除进度监听器
    ffmpeg.off('log', progressListener);
    
    // 清理文件
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (deleteError) {
      console.log('Failed to cleanup files:', deleteError);
    }
  }
};

// 格式化剩余时间（从 audioConverter.ts 移植）
export const formatRemainingTime = (seconds: number): string => {
  if (seconds < 60) {
    return `剩余约 ${Math.round(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    if (remainingSeconds === 0) {
      return `剩余约 ${minutes}分钟`;
    }
    return `剩余约 ${minutes}分${remainingSeconds}秒`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    if (minutes === 0) {
      return `剩余约 ${hours}小时`;
    }
    return `剩余约 ${hours}小时${minutes}分`;
  }
};

// 格式化预估时间
export const formatEstimatedTime = (minutes: number): string => {
  if (minutes < 1) {
    return '约30秒';
  } else if (minutes < 60) {
    return `约${Math.round(minutes)}分钟`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return `约${hours}小时${remainingMinutes}分钟`;
  }
}; 