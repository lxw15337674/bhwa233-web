import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { MediaMetadata, formatFileSize, formatDuration } from './audioConverter';
import { safeCleanupFiles, createFFmpegProgressListener } from './ffmpeg-helpers';

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

  // 获取FFmpeg参数
  const ffmpegParams = getVideoCompressionParams(
    outputFormat,
    resolution,
    metadata?.video?.width,
    metadata?.video?.height
  );

  console.log(`Video compression strategy: ${ffmpegParams.description}`);
  console.log(`FFmpeg params: ${[...ffmpegParams.video, ...ffmpegParams.audio].join(' ')}`);

  const progressListener = createFFmpegProgressListener(onProgress, 'video');

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
    await safeCleanupFiles(ffmpeg, [inputFileName, outputFileName]);
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