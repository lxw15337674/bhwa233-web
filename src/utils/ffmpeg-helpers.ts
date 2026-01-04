import { FFmpeg } from "@ffmpeg/ffmpeg";

/**
 * 安全清理 FFmpeg 虚拟文件系统中的文件。
 * 尝试读取文件以确认其存在，然后删除。
 * @param ffmpeg FFmpeg 实例
 * @param fileNames 要清理的文件名数组
 */
export const safeCleanupFiles = async (ffmpeg: FFmpeg, fileNames: string[]): Promise<void> => {
    for (const fileName of fileNames) {
        try {
            // 尝试读取文件以确认其存在
            try {
                await ffmpeg.readFile(fileName);
                // 如果读取成功，文件存在，可以删除
                await ffmpeg.deleteFile(fileName);
                console.log(`Successfully cleaned up: ${fileName}`);
            } catch (readError) {
                // 文件不存在或无法读取，忽略错误
                console.log(`File ${fileName} not found or already cleaned up, skipping deletion.`);
            }
        } catch (deleteError) {
            // 删除失败，记录但不抛出错误
            console.warn(`Failed to delete file ${fileName}:`, deleteError);
        }
    }
};

/**
 * 格式化剩余时间为易读的字符串。
 * @param seconds 剩余秒数
 * @param t 翻译函数
 * @returns 格式化后的字符串
 */
export const formatRemainingTime = (seconds: number, t?: (key: string, values?: any) => string): string => {
    if (seconds < 60) {
        const sec = Math.round(seconds);
        return t ? t('common.progress.remainingSeconds', { seconds: sec }) : `剩余约 ${sec}秒`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.round(seconds % 60);
        if (remainingSeconds === 0) {
            return t ? t('common.progress.remainingMinutes', { minutes }) : `剩余约 ${minutes}分钟`;
        }
        return t ? t('common.progress.remainingMinutesSeconds', { minutes, seconds: remainingSeconds }) : `剩余约 ${minutes}分${remainingSeconds}秒`;
    } else {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.round((seconds % 3600) / 60);
        if (minutes === 0) {
            return t ? t('common.progress.remainingHours', { hours }) : `剩余约 ${hours}小时`;
        }
        return t ? t('common.progress.remainingHoursMinutes', { hours, minutes }) : `剩余约 ${hours}小时${minutes}分`;
    }
};

/**
 * 创建一个 FFmpeg 进度监听器。
 * @param onProgress 进度更新回调函数
 * @param mediaType 媒体类型 ('audio' 或 'video')，用于定制进度文本
 * @param t 翻译函数
 * @returns 进度监听器函数
 */
export const createFFmpegProgressListener = (
    onProgress?: (progress: number, step: string, remainingTime?: string) => void,
    mediaType: 'audio' | 'video' = 'audio',
    t?: (key: string, values?: any) => string
) => {
    let totalDuration = 0;
    const startTime = Date.now();
    let lastProgress = 0;
    let lastProgressTime = startTime; // 用于视频压缩中的兜底方案

    return ({ message }: { message: string }) => {
        // 解析总时长
        if (message.includes('Duration:') && totalDuration === 0) {
            const durationMatch = message.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
            if (durationMatch) {
                const hours = parseInt(durationMatch[1]);
                const minutes = parseInt(durationMatch[2]);
                const seconds = parseFloat(durationMatch[3]);
                totalDuration = hours * 3600 + minutes * 60 + seconds;
                if (mediaType === 'video') {
                    onProgress?.(2, t ? t('common.progress.initializing') : '正在初始化编码器...', undefined); // 视频特有
                }
            }
        }

        // 解析当前进度 (time=)
        if (message.includes('time=') && totalDuration > 0) {
            const timeMatch = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
            if (timeMatch) {
                const hours = parseInt(timeMatch[1]);
                const minutes = parseInt(timeMatch[2]);
                const seconds = parseFloat(timeMatch[3]);
                const currentTime = hours * 3600 + minutes * 60 + seconds;

                // 视频处理中可能出现 time=-xxxx.xx 负值的情况，记录但跳过此次更新
                if (currentTime < 0) {
                    console.warn('[FFmpeg Progress] Negative time value detected, skipping:', currentTime);
                    return;
                }

                // 进度可能超过 100% 稍微，限制在 100
                const rawProgress = Math.min(currentTime / totalDuration, 1) * 100;
                const progress = Math.round(Math.max(rawProgress, lastProgress)); // 确保进度不倒退

                if (progress > lastProgress || (progress === 100 && lastProgress < 100)) { // 仅在有实际进展时更新
                    const now = Date.now();
                    let remainingTimeStr: string | undefined;

                    if (progress > 0 && progress < 100) {
                        const elapsedTime = (now - startTime) / 1000; // 秒
                        const estimatedTotalTime = elapsedTime / (progress / 100);
                        const remainingSeconds = estimatedTotalTime - elapsedTime;

                        if (remainingSeconds > 0) {
                            remainingTimeStr = formatRemainingTime(remainingSeconds, t);
                        }
                    }

                    lastProgress = progress;
                    lastProgressTime = now;

                    let stepText = '';
                    if (progress >= 95) {
                        stepText = t ? t('common.progress.finishing') : '即将完成...';
                    } else {
                        const baseText = mediaType === 'audio' 
                            ? (t ? t('common.progress.convertingAudio') : '正在转换音频...')
                            : (t ? t('common.progress.compressingVideo') : '正在压缩视频...');
                        stepText = `${baseText} ${progress}%`;
                    }
                    onProgress?.(progress, stepText, remainingTimeStr);
                }
            }
        } else if (message.includes('time=') && totalDuration === 0) {
            // 兜底方案：如果无法获取总时长，使用简单的增量进度
            // 这种情况下，剩余时间无法准确估计
            const now = Date.now();
            if (now - lastProgressTime > 2000) { // 每2秒推进一次，避免过于频繁
                const simpleProgress = Math.min(lastProgress + 5, 90); // 最多到90%
                if (simpleProgress > lastProgress) {
                    lastProgress = simpleProgress;
                    lastProgressTime = now;
                    const baseText = mediaType === 'audio'
                        ? (t ? t('common.progress.convertingAudio') : '正在转换音频...')
                        : (t ? t('common.progress.processingGeneric') : '正在处理中...');
                    onProgress?.(simpleProgress, baseText);
                }
            }
        }

        // 视频特有的一些阶段性信息
        if (mediaType === 'video') {
            if (message.includes('libx264') || message.includes('libvpx')) {
                if (lastProgress < 5) {
                    onProgress?.(5, t ? t('common.progress.configuring') : '正在配置编码器...', undefined);
                    lastProgress = 5;
                }
            } else if (message.includes('Output #0') || message.includes('Stream #0:')) {
                if (lastProgress < 8) {
                    onProgress?.(8, t ? t('common.progress.settingOutput') : '正在设置输出流...', undefined);
                    lastProgress = 8;
                }
            } else if (message.includes('Press [q] to stop') || (message.includes('frame=') && lastProgress < 10)) {
                if (lastProgress < 10) {
                    onProgress?.(10, t ? t('common.progress.processing') : '开始处理视频...', undefined);
                    lastProgress = 10;
                }
            }

            // 对于GIF或其他没有标准时间进度的格式，尝试从frame数量推算
            if (message.includes('frame=') && !message.includes('time=')) {
                const frameMatch = message.match(/frame=\s*(\d+)/);
                if (frameMatch && totalDuration > 0) {
                    const frameNum = parseInt(frameMatch[1]);
                    if (frameNum > 0) {
                        console.log('[FFmpeg] Processing frame:', frameNum);
                    }
                }
            }
        }
    };
};
