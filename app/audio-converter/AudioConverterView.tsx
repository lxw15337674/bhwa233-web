'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';

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

// 声明全局变量类型
declare global {
    interface Window {
        FFmpeg?: any;
        createFFmpeg?: any;
        fetchFile?: any;
        ffmpegInstance?: any;
    }
}

const AudioConverterView = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [outputFormat, setOutputFormat] = useState<keyof typeof AUDIO_FORMATS>('mp3');
    const [conversionState, setConversionState] = useState<ConversionState>({
        isConverting: false,
        progress: 0,
        currentStep: '',
        error: null,
        outputFile: null,
        outputFileName: '',
    });
    const [isPlaying, setIsPlaying] = useState(false);
    const [ffmpegLoaded, setFFmpegLoaded] = useState(false);
    const [ffmpegLoading, setFFmpegLoading] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 检查浏览器支持
    const checkBrowserSupport = useCallback(() => {
        const isWasmSupported = (() => {
            try {
                if (typeof WebAssembly === 'object') {
                    const testWasm = Uint8Array.of(0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00);
                    return WebAssembly.validate(testWasm);
                }
            } catch (e) { }
            return false;
        })();

        return { isWasmSupported };
    }, []);

    // 动态加载脚本
    const loadScript = (src: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.crossOrigin = 'anonymous'; // 解决跨域问题
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
        });
    };

    // 加载 FFmpeg
    const loadFFmpeg = useCallback(async () => {
        if (ffmpegLoaded || ffmpegLoading) return;

        const { isWasmSupported } = checkBrowserSupport();
        if (!isWasmSupported) {
            setConversionState(prev => ({
                ...prev,
                error: '您的浏览器不支持WebAssembly，请升级到最新版本的Chrome、Firefox或Safari'
            }));
            return;
        }

        setFFmpegLoading(true);
        setConversionState(prev => ({ ...prev, currentStep: '正在加载FFmpeg...', progress: 10 }));

        try {
            // 加载 FFmpeg UMD 版本的脚本
            if (!window.createFFmpeg) {
                await loadScript('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/dist/umd/ffmpeg.min.js');
            }

            // 加载 fetchFile 工具函数
            if (!window.fetchFile) {
                await loadScript('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/umd/index.min.js');
            }

            if (!window.createFFmpeg) {
                throw new Error('FFmpeg脚本加载失败');
            }

            // 创建 FFmpeg 实例，使用 UMD 版本
            const ffmpeg = window.createFFmpeg({
                log: true,
                corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
            });

            // 设置进度监听
            ffmpeg.setProgress(({ ratio }: { ratio: number }) => {
                setConversionState(prev => ({
                    ...prev,
                    progress: Math.round(ratio * 100)
                }));
            });

            // 加载核心文件
            await ffmpeg.load();

            window.ffmpegInstance = ffmpeg;
            setFFmpegLoaded(true);
            setConversionState(prev => ({ ...prev, currentStep: 'FFmpeg加载完成', progress: 0 }));
        } catch (error) {
            console.error('FFmpeg加载失败:', error);
            setConversionState(prev => ({
                ...prev,
                error: 'FFmpeg加载失败，请检查网络连接或刷新页面重试'
            }));
        } finally {
            setFFmpegLoading(false);
        }
    }, [ffmpegLoaded, ffmpegLoading, checkBrowserSupport]);

    // 验证文件格式
    const validateFile = useCallback((file: File): string | null => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !SUPPORTED_VIDEO_FORMATS.includes(fileExtension)) {
            return `不支持的文件格式。支持的格式：${SUPPORTED_VIDEO_FORMATS.join(', ')}`;
        }

        return null;
    }, []);

    // 文件选择处理
    const handleFileSelect = useCallback((file: File) => {
        const error = validateFile(file);
        if (error) {
            setConversionState(prev => ({ ...prev, error }));
            return;
        }

        setSelectedFile(file);
        setConversionState(prev => ({
            ...prev,
            error: null,
            outputFile: null,
            progress: 0,
            currentStep: ''
        }));
    }, [validateFile]);

    // 拖拽处理
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    // 文件输入处理
    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    // 开始转换
    const startConversion = useCallback(async () => {
        if (!selectedFile || !ffmpegLoaded) {
            if (!ffmpegLoaded) {
                await loadFFmpeg();
                return;
            }
            return;
        }

        setConversionState(prev => ({
            ...prev,
            isConverting: true,
            progress: 0,
            error: null,
            currentStep: '准备转换...'
        }));

        try {
            const ffmpeg = window.ffmpegInstance;

            if (!ffmpeg) {
                throw new Error('FFmpeg未正确加载');
            }

            // 写入输入文件
            setConversionState(prev => ({ ...prev, currentStep: '读取视频文件...', progress: 10 }));
            const inputFileName = `input.${selectedFile.name.split('.').pop()}`;

            // 使用 fetchFile 读取文件
            if (!window.fetchFile) {
                throw new Error('fetchFile 函数未加载');
            }

            const inputData = await window.fetchFile(selectedFile);
            ffmpeg.FS('writeFile', inputFileName, inputData);

            // 获取格式配置
            const formatConfig = AUDIO_FORMATS[outputFormat];
            const outputFileName = `output.${formatConfig.ext}`;

            // 执行转换
            setConversionState(prev => ({ ...prev, currentStep: '正在转换...', progress: 20 }));

            const args = [
                '-i', inputFileName,
                ...formatConfig.ffmpegArgs,
                outputFileName
            ];

            await ffmpeg.run(...args);

            // 读取输出文件
            setConversionState(prev => ({ ...prev, currentStep: '生成音频文件...', progress: 90 }));
            const data = ffmpeg.FS('readFile', outputFileName);
            const outputBlob = new Blob([data.buffer], { type: formatConfig.mime });

            // 清理临时文件
            try {
                ffmpeg.FS('unlink', inputFileName);
                ffmpeg.FS('unlink', outputFileName);
            } catch (e) {
                console.warn('清理临时文件失败:', e);
            }

            const finalFileName = selectedFile.name.replace(/\.[^/.]+$/, `.${formatConfig.ext}`);

            setConversionState(prev => ({
                ...prev,
                isConverting: false,
                progress: 100,
                currentStep: '转换完成',
                outputFile: outputBlob,
                outputFileName: finalFileName
            }));

        } catch (error) {
            console.error('转换失败:', error);
            setConversionState(prev => ({
                ...prev,
                isConverting: false,
                error: `转换失败: ${error instanceof Error ? error.message : '未知错误'}`
            }));
        }
    }, [selectedFile, outputFormat, ffmpegLoaded, loadFFmpeg]);

    // 播放/暂停音频
    const toggleAudioPlayback = useCallback(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }, [isPlaying]);

    // 下载文件
    const downloadFile = useCallback(() => {
        if (conversionState.outputFile) {
            const url = URL.createObjectURL(conversionState.outputFile);
            const a = document.createElement('a');
            a.href = url;
            a.download = conversionState.outputFileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }, [conversionState.outputFile, conversionState.outputFileName]);

    // 重置
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
                                        <AlertDescription className="text-destructive">
                                            {conversionState.error}
                                        </AlertDescription>
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
                                        <label className="text-sm font-medium text-foreground mb-2 block">
                                            输出格式
                                        </label>
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
