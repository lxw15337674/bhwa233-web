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
    mp3: { label: 'MP3', ext: 'mp3', mime: 'audio/mpeg', ffmpegArgs: ['-q:a', '2'] },
    aac: { label: 'AAC', ext: 'aac', mime: 'audio/aac', ffmpegArgs: ['-c:a', 'aac', '-b:a', '192k'] },
    wav: { label: 'WAV', ext: 'wav', mime: 'audio/wav', ffmpegArgs: ['-c:a', 'pcm_s16le'] },
    ogg: { label: 'OGG', ext: 'ogg', mime: 'audio/ogg', ffmpegArgs: ['-c:a', 'libvorbis', '-q:a', '5'] },
    m4a: { label: 'M4A', ext: 'm4a', mime: 'audio/mp4', ffmpegArgs: ['-c:a', 'aac', '-b:a', '192k'] },
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

const AudioConverterView = () => {
    // 状态管理
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [outputFormat, setOutputFormat] = useState<keyof typeof AUDIO_FORMATS>('mp3');
    const [ffmpegLoaded, setFfmpegLoaded] = useState(false);
    const [ffmpegLoading, setFfmpegLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMultiThread, setIsMultiThread] = useState(false);
    const [maxThreads, setMaxThreads] = useState(1);
    const [isMobile, setIsMobile] = useState(false);

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

    // FFmpeg 初始化
    const initFFmpeg = useCallback(async () => {
        if (ffmpegLoaded || ffmpegLoading) return;

        setFfmpegLoading(true);
        setConversionState(prev => ({
            ...prev,
            currentStep: '正在初始化 FFmpeg...',
            progress: 10
        }));

        try {
            console.log('Starting FFmpeg initialization...');

            setConversionState(prev => ({
                ...prev,
                currentStep: '正在创建 FFmpeg 实例...',
                progress: 30
            }));

            const ffmpeg = new FFmpeg();
            ffmpegRef.current = ffmpeg;

            // 基础日志监听器（仅用于调试，转换时会使用专门的进度监听器）
            ffmpeg.on('log', ({ message }: { message: string }) => {
                console.log('FFmpeg log:', message);
                // 仅在初始化时显示日志，转换时由专门的进度监听器处理
                if (messageRef.current && !ffmpegLoaded) {
                    messageRef.current.innerHTML = message;
                }
            });

            setConversionState(prev => ({
                ...prev,
                currentStep: '正在加载 FFmpeg 核心文件...',
                progress: 50
            }));

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

            setConversionState(prev => ({
                ...prev,
                currentStep: '正在初始化 WASM 模块...',
                progress: 80
            }));

            await ffmpeg.load({
                coreURL,
                wasmURL,
                workerURL,
            });

            console.log('FFmpeg loaded successfully!');

            setFfmpegLoaded(true);
            setConversionState(prev => ({
                ...prev,
                currentStep: 'FFmpeg 加载完成',
                progress: 100
            }));

            // 清除加载状态
            setTimeout(() => {
                setConversionState(prev => ({
                    ...prev,
                    currentStep: '',
                    progress: 0
                }));
            }, 1000);

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
                error: errorMessage,
                currentStep: '',
                progress: 0
            }));
        } finally {
            setFfmpegLoading(false);
        }
    }, [ffmpegLoaded, ffmpegLoading]);

    // 检测多线程支持
    const checkMultiThreadSupport = useCallback(() => {
        const supportsMultiThread = typeof SharedArrayBuffer !== 'undefined';
        const cpuCores = navigator.hardwareConcurrency || 8;
        const deviceIsMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        setIsMultiThread(supportsMultiThread);
        setMaxThreads(cpuCores); // 仅用于显示，实际由FFmpeg自动决定
        setIsMobile(deviceIsMobile);

        console.log(`设备类型: ${deviceIsMobile ? '移动设备' : '桌面设备'}`);
        console.log(`CPU核心数: ${cpuCores}`);
        console.log(`FFmpeg线程策略: ${supportsMultiThread ? '自动决定最佳线程数' : '单线程模式'}`);

        return supportsMultiThread;
    }, []);

    // 在组件挂载时检测多线程支持
    useEffect(() => {
        checkMultiThreadSupport();
    }, [checkMultiThreadSupport]);

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
        setConversionState(prev => ({
            ...prev,
            error: null,
            outputFile: null,
            outputFileName: ''
        }));
    }, []);

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
                    setConversionState(prev => ({
                        ...prev,
                        progress: Math.min(prev.progress + 5, 95)
                    }));
                }
            };

            // 临时添加进度监听器
            ffmpeg.on('log', progressListener);

            // 构建FFmpeg转换命令，让FFmpeg自动决定线程数
            const threadArgs = isMultiThread
                ? ['-threads', '0'] // 0 = 让FFmpeg自动决定最佳线程数
                : [];

            const args = [
                '-i', inputFileName,
                ...threadArgs,
                ...AUDIO_FORMATS[outputFormat].ffmpegArgs,
                outputFileName
            ];

            console.log(`线程策略: ${isMultiThread ? 'FFmpeg自动优化' : '单线程模式'}`);
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
                        {(conversionState.isConverting || conversionState.progress > 0 || ffmpegLoading) && (
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
