'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// 音频格式配置
const AUDIO_FORMATS = {
    mp3: { label: 'MP3', ext: 'mp3', mime: 'audio/mpeg' },
    aac: { label: 'AAC', ext: 'aac', mime: 'audio/aac' },
    wav: { label: 'WAV', ext: 'wav', mime: 'audio/wav' },
    ogg: { label: 'OGG', ext: 'ogg', mime: 'audio/ogg' },
    m4a: { label: 'M4A', ext: 'm4a', mime: 'audio/mp4' },
};

// 音频质量模式配置
const QUALITY_MODES = {
    high: {
        label: '高质量',
        description: '320kbps - 文件较大，音质最佳',
        icon: '🎵',
        params: {
            mp3: ['-b:a', '320k'],
            aac: ['-b:a', '256k'],
            wav: ['-c:a', 'pcm_s16le'], // WAV无损，不受质量影响
            ogg: ['-q:a', '8'],
            m4a: ['-b:a', '256k'],
        }
    },
    standard: {
        label: '标准质量',
        description: '192kbps - 平衡音质与大小',
        icon: '⚖️',
        params: {
            mp3: ['-b:a', '192k'],
            aac: ['-b:a', '192k'],
            wav: ['-c:a', 'pcm_s16le'],
            ogg: ['-q:a', '5'],
            m4a: ['-b:a', '192k'],
        }
    },
    compressed: {
        label: '压缩模式',
        description: '128kbps - 文件较小，音质可接受',
        icon: '📦',
        params: {
            mp3: ['-b:a', '128k'],
            aac: ['-b:a', '128k'],
            wav: ['-c:a', 'pcm_s16le'],
            ogg: ['-q:a', '3'],
            m4a: ['-b:a', '128k'],
        }
    }
};

// 支持的视频格式
const SUPPORTED_VIDEO_FORMATS = [
    'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', 'm4v', '3gp', 'ts'
];

interface ConversionState {
    isConverting: boolean;
    progress: number;
    currentStep: string;
    error: string | null;
    outputFile: Blob | null;
    outputFileName: string;
}

interface AudioInfo {
    duration: number; // 音频时长（秒）
    bitrate: number; // 原始码率（kbps）
    sampleRate: number; // 采样率（Hz）
    channels: number; // 声道数
    codec: string; // 音频编码
    format: string; // 容器格式
}

interface SizeEstimate {
    estimatedSizeMB: number;
    compressionRatio: number;
    note: string | null;
}

const AudioConverterView = () => {
    // 状态管理
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [outputFormat, setOutputFormat] = useState<keyof typeof AUDIO_FORMATS>('mp3');
    const [qualityMode, setQualityMode] = useState<keyof typeof QUALITY_MODES>('standard');
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [ffmpegLoading, setFfmpegLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMultiThread, setIsMultiThread] = useState(false);

    // 音频信息相关状态
    const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analyzeError, setAnalyzeError] = useState<string | null>(null);

    const [conversionState, setConversionState] = useState<ConversionState>({
        isConverting: false,
        progress: 0,
        currentStep: '',
        error: null,
        outputFile: null,
        outputFileName: '',
    });

    // Refs
    const ffmpegRef = useRef<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messageRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // 格式化文件大小显示
    const formatFileSize = useCallback((sizeMB: number) => {
        if (sizeMB >= 1) {
            return `${sizeMB.toFixed(1)} MB`;
        } else {
            return `${(sizeMB * 1024).toFixed(0)} KB`;
        }
    }, []);

    // FFmpeg 初始化
    const initFFmpeg = useCallback(async () => {
        if (ffmpegLoaded || ffmpegLoading) return;

        setFfmpegLoading(true);

        try {
            console.log('Starting FFmpeg initialization...');

            const ffmpeg = new FFmpeg();
            ffmpegRef.current = ffmpeg;

            // 基础日志监听器（仅用于调试，转换时会使用专门的进度监听器）
            ffmpeg.on('log', ({ message }: { message: string }) => {
                console.log('FFmpeg log:', message);
            });

            console.log('Loading FFmpeg with Blob URLs...');

            // 动态选择 FFmpeg 版本（多线程 vs 单线程）
            const supportsMultiThread = checkMultiThreadSupport();
            const coreVersion = supportsMultiThread ? 'core-mt' : 'core';
            const baseURL = `https://unpkg.com/@ffmpeg/${coreVersion}@0.12.10/dist/umd`;

            console.log(`使用 FFmpeg ${supportsMultiThread ? '多线程' : '单线程'} 版本: ${baseURL}`);

            const [coreURL, wasmURL, workerURL] = await Promise.all([
                toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
            ]);

            console.log('Core URL:', coreURL);
            console.log('WASM URL:', wasmURL);
            console.log('Worker URL:', workerURL);

            await ffmpeg.load({
                coreURL,
                wasmURL,
                workerURL,
            });

            console.log('FFmpeg loaded successfully!');

            setFfmpegLoaded(true);
            // 移除这里的自动分析逻辑，统一由 useEffect 处理

        } catch (error) {
            console.error('FFmpeg 加载失败:', error);

            let errorMessage = `FFmpeg 加载失败: ${error instanceof Error ? error.message : '未知错误'}`;

            // 添加常见问题的解决建议
            if (error instanceof Error) {
                if (error.message.includes('SharedArrayBuffer')) {
                    errorMessage += '\n\n💡 多线程模式需要特殊配置：\n• 请确保服务器配置了正确的 HTTP 头\n• 尝试刷新页面重试\n• 系统会自动降级到单线程模式';
                } else if (error.message.includes('Network')) {
                    errorMessage += '\n\n💡 解决建议：\n• 检查网络连接\n• 尝试刷新页面\n• 如果使用VPN，请尝试关闭后重试';
                } else if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
                    errorMessage += '\n\n💡 这可能是浏览器跨域限制导致的，请尝试：\n• 刷新页面重试\n• 使用现代浏览器（Chrome、Firefox、Safari）\n• 检查浏览器是否阻止了跨域请求';
                } else if (error.message.includes('timeout') || error.message.includes('load')) {
                    errorMessage += '\n\n💡 加载超时，请尝试：\n• 刷新页面重试\n• 检查网络连接稳定性\n• 使用更快的网络环境';
                }
            }

            setConversionState(prev => ({
                ...prev,
                error: errorMessage
            }));
        } finally {
            setFfmpegLoading(false);
        }
    }, [ffmpegLoaded, ffmpegLoading]);

    // FFmpeg解析音频信息
    const analyzeAudioInfo = useCallback(async (file: File): Promise<AudioInfo | null> => {
        if (!ffmpegRef.current || !ffmpegLoaded) {
            console.log('FFmpeg not loaded, skipping audio analysis');
            return null;
        }

        setIsAnalyzing(true);
        setAnalyzeError(null);

        const inputExtension = file.name.split('.').pop()?.toLowerCase() || 'unknown';

        try {
            const ffmpeg = ffmpegRef.current;
            const inputFileName = `analyze_input.${inputExtension}`;

            console.log('Starting audio analysis...');

            // 写入文件到FFmpeg虚拟文件系统
            await ffmpeg.writeFile(inputFileName, await fetchFile(file));

            let audioInfo: Partial<AudioInfo> = {};

            // 创建临时监听器解析音频信息
            const analyzeListener = ({ message }: { message: string }) => {
                console.log('Analysis log:', message);

                // 明确排除不需要的输出段落
                const isExcludedSection = message.includes('Output #0') ||
                    message.includes('Stream mapping:') ||
                    message.includes('frame=') ||
                    message.includes('size=N/A time=') ||
                    message.includes('-> #0:');

                // 只在非排除段落中解析信息
                if (!isExcludedSection) {
                    // 解析时长 - 只从输入信息中获取
                    if (message.includes('Duration:')) {
                        const durationMatch = message.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
                        if (durationMatch) {
                            const hours = parseInt(durationMatch[1]);
                            const minutes = parseInt(durationMatch[2]);
                            const seconds = parseFloat(durationMatch[3]);
                            audioInfo.duration = hours * 3600 + minutes * 60 + seconds;
                            console.log('Found duration:', audioInfo.duration);
                        }
                    }

                    // 解析码率 - 只从输入信息中获取
                    if (message.includes('bitrate:')) {
                        const bitrateMatch = message.match(/bitrate:\s*(\d+)\s*kb\/s/);
                        if (bitrateMatch) {
                            audioInfo.bitrate = parseInt(bitrateMatch[1]);
                            console.log('Found bitrate:', audioInfo.bitrate);
                        }
                    }

                    // 解析音频流信息 - 更精确地匹配输入音频流
                    if (message.includes('Stream #0:') && message.includes('Audio:')) {
                        console.log('Parsing audio stream:', message);

                        // 解析编码格式 - 获取原始音频编码，不是转换后的
                        const codecMatch = message.match(/Audio:\s*([^,\s\(]+)/);
                        if (codecMatch) {
                            audioInfo.codec = codecMatch[1].trim();
                            console.log('Found codec:', audioInfo.codec);
                        }

                        // 解析采样率
                        const sampleRateMatch = message.match(/(\d+)\s*Hz/);
                        if (sampleRateMatch) {
                            audioInfo.sampleRate = parseInt(sampleRateMatch[1]);
                            console.log('Found sample rate:', audioInfo.sampleRate);
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
                        console.log('Found channels:', audioInfo.channels);

                        // 解析音频流的具体码率（如果有的话）
                        const audioBitrateMatch = message.match(/(\d+)\s*kb\/s/);
                        if (audioBitrateMatch) {
                            const streamBitrate = parseInt(audioBitrateMatch[1]);
                            // 如果没有从Duration行获取到码率，或者流码率更合理，使用流码率
                            if (!audioInfo.bitrate || (streamBitrate > 0 && streamBitrate < 10000)) {
                                audioInfo.bitrate = streamBitrate;
                                console.log('Updated bitrate from stream:', audioInfo.bitrate);
                            }
                        }
                    }
                }
            };

            // 临时移除所有日志监听器，避免重复输出
            ffmpeg.off('log');

            // 添加分析专用监听器
            ffmpeg.on('log', analyzeListener);

            try {
                // 使用优化的分析命令 - 只读取音频流头信息，不进行任何转换
                await ffmpeg.exec([
                    '-i', inputFileName,
                    '-vn',        // 禁用视频处理，只处理音频流
                    '-f', 'null', // 输出到 null
                    '-t', '0',    // 不进行转换，只读取头信息
                    '-'
                ]);
            } catch (execError) {
                // FFmpeg在分析模式下可能会"失败"，但仍然输出信息，这是正常的
                console.log('Analysis exec completed (expected behavior)');
            }

            // 移除分析监听器，恢复基础监听器
            ffmpeg.off('log', analyzeListener);
            ffmpeg.on('log', ({ message }: { message: string }) => {
                console.log('FFmpeg log:', message);
            });

            // 清理临时文件
            try {
                await ffmpeg.deleteFile(inputFileName);
            } catch (deleteError) {
                console.log('Failed to delete temp file:', deleteError);
            }

            // 验证是否获取到足够的信息
            console.log('Final parsed audio info:', audioInfo);

            if (audioInfo.duration && audioInfo.duration > 0) {
                const result: AudioInfo = {
                    duration: audioInfo.duration,
                    bitrate: audioInfo.bitrate || 0,
                    sampleRate: audioInfo.sampleRate || 0,
                    channels: audioInfo.channels || 2,
                    codec: audioInfo.codec || 'unknown',
                    format: inputExtension
                };

                console.log('Audio analysis successful:', result);
                return result;
            } else {
                console.log('Audio analysis failed: insufficient information');
                console.log('Missing or invalid duration:', audioInfo.duration);

                // 如果只是缺少次要信息，但有时长，仍然尝试返回结果
                if (audioInfo.duration && audioInfo.duration > 0) {
                    const result: AudioInfo = {
                        duration: audioInfo.duration,
                        bitrate: audioInfo.bitrate || 0,
                        sampleRate: audioInfo.sampleRate || 44100, // 默认采样率
                        channels: audioInfo.channels || 2, // 默认立体声
                        codec: audioInfo.codec || 'unknown',
                        format: inputExtension
                    };

                    console.log('Audio analysis partially successful with defaults:', result);
                    return result;
                }

                return null;
            }

        } catch (error) {
            console.error('Audio analysis failed:', error);

            // 如果解析失败，尝试从已收集的部分信息中构建结果
            if (audioInfo && audioInfo.duration && audioInfo.duration > 0) {
                console.log('Attempting to salvage partial audio info:', audioInfo);

                const result: AudioInfo = {
                    duration: audioInfo.duration,
                    bitrate: audioInfo.bitrate || 0,
                    sampleRate: audioInfo.sampleRate || 44100,
                    channels: audioInfo.channels || 2,
                    codec: audioInfo.codec || 'unknown',
                    format: inputExtension
                };

                console.log('Salvaged audio analysis result:', result);
                setAnalyzeError(`音频分析部分成功: ${error instanceof Error ? error.message : '部分信息可能不准确'}`);
                return result;
            }

            setAnalyzeError(`音频分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
            return null;
        } finally {
            setIsAnalyzing(false);
        }
    }, [ffmpegLoaded]);

    // 基于音频信息计算精确文件大小
    const calculateAccurateSize = useCallback((audioInfo: AudioInfo, format: keyof typeof AUDIO_FORMATS, quality: keyof typeof QUALITY_MODES): SizeEstimate => {
        const qualityConfig = QUALITY_MODES[quality];

        // WAV格式特殊处理
        if (format === 'wav') {
            // WAV文件大小 = 采样率 × 位深 × 声道数 × 时长 ÷ 8 ÷ 1024 ÷ 1024
            const bitDepth = 16; // PCM 16位
            const estimatedSizeMB = (audioInfo.sampleRate * bitDepth * audioInfo.channels * audioInfo.duration) / 8 / 1024 / 1024;

            return {
                estimatedSizeMB: Math.max(estimatedSizeMB, 0.1),
                compressionRatio: 0,
                note: '无损格式，基于采样率和时长计算'
            };
        }

        // 获取目标码率
        let targetBitrate = 192; // 默认码率
        const params = qualityConfig.params[format];

        for (let i = 0; i < params.length; i++) {
            if (params[i] === '-b:a' && i + 1 < params.length) {
                const bitrateStr = params[i + 1];
                const bitrateMatch = bitrateStr.match(/(\d+)k/);
                if (bitrateMatch) {
                    targetBitrate = parseInt(bitrateMatch[1]);
                }
                break;
            }
        }

        // 基于时长和目标码率的精确计算
        // 文件大小(MB) = 时长(秒) × 码率(kbps) ÷ 8 ÷ 1024
        const baseSizeMB = (audioInfo.duration * targetBitrate) / 8 / 1024;

        // 添加容器开销（约2-5%）
        const containerOverhead = format === 'mp3' ? 1.02 : 1.03;
        const estimatedSizeMB = baseSizeMB * containerOverhead;

        // 计算压缩率（与原文件码率比较）
        let compressionRatio = 0;
        if (audioInfo.bitrate > 0 && audioInfo.bitrate > targetBitrate) {
            compressionRatio = ((audioInfo.bitrate - targetBitrate) / audioInfo.bitrate) * 100;
        }

        return {
            estimatedSizeMB: Math.max(estimatedSizeMB, 0.1),
            compressionRatio: Math.max(compressionRatio, 0),
            note: `基于 ${audioInfo.duration.toFixed(1)}s 时长和 ${targetBitrate}kbps 目标码率计算`
        };
    }, []);

    // 检测多线程支持
    const checkMultiThreadSupport = useCallback(() => {
        const supportsMultiThread = typeof SharedArrayBuffer !== 'undefined';

        setIsMultiThread(supportsMultiThread);

        console.log(`FFmpeg线程策略: ${supportsMultiThread ? '多线程模式' : '单线程模式'}`);

        return supportsMultiThread;
    }, []);

    // 在组件挂载时检测多线程支持并自动加载FFmpeg
    useEffect(() => {
        checkMultiThreadSupport();

        // 自动开始加载FFmpeg
        initFFmpeg();
    }, [checkMultiThreadSupport, initFFmpeg]);

    // 监听FFmpeg加载完成，自动分析已选择的文件
    useEffect(() => {
        if (ffmpegLoaded && selectedFile && !audioInfo && !isAnalyzing) {
            console.log('FFmpeg 已加载完成，开始自动分析已选择的文件:', selectedFile.name);

            const autoAnalyze = async () => {
                try {
                    const info = await analyzeAudioInfo(selectedFile);
                    if (info) {
                        setAudioInfo(info);
                        console.log('自动音频分析完成:', info);
                    } else {
                        console.log('自动音频分析失败');
                    }
                } catch (error) {
                    console.error('自动音频分析出错:', error);
                }
            };

            // 稍微延迟，确保FFmpeg完全就绪
            const timeoutId = setTimeout(autoAnalyze, 300);
            return () => clearTimeout(timeoutId);
        }
    }, [ffmpegLoaded, selectedFile, audioInfo, isAnalyzing, analyzeAudioInfo]);

    // 文件拖拽处理
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, []);

    const handleFileSelect = useCallback((file: File) => {
        // 验证文件类型
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !SUPPORTED_VIDEO_FORMATS.includes(fileExtension)) {
            setConversionState(prev => ({
                ...prev,
                error: `不支持的文件格式。支持的格式: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`
            }));
            return;
        }

        setSelectedFile(file);
        setAudioInfo(null); // 重置音频信息
        setAnalyzeError(null);
        setConversionState(prev => ({
            ...prev,
            error: null,
            outputFile: null,
            outputFileName: ''
        }));

        // 立即尝试音频分析，无论FFmpeg是否已加载
        const startAnalysis = async () => {
            // 如果FFmpeg还没加载，等待加载完成
            if (!ffmpegLoaded) {
                console.log('FFmpeg 正在加载中，等待完成后开始音频分析...');
                // 这里会通过下面的 useEffect 来处理
                return;
            }

            // FFmpeg已加载，立即开始分析
            try {
                console.log('开始音频分析:', file.name);
                const info = await analyzeAudioInfo(file);
                if (info) {
                    setAudioInfo(info);
                    console.log('音频分析完成:', info);
                } else {
                    console.log('音频分析失败，将不显示预估大小');
                }
            } catch (error) {
                console.error('音频分析出错:', error);
            }
        };

        startAnalysis();
    }, [ffmpegLoaded, analyzeAudioInfo]);

    // 开始转换
    const startConversion = useCallback(async () => {
        if (!selectedFile || !ffmpegRef.current) {
            await initFFmpeg();
            return;
        }

        setConversionState(prev => ({
            ...prev,
            isConverting: true,
            progress: 0,
            currentStep: '准备转换...',
            error: null,
            outputFile: null
        }));

        try {
            const ffmpeg = ffmpegRef.current;

            // 获取文件扩展名
            const inputExtension = selectedFile.name.split('.').pop()?.toLowerCase() || 'unknown';
            const inputFileName = `input.${inputExtension}`;
            const outputFileName = `output.${AUDIO_FORMATS[outputFormat].ext}`;

            setConversionState(prev => ({
                ...prev,
                currentStep: '正在转换音频...',
                progress: 0
            }));

            // 将文件写入 FFmpeg 虚拟文件系统
            await ffmpeg.writeFile(inputFileName, await fetchFile(selectedFile));

            // 设置进度监听变量
            let totalDuration = 0;
            let currentTime = 0;

            // 更新进度监听逻辑 - 只基于FFmpeg实际转换进度
            const progressListener = ({ message }: { message: string }) => {
                if (messageRef.current) {
                    messageRef.current.innerHTML = message;
                }
                console.log('FFmpeg log:', message);

                // 解析总时长
                if (message.includes('Duration:') && totalDuration === 0) {
                    const durationMatch = message.match(/Duration:\s*(\d+):(\d+):(\d+\.\d+)/);
                    if (durationMatch) {
                        const hours = parseInt(durationMatch[1]);
                        const minutes = parseInt(durationMatch[2]);
                        const seconds = parseFloat(durationMatch[3]);
                        totalDuration = hours * 3600 + minutes * 60 + seconds;
                        console.log('Total duration:', totalDuration, 'seconds');
                    }
                }

                // 解析当前进度 - 直接使用FFmpeg的实际进度
                if (message.includes('time=') && totalDuration > 0) {
                    const timeMatch = message.match(/time=(\d+):(\d+):(\d+\.\d+)/);
                    if (timeMatch) {
                        const hours = parseInt(timeMatch[1]);
                        const minutes = parseInt(timeMatch[2]);
                        const seconds = parseFloat(timeMatch[3]);
                        currentTime = hours * 3600 + minutes * 60 + seconds;

                        // 直接使用FFmpeg转换进度（0% 到 100%）
                        const conversionPercent = Math.min(currentTime / totalDuration, 1);
                        const progress = Math.round(conversionPercent * 100);

                        setConversionState(prev => ({
                            ...prev,
                            progress: progress,
                            currentStep: `正在转换音频... ${progress}%`
                        }));
                    }
                } else if (message.includes('time=') && totalDuration === 0) {
                    // 如果无法获取总时长，使用简单的增量进度
                    setConversionState(prev => {
                        const newProgress = Math.min(prev.progress + 5, 95);

                        return {
                            ...prev,
                            progress: newProgress
                        };
                    });
                }
            };

            // 临时添加进度监听器
            ffmpeg.on('log', progressListener);

            // 构建FFmpeg转换命令，使用质量模式参数
            const threadArgs = isMultiThread
                ? ['-threads', '0'] // 0 = 让FFmpeg自动决定最佳线程数
                : [];

            const qualityArgs = QUALITY_MODES[qualityMode].params[outputFormat];

            const args = [
                '-i', inputFileName,
                ...threadArgs,
                ...qualityArgs,
                outputFileName
            ];

            console.log(`线程策略: ${isMultiThread ? 'FFmpeg自动优化' : '单线程模式'}`);
            console.log(`质量模式: ${QUALITY_MODES[qualityMode].label} (${QUALITY_MODES[qualityMode].description})`);
            console.log('FFmpeg命令参数:', args);

            await ffmpeg.exec(args);

            // 移除进度监听器
            ffmpeg.off('log', progressListener);

            // 读取输出文件
            const data = await ffmpeg.readFile(outputFileName);

            // 创建Blob
            const outputBlob = new Blob([data], {
                type: AUDIO_FORMATS[outputFormat].mime
            });

            const finalFileName = `${selectedFile.name.split('.')[0]}.${AUDIO_FORMATS[outputFormat].ext}`;

            setConversionState(prev => ({
                ...prev,
                isConverting: false,
                progress: 100,
                currentStep: '转换完成！',
                outputFile: outputBlob,
                outputFileName: finalFileName
            }));

            // 清除完成状态
            setTimeout(() => {
                setConversionState(prev => ({
                    ...prev,
                    currentStep: '',
                    progress: 0
                }));
            }, 2000);

        } catch (error) {
            console.error('转换失败:', error);
            setConversionState(prev => ({
                ...prev,
                isConverting: false,
                progress: 0,
                currentStep: '',
                error: `转换失败: ${error instanceof Error ? error.message : '未知错误'}`
            }));
        }
    }, [selectedFile, outputFormat, initFFmpeg]);

    // 下载文件
    const downloadFile = useCallback(() => {
        if (!conversionState.outputFile) return;

        const url = URL.createObjectURL(conversionState.outputFile);
        const a = document.createElement('a');
        a.href = url;
        a.download = conversionState.outputFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [conversionState.outputFile, conversionState.outputFileName]);

    // 重置状态
    const reset = useCallback(() => {
        setSelectedFile(null);
        setAudioInfo(null);
        setIsAnalyzing(false);
        setAnalyzeError(null);
        setQualityMode('standard'); // 重置为标准质量
        setConversionState({
            isConverting: false,
            progress: 0,
            currentStep: '',
            error: null,
            outputFile: null,
            outputFileName: '',
        });
        setIsPlaying(false);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    return (
        <div className="min-h-screen text-foreground">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* 页面标题 */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        音频转换
                    </h1>
                    <p className="text-muted-foreground text-lg">支持多种音频格式转换</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 左侧：文件上传区域 */}
                    <div className="lg:col-span-2">
                        <Card className="bg-card border-border">
                            <CardContent className="p-6">
                                <div
                                    className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 cursor-pointer ${selectedFile
                                        ? 'border-green-500 bg-green-500/10'
                                        : 'border-border hover:border-primary hover:bg-primary/5'
                                        }`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {selectedFile ? (
                                        <div className="space-y-4">
                                            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                                            <div>
                                                <p className="font-medium text-lg">{selectedFile.name}</p>
                                                <p className="text-muted-foreground">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                                <p className="text-sm text-green-600 mt-2">已添加到转换列表</p>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    reset();
                                                }}
                                                className="border-border hover:bg-accent"
                                            >
                                                重新选择
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                                            <div>
                                                <p className="text-lg font-medium">把文件拖到这里或者 点击选取</p>
                                                <p className="text-muted-foreground text-sm mt-2">
                                                    支持 MP4, AVI, MOV, MKV, WMV, FLV 等格式
                                                </p>
                                                <p className="text-muted-foreground text-xs">无文件大小限制</p>
                                            </div>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        accept="video/*"
                                        onChange={handleFileInputChange}
                                    />
                                </div>

                                {/* 错误提示 */}
                                {conversionState.error && (
                                    <Alert className="mt-4 border-destructive bg-destructive/10">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription className="text-destructive whitespace-pre-line">
                                            {conversionState.error}
                                        </AlertDescription>
                                        {!ffmpegLoaded && (
                                            <div className="mt-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setConversionState(prev => ({ ...prev, error: null }));
                                                        initFFmpeg();
                                                    }}
                                                    disabled={ffmpegLoading}
                                                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                                >
                                                    {ffmpegLoading ? '加载中...' : '重新加载 FFmpeg'}
                                                </Button>
                                            </div>
                                        )}
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* 右侧：控制面板 */}
                    <div className="space-y-6">
                        {/* 输出格式选择 */}
                        <Card className="bg-card border-border">
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-medium text-foreground">
                                                输出格式
                                            </label>
                                            {/* 多线程模式状态 */}
                                            {ffmpegLoaded && (
                                                <span className={`inline-flex items-center gap-1 text-xs ${isMultiThread ? 'text-green-600' : 'text-blue-600'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${isMultiThread ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                                    {isMultiThread ? '多线程' : '单线程'}
                                                </span>
                                            )}
                                        </div>
                                        <Select
                                            value={outputFormat}
                                            onValueChange={(value: keyof typeof AUDIO_FORMATS) => setOutputFormat(value)}
                                        >
                                            <SelectTrigger className="bg-background border-border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                {Object.entries(AUDIO_FORMATS).map(([key, format]) => (
                                                    <SelectItem key={key} value={key} className="hover:bg-accent">
                                                        {format.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* 音频质量选择 */}
                                    <div>
                                        <label className="text-sm font-medium text-foreground mb-2 block">
                                            音频质量
                                        </label>
                                        <div className="space-y-2">
                                            {Object.entries(QUALITY_MODES).map(([key, mode]) => (
                                                <div
                                                    key={key}
                                                    className={`border rounded-lg p-3 cursor-pointer transition-all ${qualityMode === key
                                                        ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                                        : 'border-border hover:border-muted-foreground hover:bg-accent'
                                                        }`}
                                                    onClick={() => setQualityMode(key as keyof typeof QUALITY_MODES)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-lg">{mode.icon}</span>
                                                            <div>
                                                                <div className="font-medium text-sm">{mode.label}</div>
                                                                <div className="text-xs text-muted-foreground">{mode.description}</div>
                                                            </div>
                                                        </div>
                                                        {qualityMode === key && (
                                                            <CheckCircle2 className="h-4 w-4 text-primary" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* 文件大小预估 */}
                                        {selectedFile && audioInfo && (() => {
                                            const sizeEstimate = calculateAccurateSize(audioInfo, outputFormat, qualityMode);
                                            return (
                                                <div className="mt-3 p-3 bg-muted/30 rounded-lg border">
                                                    <div className="text-xs text-muted-foreground mb-1">
                                                        预估输出文件大小
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <span className="text-sm font-medium text-foreground">
                                                                {formatFileSize(sizeEstimate.estimatedSizeMB)}
                                                            </span>
                                                            {sizeEstimate.compressionRatio > 0 && (
                                                                <span className="text-xs text-green-600 ml-2">
                                                                    压缩 {sizeEstimate.compressionRatio.toFixed(0)}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            原文件: {formatFileSize(selectedFile.size / (1024 * 1024))}
                                                        </div>
                                                    </div>
                                                    {sizeEstimate.note && (
                                                        <div className="text-xs text-blue-600 mt-1">{sizeEstimate.note}</div>
                                                    )}

                                                    {/* 音频信息显示 */}
                                                    <div className="mt-2 pt-2 border-t border-border/50">
                                                        <div className="text-xs text-muted-foreground space-y-1">
                                                            <div className="flex justify-between">
                                                                <span>时长:</span>
                                                                <span>{Math.floor(audioInfo.duration / 60)}:{(audioInfo.duration % 60).toFixed(1).padStart(4, '0')}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>原始码率:</span>
                                                                <span>{audioInfo.bitrate > 0 ? `${audioInfo.bitrate} kbps` : '未知'}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>音频编码:</span>
                                                                <span>{audioInfo.codec}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* 音频分析状态 */}
                                        {selectedFile && isAnalyzing && (
                                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-sm text-blue-700 dark:text-blue-300">正在分析音频信息...</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* 分析错误提示 */}
                                        {selectedFile && analyzeError && (
                                            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                                    {analyzeError}
                                                    <div className="mt-1 text-yellow-600 dark:text-yellow-400">
                                                        无法显示精确预估，请直接进行转换
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* 无音频信息时的提示 */}
                                        {selectedFile && !isAnalyzing && !audioInfo && !analyzeError && (
                                            <div className="mt-3 p-3 bg-muted/20 rounded-lg border">
                                                <div className="text-xs text-muted-foreground">
                                                    {!ffmpegLoaded ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                                                            等待 FFmpeg 加载完成后分析音频信息...
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="mb-1">FFmpeg 已就绪，准备分析音频信息</div>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    analyzeAudioInfo(selectedFile).then(info => {
                                                                        if (info) {
                                                                            setAudioInfo(info);
                                                                            console.log('手动音频分析完成:', info);
                                                                        }
                                                                    });
                                                                }}
                                                                className="h-6 px-2 text-xs"
                                                            >
                                                                重新分析
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={startConversion}
                                        disabled={!selectedFile || conversionState.isConverting}
                                        className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted"
                                    >
                                        {ffmpegLoading ? '加载中...' : conversionState.isConverting ? '转换中...' : '开始转换'}
                                    </Button>


                                </div>
                            </CardContent>
                        </Card>

                        {/* 处理进度 */}
                        {(conversionState.isConverting || conversionState.progress > 0) && (
                            <Card className="bg-card border-border">
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-foreground">处理进度</span>
                                            <span className="text-primary">{conversionState.progress}%</span>
                                        </div>
                                        <Progress
                                            value={conversionState.progress}
                                            className="h-2"
                                        />
                                        {conversionState.currentStep && (
                                            <p className="text-xs text-muted-foreground">{conversionState.currentStep}</p>
                                        )}

                                        {/* FFmpeg 日志显示 */}
                                        <div
                                            ref={messageRef}
                                            className="text-xs font-mono text-muted-foreground bg-muted/30 p-2 rounded border max-h-20 overflow-y-auto"
                                            style={{ minHeight: '1.5rem' }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 输出文件 */}
                        {conversionState.outputFile && (
                            <Card className="bg-card border-border">
                                <CardContent className="p-4">
                                    <div className="space-y-4">
                                        <h3 className="font-medium text-foreground">输出文件</h3>

                                        {/* 音频播放器 */}
                                        <div className="bg-muted rounded-lg p-3">
                                            <audio
                                                ref={audioRef}
                                                src={URL.createObjectURL(conversionState.outputFile)}
                                                onPlay={() => setIsPlaying(true)}
                                                onPause={() => setIsPlaying(false)}
                                                onEnded={() => setIsPlaying(false)}
                                                className="w-full"
                                                controls
                                            />
                                        </div>

                                        {/* 目标文件下载 */}
                                        <Button
                                            onClick={downloadFile}
                                            className="w-full bg-green-600 hover:bg-green-700"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            下载文件
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AudioConverterView;
