import { useRequest, useLocalStorageState, useSetState, useMemoizedFn, useMount } from 'ahooks';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import {
    initializeFFmpeg,
    analyzeMediaFile,
    analyzeAudioInfo,
    analyzeMediaMetadata,
    convertAudio,
    checkMultiThreadSupport,
    AudioInfo,
    MediaMetadata,
    AudioFormat,
    QualityMode,
    ConversionState
} from '@/utils/audioConverter';

// FFmpeg 管理 Hook
export const useFFmpegManager = () => {
    const {
        data: ffmpegData,
        loading: ffmpegLoading,
        error: ffmpegError,
        run: initFFmpeg
    } = useRequest(
        async () => {
            const result = await initializeFFmpeg();
            return result;
        },
        {
            manual: true,
            cacheKey: 'ffmpeg-instance',
            staleTime: Infinity,
            onError: (error) => {
                console.error('FFmpeg 加载失败:', error);

                let errorMessage = `FFmpeg 加载失败: ${error instanceof Error ? error.message : '未知错误'}`;

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

                throw new Error(errorMessage);
            }
        }
    );

    useMount(() => {
        initFFmpeg();
    });

    return {
        ffmpeg: ffmpegData?.ffmpeg,
        isMultiThread: ffmpegData?.isMultiThread || false,
        ffmpegLoaded: !!ffmpegData,
        ffmpegLoading,
        ffmpegError,
        initFFmpeg
    };
};

// 统一媒体分析 Hook（优化版本 - 快速分析 + 超时处理）
export const useUnifiedMediaAnalysis = (ffmpeg: FFmpeg | undefined) => {
    const {
        data: analysisResult,
        loading: isAnalyzing,
        error: analyzeError,
        run: runAnalysis
    } = useRequest(
        async (file: File) => {
            if (!ffmpeg) {
                throw new Error('FFmpeg not loaded');
            }

            console.log(`开始快速分析文件: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
            const startTime = Date.now();

            try {
                const result = await analyzeMediaFile(file, ffmpeg);
                const duration = Date.now() - startTime;
                console.log(`文件分析完成，耗时: ${duration}ms`);
                return result;
            } catch (error: any) {
                const duration = Date.now() - startTime;
                console.error(`文件分析失败，耗时: ${duration}ms`, error);

                // 提供更友好的错误信息
                if (error.message?.includes('timeout')) {
                    throw new Error('文件分析超时，请尝试选择较小的文件或重试');
                } else if (error.message?.includes('not loaded')) {
                    throw new Error('FFmpeg 未加载完成，请等待加载完成后重试');
                } else {
                    throw new Error(`文件分析失败: ${error.message || '未知错误'}`);
                }
            }
        },
        {
            manual: true,
            refreshDeps: [ffmpeg],
            onError: (error) => {
                console.error('Media analysis failed:', error);
            },
            onSuccess: (result) => {
                if (result?.audioInfo) {
                    console.log('音频信息:', result.audioInfo);
                }
                if (result?.metadata) {
                    console.log('媒体元数据:', result.metadata);
                }
            }
        }
    );

    const analyzeMedia = useMemoizedFn((file: File) => {
        if (!ffmpeg) {
            console.log('FFmpeg not loaded, skipping media analysis');
            return;
        }

        // 文件大小检查（可选的预防措施）
        const fileSizeMB = file.size / 1024 / 1024;
        if (fileSizeMB > 500) { // 500MB 以上的文件给出提示
            console.warn(`文件较大 (${fileSizeMB.toFixed(2)}MB)，分析可能需要较长时间`);
        }

        runAnalysis(file);
    });

    return {
        audioInfo: analysisResult?.audioInfo || null,
        mediaMetadata: analysisResult?.metadata || null,
        isAnalyzing,
        analyzeError: analyzeError?.message || null,
        analyzeMedia,
        clearAnalysis: () => {
            // 清空分析结果
        }
    };
};

// 音频分析 Hook（保留向后兼容性）
export const useAudioAnalysis = (ffmpeg: FFmpeg | undefined) => {
    const {
        data: audioInfo,
        loading: isAnalyzing,
        error: analyzeError,
        run: runAnalysis
    } = useRequest(
        async (file: File) => {
            if (!ffmpeg) {
                throw new Error('FFmpeg not loaded');
            }
            return await analyzeAudioInfo(file, ffmpeg);
        },
        {
            manual: true,
            refreshDeps: [ffmpeg],
            onError: (error) => {
                console.error('Audio analysis failed:', error);
            }
        }
    );

    const analyzeAudio = useMemoizedFn((file: File) => {
        if (!ffmpeg) {
            console.log('FFmpeg not loaded, skipping audio analysis');
            return;
        }
        runAnalysis(file);
    });

    return {
        audioInfo,
        isAnalyzing,
        analyzeError: analyzeError?.message || null,
        analyzeAudio,
        clearAnalysis: () => {
            // 清空分析结果
        }
    };
};

// 媒体元数据分析 Hook
export const useMediaMetadataAnalysis = (ffmpeg: FFmpeg | undefined) => {
    const {
        data: mediaMetadata,
        loading: isAnalyzing,
        error: analyzeError,
        run: runAnalysis
    } = useRequest(
        async (file: File) => {
            if (!ffmpeg) {
                throw new Error('FFmpeg not loaded');
            }
            return await analyzeMediaMetadata(file, ffmpeg);
        },
        {
            manual: true,
            refreshDeps: [ffmpeg],
            onError: (error) => {
                console.error('Media metadata analysis failed:', error);
            }
        }
    );

    const analyzeMetadata = useMemoizedFn((file: File) => {
        if (!ffmpeg) {
            console.log('FFmpeg not loaded, skipping metadata analysis');
            return;
        }
        runAnalysis(file);
    });

    return {
        mediaMetadata,
        isAnalyzing,
        analyzeError: analyzeError?.message || null,
        analyzeMetadata,
        clearMetadata: () => {
            // 清空元数据结果
        }
    };
};

// 音频转换 Hook
export const useAudioConversion = (ffmpeg: FFmpeg | undefined, isMultiThread: boolean) => {
    const [conversionState, setConversionState] = useSetState<ConversionState>({
        isConverting: false,
        progress: 0,
        currentStep: '',
        error: null,
        outputFile: null,
        outputFileName: '',
        remainingTime: null,
    });

    const {
        loading: isConverting,
        run: runConversion
    } = useRequest(
        async (file: File, outputFormat: AudioFormat, qualityMode: QualityMode) => {
            if (!ffmpeg) {
                throw new Error('FFmpeg not loaded');
            }

            setConversionState({
                isConverting: true,
                progress: 0,
                currentStep: '准备转换...',
                error: null,
                outputFile: null,
                remainingTime: null
            });

            const outputBlob = await convertAudio(
                file,
                ffmpeg,
                outputFormat,
                qualityMode,
                isMultiThread,
                (progress, step, remainingTime) => {
                    setConversionState({
                        progress,
                        currentStep: step,
                        remainingTime: remainingTime || null
                    });
                }
            );

            const finalFileName = `${file.name.split('.')[0]}.${outputFormat}`;

            setConversionState({
                isConverting: false,
                progress: 100,
                currentStep: '转换完成！',
                outputFile: outputBlob,
                outputFileName: finalFileName,
                remainingTime: null
            });

            // 清除完成状态
            setTimeout(() => {
                setConversionState({
                    currentStep: '',
                    progress: 0
                });
            }, 2000);

            return outputBlob;
        },
        {
            manual: true,
            refreshDeps: [ffmpeg, isMultiThread],
            onError: (error) => {
                console.error('转换失败:', error);
                setConversionState({
                    isConverting: false,
                    progress: 0,
                    currentStep: '',
                    error: `转换失败: ${error instanceof Error ? error.message : '未知错误'}`
                });
            }
        }
    );

    const startConversion = useMemoizedFn(
        (file: File, outputFormat: AudioFormat, qualityMode: QualityMode) => {
            if (!ffmpeg) {
                setConversionState({
                    error: 'FFmpeg 未加载完成，请稍候再试'
                });
                return;
            }
            runConversion(file, outputFormat, qualityMode);
        }
    );

    const resetConversion = useMemoizedFn(() => {
        setConversionState({
            isConverting: false,
            progress: 0,
            currentStep: '',
            error: null,
            outputFile: null,
            outputFileName: '',
            remainingTime: null,
        });
    });

    return {
        conversionState,
        isConverting,
        startConversion,
        resetConversion
    };
};

// 文件选择 Hook
export const useFileSelection = () => {
    const [selectedFile, setSelectedFile] = useSetState<{ file: File | null }>({
        file: null
    });

    const [fileState, setFileState] = useSetState({
        dragOver: false
    });

    const selectFile = useMemoizedFn((file: File) => {
        setSelectedFile({ file });
    });

    const clearFile = useMemoizedFn(() => {
        setSelectedFile({ file: null });
    });

    const handleDragEnter = useMemoizedFn(() => {
        setFileState({ dragOver: true });
    });

    const handleDragLeave = useMemoizedFn(() => {
        setFileState({ dragOver: false });
    });

    const handleDrop = useMemoizedFn((e: React.DragEvent) => {
        e.preventDefault();
        setFileState({ dragOver: false });

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            selectFile(files[0]);
        }
    });

    return {
        selectedFile: selectedFile.file,
        dragOver: fileState.dragOver,
        selectFile,
        clearFile,
        handleDragEnter,
        handleDragLeave,
        handleDrop
    };
};

// 用户设置 Hook
export const useAudioConverterSettings = () => {
    const [outputFormat, setOutputFormat] = useLocalStorageState<AudioFormat>(
        'audioConverter.outputFormat',
        { defaultValue: 'mp3' }
    );

    const [qualityMode, setQualityMode] = useLocalStorageState<QualityMode>(
        'audioConverter.qualityMode',
        { defaultValue: 'standard' }
    );

    const [isPlaying, setIsPlaying] = useSetState({
        playing: false
    });

    return {
        outputFormat,
        setOutputFormat,
        qualityMode,
        setQualityMode,
        isPlaying: isPlaying.playing,
        setIsPlaying: (playing: boolean) => setIsPlaying({ playing })
    };
};
