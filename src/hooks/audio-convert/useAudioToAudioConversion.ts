import { useSetState, useRequest, useMemoizedFn } from 'ahooks';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { convertAudio, AudioFormat, QualityMode, AudioInfo, MediaMetadata, ConversionState, getMediaType } from '@/utils/audioConverter';

export const useAudioToAudioConversion = (
    ffmpeg: FFmpeg | null | undefined,
    isMultiThread: boolean,
    audioInfo: AudioInfo | null,
    mediaMetadata: MediaMetadata | null
) => {
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

            // 检查文件类型
            const mediaType = getMediaType(file.name);
            if (mediaType === 'video') {
                throw new Error('检测到视频文件，请前往视频音频提取页面处理此文件');
            }
            if (mediaType === 'unknown') {
                throw new Error('不支持的文件格式');
            }

            setConversionState({
                isConverting: true,
                progress: 0,
                currentStep: '准备转换音频格式...',
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
                audioInfo,
                mediaMetadata?.audio.codec,
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
                currentStep: '格式转换完成！',
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
                console.error('音频转换失败:', error);

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
