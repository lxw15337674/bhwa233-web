import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// 音频格式配置
export const AUDIO_FORMATS = {
    mp3: { label: 'MP3', ext: 'mp3', mime: 'audio/mpeg' },
    aac: { label: 'AAC', ext: 'aac', mime: 'audio/aac' },
    wav: { label: 'WAV', ext: 'wav', mime: 'audio/wav' },
    ogg: { label: 'OGG', ext: 'ogg', mime: 'audio/ogg' },
    m4a: { label: 'M4A', ext: 'm4a', mime: 'audio/mp4' },
} as const;

// 音频质量模式配置
export const QUALITY_MODES = {
    original: {
        label: '原质量',
        description: '保持原始音频质量',
        icon: '🎵',
        params: {
            mp3: ['-b:a', '320k'],
            aac: ['-b:a', '256k'],
            wav: ['-c:a', 'pcm_s16le'],
            ogg: ['-q:a', '8'],
            m4a: ['-b:a', '256k'],
        }
    },
    compressed: {
        label: '压缩模式',
        description: '减小文件大小，适合分享传输',
        icon: '📦',
        params: {
            mp3: ['-b:a', '128k'],
            aac: ['-b:a', '96k'],
            wav: ['-c:a', 'pcm_s16le'],
            ogg: ['-q:a', '3'],
            m4a: ['-b:a', '128k'],
        }
    }
} as const;

// 支持的视频格式
export const SUPPORTED_VIDEO_FORMATS = [
    'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'ts'
];

// 支持的音频格式
export const SUPPORTED_AUDIO_FORMATS = [
    'mp3', 'aac', 'wav', 'ogg', 'm4a', 'flac', 'wma', 'opus', 'aiff', 'ape', 'ac3', 'amr'
];

// 类型定义
export interface AudioInfo {
    duration: number;
    bitrate: number;
    sampleRate: number;
    channels: number;
    codec: string;
    format: string;
}

export interface VideoInfo {
    codec: string;
    width: number;
    height: number;
    frameRate: number;
    bitrate: number;
    pixelFormat: string;
    duration: number;
}

export interface MediaMetadata {
    // 媒体类型标识
    mediaType: 'video' | 'audio';

    // 文件信息
    fileName: string;
    fileSize: number;
    container: string;
    totalDuration: number;
    overallBitrate: number;

    // 音频流信息（必须）
    audio: {
        codec: string;
        bitrate: number;
        sampleRate: number;
        channels: number;
        channelLayout: string;
        duration: number;
    };

    // 视频流信息（仅视频文件有）
    video?: {
        codec: string;
        width: number;
        height: number;
        frameRate: number;
        bitrate: number;
        pixelFormat: string;
        duration: number;
    };
}

export interface ConversionState {
    isConverting: boolean;
    progress: number;
    currentStep: string;
    error: string | null;
    outputFile: Blob | null;
    outputFileName: string;
    remainingTime: string | null;
}

export interface SizeEstimate {
    estimatedSizeMB: number;
    compressionRatio: number;
    note: string | null;
}

export type AudioFormat = keyof typeof AUDIO_FORMATS;
export type QualityMode = keyof typeof QUALITY_MODES;

// 音频流兼容性检查
export const AUDIO_COPY_COMPATIBILITY = {
    'AAC': {
        'm4a': true,  // AAC可以直接放入M4A容器
        'aac': true,  // 提取纯AAC流
        'mp3': false, // 需要转码
        'wav': false, // 需要转PCM
        'ogg': false  // 需要转码
    },
    'MP3': {
        'mp3': true,  // 直接复制
        'm4a': false, // MP3不能放入M4A
        'aac': false,
        'wav': false,
        'ogg': false
    },
    'OPUS': {
        'ogg': true,  // Opus原生支持OGG
        'mp3': false,
        'aac': false,
        'wav': false,
        'm4a': false
    },
    'VORBIS': {
        'ogg': true,  // Vorbis原生支持OGG
        'mp3': false,
        'aac': false,
        'wav': false,
        'm4a': false
    },
    'PCM_S16LE': {
        'wav': true,  // PCM原生支持WAV
        'mp3': false,
        'aac': false,
        'ogg': false,
        'm4a': false
    }
} as const;

// 检查音频流是否可以直接复制
export const canCopyAudioStream = (originalCodec: string, targetFormat: AudioFormat): boolean => {
    const codecUpper = originalCodec.toUpperCase();
    const compatibility = AUDIO_COPY_COMPATIBILITY[codecUpper as keyof typeof AUDIO_COPY_COMPATIBILITY];
    return compatibility?.[targetFormat] || false;
};

// 生成智能音频编码参数
export const generateSmartAudioParams = (
    audioInfo: AudioInfo | null,
    originalCodec: string,
    targetFormat: AudioFormat,
    qualityMode: QualityMode
): { params: string[], description: string } => {
    // 原质量模式：严格保持原始质量
    if (qualityMode === 'original') {
        // 首先检查是否可以直接复制音频流
        if (audioInfo && canCopyAudioStream(originalCodec, targetFormat)) {
            return {
                params: ['-c:a', 'copy'],
                description: '保持原始质量（直接复制音频流）'
            };
        }

        // 无法复制音频流时，严格保持原始码率进行重新编码
        if (audioInfo?.bitrate && targetFormat !== 'wav') {
            const originalBitrate = audioInfo.bitrate;

            if (targetFormat === 'ogg') {
                // OGG使用质量等级，根据原始码率选择对应的质量等级
                const quality = originalBitrate >= 256 ? 8 :
                    originalBitrate >= 192 ? 6 :
                        originalBitrate >= 128 ? 4 :
                            originalBitrate >= 96 ? 3 :
                                originalBitrate >= 64 ? 2 : 1;

                return {
                    params: ['-q:a', quality.toString()],
                    description: `保持原始 ${originalBitrate}kbps（OGG质量等级${quality}）`
                };
            } else {
                // 其他格式直接使用原始码率
                return {
                    params: ['-b:a', `${originalBitrate}k`],
                    description: `保持原始 ${originalBitrate}kbps`
                };
            }
        }
    }

    // 压缩模式：使用智能优化
    if (qualityMode === 'compressed' && audioInfo?.bitrate) {
        const originalBitrate = audioInfo.bitrate;

        // 为不同格式设置合理的质量门槛
        const qualityThresholds = {
            mp3: { min: 128, max: 320 },
            aac: { min: 96, max: 256 },
            m4a: { min: 96, max: 256 },
            ogg: { min: 96, max: 256 },
            wav: { min: 0, max: 0 } // WAV是无损格式
        };

        const threshold = qualityThresholds[targetFormat];

        if (targetFormat !== 'wav' && originalBitrate > 0) {
            // 智能码率选择：避免无意义的升频
            let targetBitrate: number;

            if (originalBitrate >= threshold.min) {
                // 原始码率足够高，可以适度压缩
                targetBitrate = Math.min(originalBitrate, threshold.max);
                // 如果原始码率很高，可以压缩到合理范围
                if (originalBitrate > 192) {
                    targetBitrate = 192; // 压缩到192kbps
                }
            } else {
                // 原始码率较低，保持原始码率（避免虚假提升）
                targetBitrate = originalBitrate;
            }

            if (targetFormat === 'ogg') {
                // OGG使用质量等级
                const quality = targetBitrate >= 256 ? 8 :
                    targetBitrate >= 192 ? 6 :
                        targetBitrate >= 128 ? 4 :
                            targetBitrate >= 96 ? 3 :
                                targetBitrate >= 64 ? 2 : 1;

                const action = originalBitrate > targetBitrate ? '压缩为' : '保持为';

                return {
                    params: ['-q:a', quality.toString()],
                    description: `${action}质量等级${quality}（约${targetBitrate}kbps）`
                };
            } else {
                const action = originalBitrate > targetBitrate ? '压缩为' : '保持为';

                return {
                    params: ['-b:a', `${targetBitrate}k`],
                    description: `${action}${targetBitrate}kbps`
                };
            }
        }
    }

    // 使用默认参数（fallback）
    const qualityConfig = QUALITY_MODES[qualityMode];
    const baseParams = qualityConfig.params[targetFormat];
    let description = `${qualityConfig.label} - ${qualityConfig.description}`;

    // 为压缩模式添加具体信息
    if (qualityMode === 'compressed') {
        const compressedBitrates = {
            mp3: '128kbps',
            aac: '96kbps',
            m4a: '128kbps',
            ogg: '约128kbps',
            wav: '16位PCM'
        };
        description = `压缩模式 - ${compressedBitrates[targetFormat]}`;
    }

    return {
        params: [...baseParams],
        description
    };
};

// 工具函数
export const formatFileSize = (sizeMB: number) => {
    if (sizeMB >= 1) {
        return `${sizeMB.toFixed(1)} MB`;
    } else {
        return `${(sizeMB * 1024).toFixed(0)} KB`;
    }
};

export const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || 'unknown';
};

export const isValidVideoFile = (filename: string) => {
    const extension = getFileExtension(filename);
    return SUPPORTED_VIDEO_FORMATS.includes(extension);
};

export const isValidAudioFile = (filename: string) => {
    const extension = getFileExtension(filename);
    return SUPPORTED_AUDIO_FORMATS.includes(extension);
};

export const isValidMediaFile = (filename: string) => {
    return isValidVideoFile(filename) || isValidAudioFile(filename);
};

export const getMediaType = (filename: string): 'video' | 'audio' | 'unknown' => {
    if (isValidVideoFile(filename)) return 'video';
    if (isValidAudioFile(filename)) return 'audio';
    return 'unknown';
};

export const checkMultiThreadSupport = () => {
    return typeof SharedArrayBuffer !== 'undefined';
};

// 格式化剩余时间
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

// 格式化时长
export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
};

// 格式化分辨率
export const formatResolution = (width: number, height: number): string => {
    if (width === 0 || height === 0) return '未知';

    // 常见分辨率标识
    const commonResolutions: { [key: string]: string } = {
        '1920x1080': '1080p (1920x1080)',
        '1280x720': '720p (1280x720)',
        '3840x2160': '4K (3840x2160)',
        '2560x1440': '1440p (2560x1440)',
        '854x480': '480p (854x480)',
        '640x360': '360p (640x360)'
    };

    const resolution = `${width}x${height}`;
    return commonResolutions[resolution] || resolution;
};

// 格式化声道布局
export const formatChannelLayout = (channels: number, layout: string): string => {
    if (layout && layout !== '') return layout;

    switch (channels) {
        case 1: return '单声道';
        case 2: return '立体声';
        case 6: return '5.1 环绕声';
        case 8: return '7.1 环绕声';
        default: return `${channels} 声道`;
    }
};

// FFmpeg 初始化
export const initializeFFmpeg = async () => {
    const ffmpeg = new FFmpeg();

    // 基础日志监听器
    ffmpeg.on('log', ({ message }: { message: string }) => {
        console.log('FFmpeg log:', message);
    });

    const supportsMultiThread = checkMultiThreadSupport();
    const coreVersion = supportsMultiThread ? 'core-mt' : 'core';
    const baseURL = `https://unpkg.com/@ffmpeg/${coreVersion}@0.12.10/dist/umd`;

    console.log(`使用 FFmpeg ${supportsMultiThread ? '多线程' : '单线程'} 版本: ${baseURL}`);

    const [coreURL, wasmURL, workerURL] = await Promise.all([
        toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
    ]);

    await ffmpeg.load({
        coreURL,
        wasmURL,
        workerURL,
    });

    console.log('FFmpeg loaded successfully!');
    return { ffmpeg, isMultiThread: supportsMultiThread };
};

// 音频信息解析
export const parseAudioInfo = (message: string, audioInfo: Partial<AudioInfo>) => {
    // 排除不需要的输出段落
    const isExcludedSection = message.includes('Output #0') ||
        message.includes('Stream mapping:') ||
        message.includes('frame=') ||
        message.includes('size=N/A time=') ||
        message.includes('-> #0:');

    if (isExcludedSection) return;

    // 解析时长
    if (message.includes('Duration:')) {
        const durationMatch = message.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
        if (durationMatch) {
            const hours = parseInt(durationMatch[1]);
            const minutes = parseInt(durationMatch[2]);
            const seconds = parseFloat(durationMatch[3]);
            audioInfo.duration = hours * 3600 + minutes * 60 + seconds;
        }
    }

    // 解析码率
    if (message.includes('bitrate:')) {
        const bitrateMatch = message.match(/bitrate:\s*(\d+)\s*kb\/s/);
        if (bitrateMatch) {
            audioInfo.bitrate = parseInt(bitrateMatch[1]);
        }
    }

    // 解析音频流信息
    if (message.includes('Stream #0:') && message.includes('Audio:')) {
        // 解析编码格式
        const codecMatch = message.match(/Audio:\s*([^,\s\(]+)/);
        if (codecMatch) {
            audioInfo.codec = codecMatch[1].trim();
        }

        // 解析采样率
        const sampleRateMatch = message.match(/(\d+)\s*Hz/);
        if (sampleRateMatch) {
            audioInfo.sampleRate = parseInt(sampleRateMatch[1]);
        }

        // 解析声道数
        if (message.includes('mono')) {
            audioInfo.channels = 1;
        } else if (message.includes('stereo')) {
            audioInfo.channels = 2;
        } else {
            const channelMatch = message.match(/(\d+)\s*channels/);
            if (channelMatch) {
                audioInfo.channels = parseInt(channelMatch[1]);
            }
        }

        // 解析音频流的具体码率
        const audioBitrateMatch = message.match(/(\d+)\s*kb\/s/);
        if (audioBitrateMatch) {
            const streamBitrate = parseInt(audioBitrateMatch[1]);
            if (!audioInfo.bitrate || (streamBitrate > 0 && streamBitrate < 10000)) {
                audioInfo.bitrate = streamBitrate;
            }
        }
    }
};

// 元数据信息解析（优化版本）
export const parseMediaMetadata = (message: string, metadata: Partial<MediaMetadata>) => {
    // 排除不需要的输出段落
    const isExcludedSection = message.includes('Output #0') ||
        message.includes('Stream mapping:') ||
        message.includes('frame=') ||
        message.includes('size=N/A time=') ||
        message.includes('-> #0:');

    if (isExcludedSection) return;

    // 解析时长和总码率
    if (message.includes('Duration:')) {
        const durationMatch = message.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
        if (durationMatch) {
            const hours = parseInt(durationMatch[1]);
            const minutes = parseInt(durationMatch[2]);
            const seconds = parseFloat(durationMatch[3]);
            metadata.totalDuration = hours * 3600 + minutes * 60 + seconds;
        }

        const bitrateMatch = message.match(/bitrate:\s*(\d+)\s*kb\/s/);
        if (bitrateMatch) {
            metadata.overallBitrate = parseInt(bitrateMatch[1]);
        }
    }

    // 解析视频流信息（改进版本）
    if (message.includes('Stream #') && message.includes('Video:')) {
        if (!metadata.video) {
            metadata.video = {
                codec: '',
                width: 0,
                height: 0,
                frameRate: 0,
                bitrate: 0,
                pixelFormat: '',
                duration: 0
            };
        }

        // 解析视频编码
        const videoCodecMatch = message.match(/Video:\s*([^,\s\(]+)/);
        if (videoCodecMatch) {
            metadata.video.codec = videoCodecMatch[1].trim().toUpperCase();
        }

        // 解析像素格式（改进）
        const pixelFormatMatch = message.match(/Video:\s*[^,]+,\s*([^,\s\(]+)/);
        if (pixelFormatMatch) {
            metadata.video.pixelFormat = pixelFormatMatch[1].trim().toUpperCase();
        }

        // 解析分辨率（改进的正则表达式）
        const resolutionMatch = message.match(/(\d+)x(\d+)(?:\s*\[|,|\s)/);
        if (resolutionMatch) {
            metadata.video.width = parseInt(resolutionMatch[1]);
            metadata.video.height = parseInt(resolutionMatch[2]);
        }

        // 解析视频码率（改进）
        const videoBitrateMatch = message.match(/(\d+)\s*kb\/s/);
        if (videoBitrateMatch) {
            const bitrate = parseInt(videoBitrateMatch[1]);
            // 确保这是视频码率而不是总码率
            if (bitrate > 100 && bitrate < 50000) { // 合理的视频码率范围
                metadata.video.bitrate = bitrate;
            }
        }

        // 解析帧率
        const frameRateMatch = message.match(/(\d+(?:\.\d+)?)\s*fps/);
        if (frameRateMatch) {
            metadata.video.frameRate = parseFloat(frameRateMatch[1]);
        }
    }

    // 解析音频流信息（保持原有逻辑）
    if (message.includes('Stream #') && message.includes('Audio:')) {
        if (!metadata.audio) {
            metadata.audio = {
                codec: '',
                bitrate: 0,
                sampleRate: 0,
                channels: 0,
                channelLayout: '',
                duration: 0
            };
        }

        // 解析音频编码
        const audioCodecMatch = message.match(/Audio:\s*([^,\s\(]+)/);
        if (audioCodecMatch) {
            metadata.audio.codec = audioCodecMatch[1].trim().toUpperCase();
        }

        // 解析采样率
        const sampleRateMatch = message.match(/(\d+)\s*Hz/);
        if (sampleRateMatch) {
            metadata.audio.sampleRate = parseInt(sampleRateMatch[1]);
        }

        // 解析声道布局
        if (message.includes('mono')) {
            metadata.audio.channels = 1;
            metadata.audio.channelLayout = '单声道';
        } else if (message.includes('stereo')) {
            metadata.audio.channels = 2;
            metadata.audio.channelLayout = '立体声';
        } else {
            const channelMatch = message.match(/(\d+)\s*channels/);
            if (channelMatch) {
                const channelCount = parseInt(channelMatch[1]);
                metadata.audio.channels = channelCount;
                metadata.audio.channelLayout = formatChannelLayout(channelCount, '');
            }
        }

        // 解析音频码率
        const audioBitrateMatch = message.match(/(\d+)\s*kb\/s/);
        if (audioBitrateMatch) {
            const bitrate = parseInt(audioBitrateMatch[1]);
            // 确保这是合理的音频码率
            if (bitrate > 0 && bitrate < 1000) { // 合理的音频码率范围
                metadata.audio.bitrate = bitrate;
            }
        }
    }
};

// 统一的媒体分析函数（优化版本 - 只读取流头部信息）
export const analyzeMediaFile = async (file: File, ffmpeg: FFmpeg): Promise<{ audioInfo: AudioInfo | null; metadata: MediaMetadata | null }> => {
    const inputExtension = getFileExtension(file.name);
    const inputFileName = `quick_input.${inputExtension}`;

    await ffmpeg.writeFile(inputFileName, await fetchFile(file));

    const audioInfo: Partial<AudioInfo> = {};
    const metadata: Partial<MediaMetadata> = {
        fileName: file.name,
        fileSize: file.size,
        container: '',
        totalDuration: 0,
        overallBitrate: 0,
        audio: {
            codec: '',
            bitrate: 0,
            sampleRate: 0,
            channels: 0,
            channelLayout: '',
            duration: 0
        }
    };

    // 根据文件扩展名直接设置容器格式
    const extension = getFileExtension(file.name);
    const containerMap: { [key: string]: string } = {
        'mp4': 'MP4',
        'mov': 'MOV',
        'mkv': 'MKV',
        'avi': 'AVI',
        'webm': 'WebM',
        'flv': 'FLV',
        '3gp': '3GP',
        'm4v': 'M4V',
        'ts': 'TS',
        'wmv': 'WMV',
        // 音频格式
        'mp3': 'MP3',
        'aac': 'AAC',
        'wav': 'WAV',
        'ogg': 'OGG',
        'm4a': 'M4A',
        'flac': 'FLAC'
    };
    metadata.container = containerMap[extension] || extension.toUpperCase();

    const unifiedListener = ({ message }: { message: string }) => {
    // 解析音频信息
        parseAudioInfo(message, audioInfo);
        // 解析元数据信息
        parseMediaMetadata(message, metadata);
    };

    // 临时替换监听器
    const originalLogHandlers = (ffmpeg as any)._listeners?.log || [];
    ffmpeg.on('log', unifiedListener);

    try {
        // 优化的分析命令：只读取流头部信息，不解码内容
        await Promise.race([
            ffmpeg.exec([
                '-hide_banner',         // 隐藏版本信息
                '-i', inputFileName,    // 输入文件
                '-t', '0.1',           // 处理0.1秒，确保有足够信息被解析
                '-c', 'copy',          // 不重新编码，直接复制流
                '-f', 'null',          // 输出到null，不生成文件
                'pipe:'                // 输出到管道
            ]),
            // 30秒超时机制
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Analysis timeout after 30 seconds')), 30000);
            })
        ]);
    } catch (execError: any) {
        if (execError.message?.includes('timeout')) {
            console.error('Media analysis timed out');
            throw execError;
        }
        // FFmpeg在分析模式下可能会"失败"，但仍然输出信息，这是正常的
        console.log('Media analysis completed (expected behavior)');
    }

    // 移除分析监听器，恢复原有监听器
    ffmpeg.off('log', unifiedListener);

    // 恢复基础日志监听器
    if (originalLogHandlers.length === 0) {
        ffmpeg.on('log', ({ message }: { message: string }) => {
            console.log('FFmpeg log:', message);
        });
    }

    // 清理临时文件
    try {
        await ffmpeg.deleteFile(inputFileName);
    } catch (deleteError) {
        console.log('Failed to delete temp file:', deleteError);
    }

    // 构建音频信息结果
    let resultAudioInfo: AudioInfo | null = null;
    if (audioInfo.duration && audioInfo.duration > 0) {
        resultAudioInfo = {
            duration: audioInfo.duration,
            bitrate: audioInfo.bitrate || 0,
            sampleRate: audioInfo.sampleRate || 44100,
            channels: audioInfo.channels || 2,
            codec: audioInfo.codec || 'unknown',
            format: inputExtension
        };
    }

    // 构建元数据结果
    let resultMetadata: MediaMetadata | null = null;
    if (metadata.totalDuration && metadata.totalDuration > 0 && metadata.audio) {
        // 设置音频时长为总时长（如果没有单独的音频时长）
        if (metadata.audio.duration === 0) {
            metadata.audio.duration = metadata.totalDuration;
        }

        // 设置视频时长为总时长（如果有视频且没有单独的视频时长）
        if (metadata.video && metadata.video.duration === 0) {
            metadata.video.duration = metadata.totalDuration;
        }

        // 根据文件类型设置 mediaType
        const fileMediaType = getMediaType(file.name);
        const mediaType = fileMediaType === 'video' ? 'video' : 'audio';

        resultMetadata = {
            ...metadata,
            mediaType
        } as MediaMetadata;
    }

    return { audioInfo: resultAudioInfo, metadata: resultMetadata };
};

// 音频分析（保留向后兼容性）
export const analyzeAudioInfo = async (file: File, ffmpeg: FFmpeg): Promise<AudioInfo | null> => {
    const result = await analyzeMediaFile(file, ffmpeg);
    return result.audioInfo;
};

// 媒体元数据分析（保留向后兼容性）
export const analyzeMediaMetadata = async (file: File, ffmpeg: FFmpeg): Promise<MediaMetadata | null> => {
    const result = await analyzeMediaFile(file, ffmpeg);
    return result.metadata;
};

// 计算文件大小
export const calculateFileSize = (
    audioInfo: AudioInfo,
    format: AudioFormat,
    quality: QualityMode,
    originalCodec?: string
): SizeEstimate => {
    // WAV格式特殊处理
    if (format === 'wav') {
        const bitDepth = 16;
        const estimatedSizeMB = (audioInfo.sampleRate * bitDepth * audioInfo.channels * audioInfo.duration) / 8 / 1024 / 1024;

        return {
            estimatedSizeMB: Math.max(estimatedSizeMB, 0.1),
            compressionRatio: 0,
            note: '无损格式，基于采样率和时长计算'
        };
    }

    // 使用智能参数生成来获取目标码率
    const smartParams = generateSmartAudioParams(
        audioInfo,
        originalCodec || '',
        format,
        quality
    );

    // 获取目标码率
    let targetBitrate = 192; // 默认值
    let isAudioCopy = false;

    // 检查是否使用音频流复制
    if (smartParams.params.includes('-c:a') && smartParams.params.includes('copy')) {
        isAudioCopy = true;
        targetBitrate = audioInfo.bitrate;
    } else {
        // 从参数中提取码率
        for (let i = 0; i < smartParams.params.length; i++) {
            if (smartParams.params[i] === '-b:a' && i + 1 < smartParams.params.length) {
                const bitrateStr = smartParams.params[i + 1];
                const bitrateMatch = bitrateStr.match(/(\d+)k/);
                if (bitrateMatch) {
                    targetBitrate = parseInt(bitrateMatch[1]);
                }
                break;
            }
        }
    }

    const baseSizeMB = (audioInfo.duration * targetBitrate) / 8 / 1024;
    const containerOverhead = format === 'mp3' ? 1.02 : 1.03;
    const estimatedSizeMB = baseSizeMB * containerOverhead;

    let compressionRatio = 0;
    let note = '';

    if (isAudioCopy) {
        // 音频流复制情况
        note = `${smartParams.description} - 保持原始质量`;
        compressionRatio = 0;
    } else {
    // 重新编码情况
        if (audioInfo.bitrate > 0 && audioInfo.bitrate > targetBitrate) {
            compressionRatio = ((audioInfo.bitrate - targetBitrate) / audioInfo.bitrate) * 100;
        }
        note = `${smartParams.description} - 目标码率 ${targetBitrate}kbps`;
    }

    return {
        estimatedSizeMB: Math.max(estimatedSizeMB, 0.1),
        compressionRatio: Math.max(compressionRatio, 0),
        note: note
    };
};

// 音频转换
export const convertAudio = async (
    file: File,
    ffmpeg: FFmpeg,
    outputFormat: AudioFormat,
    qualityMode: QualityMode,
    isMultiThread: boolean,
    audioInfo?: AudioInfo | null,
    originalCodec?: string,
    onProgress?: (progress: number, step: string, remainingTime?: string) => void
): Promise<Blob> => {
    const inputExtension = getFileExtension(file.name);
    const inputFileName = `input.${inputExtension}`;
    const outputFileName = `output.${AUDIO_FORMATS[outputFormat].ext}`;

    await ffmpeg.writeFile(inputFileName, await fetchFile(file));

    let totalDuration = 0;
    const startTime = Date.now();
    let lastProgressTime = startTime;
    let lastProgress = 0;

    // 生成智能编码参数
    const smartParams = generateSmartAudioParams(
        audioInfo || null,
        originalCodec || '',
        outputFormat,
        qualityMode
    );

    console.log(`Audio conversion strategy: ${smartParams.description}`);
    console.log(`FFmpeg params: ${smartParams.params.join(' ')}`);

    const progressListener = ({ message }: { message: string }) => {
        // 解析总时长
        if (message.includes('Duration:') && totalDuration === 0) {
            const durationMatch = message.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
            if (durationMatch) {
                const hours = parseInt(durationMatch[1]);
                const minutes = parseInt(durationMatch[2]);
                const seconds = parseFloat(durationMatch[3]);
                totalDuration = hours * 3600 + minutes * 60 + seconds;
            }
        }

        // 解析当前进度
        if (message.includes('time=') && totalDuration > 0) {
            const timeMatch = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
            if (timeMatch) {
                const hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const seconds = parseFloat(timeMatch[3]);
                const currentTime = hours * 3600 + minutes * 60 + seconds; const progress = Math.round(Math.min(currentTime / totalDuration, 1) * 100);
                const now = Date.now();

                // 计算剩余时间 - 直接显示
                let remainingTimeStr: string | undefined;
                if (progress > 0 && progress < 100) {
                    const elapsedTime = (now - startTime) / 1000; // 秒
                    const estimatedTotalTime = elapsedTime / (progress / 100);
                    const remainingSeconds = estimatedTotalTime - elapsedTime;

                    if (remainingSeconds > 0) {
                        remainingTimeStr = formatRemainingTime(remainingSeconds);
                    }
                }

                lastProgress = progress;
                lastProgressTime = now;

                // 根据转换策略显示不同的进度文本
                const isDirectCopy = smartParams.params.includes('copy');
                const stepText = progress >= 95
                    ? '即将完成...'
                    : isDirectCopy
                        ? `正在提取音频... ${progress}%`
                        : `正在转换音频... ${progress}%`;

                onProgress?.(progress, stepText, remainingTimeStr);
            }
        } else if (message.includes('time=') && totalDuration === 0) {
            // 如果无法获取总时长，使用简单的增量进度
            const now = Date.now();
            const simpleProgress = Math.min(lastProgress + 5, 95);
            lastProgress = simpleProgress;
            onProgress?.(simpleProgress, '正在转换音频...');
        }
    };

    // 临时添加进度监听器
    ffmpeg.on('log', progressListener);

    try {
        const threadArgs = isMultiThread ? ['-threads', '0'] : [];

        const args = [
            '-i', inputFileName,
            ...threadArgs,
            ...smartParams.params,
            outputFileName
        ];

        console.log('FFmpeg command:', args.join(' '));

        await ffmpeg.exec(args);

        // 读取输出文件
        const data = await ffmpeg.readFile(outputFileName);

        return new Blob([data], {
            type: AUDIO_FORMATS[outputFormat].mime
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

// 下载文件
export const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};
