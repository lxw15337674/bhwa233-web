import type { FFmpeg } from '@ffmpeg/ffmpeg';

// 音轨信息接口
export interface AudioTrack {
    index: number;          // FFmpeg 音轨索引
    codec: string;          // 编解码器 (aac, mp3, opus...)
    bitrate: number;        // 比特率 (bps)
    sampleRate: number;     // 采样率 (Hz)
    channels: number;       // 声道数
    channelLayout: string;  // 声道布局 (stereo, mono, 5.1...)
    language?: string;      // 语言标签
    isDefault: boolean;     // 是否为默认轨
    duration: number;       // 时长（秒）
}

// 检测结果接口
export interface AudioDetectionResult {
    tracks: AudioTrack[];
    hasAudio: boolean;
}

/**
 * 从视频中检测音轨信息
 */
export async function detectAudioTracks(
    file: File,
    ffmpeg: FFmpeg,
    onProgress?: (progress: number, status: string) => void
): Promise<AudioDetectionResult> {
    const inputFileName = 'input_video';
    const DETECTION_TIMEOUT = 30000; // 30秒超时

    try {
        // 步骤1: 写入文件
        onProgress?.(10, '正在加载文件...');
        const fileData = new Uint8Array(await file.arrayBuffer());
        await ffmpeg.writeFile(inputFileName, fileData);

        onProgress?.(30, '正在分析文件格式...');

        // 步骤2: 收集 FFmpeg 日志
        const logs: string[] = [];
        let logHandler: any = null;
        let detectionComplete = false;

        const collectLogs = new Promise<string>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                if (!detectionComplete) {
                    if (logHandler) ffmpeg.off('log', logHandler);
                    reject(new Error('检测超时，请重试'));
                }
            }, DETECTION_TIMEOUT);

            logHandler = ({ message }: { message: string }) => {
                logs.push(message);

                // 检测到关键信息说明元数据已加载
                if (message.includes('Duration:') || message.includes('Stream #')) {
                    onProgress?.(60, '正在解析音轨信息...');
                }
            };

            ffmpeg.on('log', logHandler);

            // 执行简单的信息查询命令（预期会失败，但会输出元数据）
            ffmpeg.exec(['-i', inputFileName])
                .catch(() => {
                    // 预期会失败，因为没有指定输出
                    // 但这是正常的，我们只需要日志中的元数据
                })
                .finally(() => {
                    // 等待一小段时间确保所有日志都被收集
                    setTimeout(() => {
                        detectionComplete = true;
                        clearTimeout(timeoutId);
                        if (logHandler) ffmpeg.off('log', logHandler);
                        resolve(logs.join('\n'));
                    }, 300);
                });
        });

        const output = await collectLogs;

        onProgress?.(80, '正在整理音轨列表...');

        // 步骤3: 解析音轨信息
        const tracks = parseAudioTracksFromOutput(output);

        // 步骤4: 清理临时文件
        try {
            await ffmpeg.deleteFile(inputFileName);
        } catch (e) {
            console.warn('Failed to delete temp file:', e);
        }

        onProgress?.(100, '检测完成');

        return {
            tracks,
            hasAudio: tracks.length > 0
        };
    } catch (error) {
        // 清理临时文件
        try {
            await ffmpeg.deleteFile(inputFileName);
        } catch (e) {
            // 忽略清理错误
        }

        console.error('Audio detection failed:', error);

        if (error instanceof Error && error.message.includes('超时')) {
            throw error;
        }

        throw new Error('无法检测音频轨道，请检查文件格式');
    }
}

/**
 * 从 FFmpeg 输出中解析音轨信息
 */
function parseAudioTracksFromOutput(output: string): AudioTrack[] {
    const tracks: AudioTrack[] = [];
    const lines = output.split('\n');

    let currentAudioTrackIndex = 0;
    let duration = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // 先匹配时长信息
        // 例如：Duration: 00:02:30.50, start: 0.000000, bitrate: 1234 kb/s
        const durationMatch = line.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (durationMatch) {
            const [, hours, minutes, seconds] = durationMatch;
            duration = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
        }

        // 匹配音频流信息行（更宽松的匹配）
        // 例如：Stream #0:0[0x1](und): Audio: aac (LC) (mp4a / 0x6134706D), 44100 Hz, stereo, fltp, 128 kb/s (default)
        if (line.includes('Audio:')) {
            // 提取流索引
            const streamIndexMatch = line.match(/Stream #\d+:(\d+)/);
            if (!streamIndexMatch) continue;

            // 提取编解码器
            const codecMatch = line.match(/Audio: (\w+)/);
            const codec = codecMatch ? codecMatch[1].toLowerCase() : 'unknown';

            // 提取采样率
            const sampleRateMatch = line.match(/(\d+) Hz/);
            const sampleRate = sampleRateMatch ? parseInt(sampleRateMatch[1]) : 44100;

            // 提取声道布局
            const channelLayoutMatch = line.match(/(\d+) Hz,\s*([^,]+?)(?:,|\s)/);
            let channelLayout = 'stereo';
            let channels = 2;

            if (channelLayoutMatch) {
                channelLayout = channelLayoutMatch[2].trim().toLowerCase();
                // 推断声道数
                if (channelLayout.includes('mono')) channels = 1;
                else if (channelLayout.includes('stereo')) channels = 2;
                else if (channelLayout.includes('5.1')) channels = 6;
                else if (channelLayout.includes('quad')) channels = 4;
            }

            // 提取比特率
            const bitrateMatch = line.match(/(\d+) kb\/s/);
            const bitrate = bitrateMatch ? parseInt(bitrateMatch[1]) * 1000 : 128000;

            // 提取语言标签
            const languageMatch = line.match(/\(([a-z]{2,3})\)/i);
            const language = languageMatch ? languageMatch[1] : undefined;

            // 检查是否为默认轨
            const isDefault = line.includes('(default)');

            tracks.push({
                index: currentAudioTrackIndex,
                codec,
                bitrate,
                sampleRate,
                channels,
                channelLayout,
                language,
                isDefault,
                duration
            });

            currentAudioTrackIndex++;
        }
    }

    return tracks;
}

/**
 * 根据编解码器获取推荐的输出文件扩展名
 */
export function getOutputExtension(codec: string): string {
    const mapping: Record<string, string> = {
        'aac': 'm4a',
        'mp3': 'mp3',
        'opus': 'opus',
        'vorbis': 'ogg',
        'flac': 'flac',
        'ac3': 'ac3',
        'eac3': 'eac3',
        'alac': 'm4a',
        'wmav2': 'wma',
        'pcm_s16le': 'wav',
        'pcm_s24le': 'wav',
    };

    return mapping[codec.toLowerCase()] || 'm4a'; // 默认使用 m4a
}

/**
 * 提取音频轨道
 */
export async function extractAudioTrack(
    file: File,
    ffmpeg: FFmpeg,
    trackIndex: number,
    outputExtension: string,
    onProgress?: (progress: number) => void
): Promise<Blob> {
    const inputFileName = 'input_video';
    const outputFileName = `output.${outputExtension}`;

    try {
        // 写入文件到 FFmpeg 虚拟文件系统
        const fileData = new Uint8Array(await file.arrayBuffer());
        await ffmpeg.writeFile(inputFileName, fileData);

        // 监听进度
        if (onProgress) {
            ffmpeg.on('progress', ({ progress }) => {
                onProgress(Math.round(progress * 100));
            });
        }

        // 执行音频提取（流复制）
        await ffmpeg.exec([
            '-i', inputFileName,
            '-map', `0:a:${trackIndex}`,  // 选择特定音轨
            '-c:a', 'copy',                // 流复制（不重新编码）
            '-vn',                         // 不包含视频
            outputFileName
        ]);

        // 读取输出文件
        const data = await ffmpeg.readFile(outputFileName);
        const blob = new Blob([data], { type: `audio/${outputExtension}` });

        // 清理临时文件
        try {
            await ffmpeg.deleteFile(inputFileName);
            await ffmpeg.deleteFile(outputFileName);
        } catch (e) {
            console.warn('Failed to delete temp files:', e);
        }

        // 移除进度监听器
        if (onProgress) {
            ffmpeg.off('progress', () => { });
        }

        return blob;
    } catch (error) {
        console.error('Audio extraction failed:', error);
        throw new Error('音频提取失败，请重试');
    }
}

/**
 * 格式化声道布局为友好的中文显示
 */
export function formatChannelLayout(channelLayout: string): string {
    const mapping: Record<string, string> = {
        'mono': '单声道',
        'stereo': '立体声',
        '5.1': '5.1 环绕声',
        '5.1(side)': '5.1 环绕声',
        'quad': '四声道',
        '7.1': '7.1 环绕声',
    };

    return mapping[channelLayout.toLowerCase()] || channelLayout;
}

/**
 * 格式化比特率为友好显示
 */
export function formatBitrate(bitrate: number): string {
    if (bitrate >= 1000) {
        return `${Math.round(bitrate / 1000)} kbps`;
    }
    return `${bitrate} bps`;
}

/**
 * 格式化采样率为友好显示
 */
export function formatSampleRate(sampleRate: number): string {
    if (sampleRate >= 1000) {
        return `${(sampleRate / 1000).toFixed(1)} kHz`;
    }
    return `${sampleRate} Hz`;
}

/**
 * 验证视频文件格式
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: '文件过大（超过2GB），无法处理'
        };
    }

    // 检查文件格式
    const supportedFormats = [
        'mp4', 'm4v', 'mkv', 'avi', 'mov',
        'webm', 'flv', 'wmv', 'mpg', 'mpeg',
        '3gp', '3g2', 'ts', 'mts', 'm2ts'
    ];

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedFormats.includes(extension)) {
        return {
            valid: false,
            error: '不支持的文件格式。仅支持：MP4, MKV, AVI, MOV, WebM, FLV, WMV 等'
        };
    }

    return { valid: true };
}

/**
 * 生成输出文件名
 */
export function generateOutputFileName(
    originalFileName: string,
    outputExtension: string,
    trackIndex?: number,
    language?: string
): string {
    // 移除原文件扩展名
    const baseName = originalFileName.replace(/\.[^/.]+$/, '');

    // 如果有多个音轨，添加标识
    let suffix = '';
    if (trackIndex !== undefined && trackIndex > 0) {
        if (language) {
            suffix = `_${language}`;
        } else {
            suffix = `_track${trackIndex + 1}`;
        }
    }

    return `${baseName}${suffix}.${outputExtension}`;
}
