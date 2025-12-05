import { useMemoizedFn } from 'ahooks';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import {
    convertAudio,
    AudioInfo,
    MediaMetadata,
    AudioFormat,
    QualityMode,
} from '@/utils/audioConverter';
import { useProcessingTask } from '../common/useProcessingTask';

interface ConversionResult {
    outputFile: Blob;
    outputFileName: string;
}

export const useAudioConversion = (
    ffmpeg: FFmpeg | undefined | null,
    isMultiThread: boolean,
    audioInfo?: AudioInfo | null,
    mediaMetadata?: MediaMetadata | null
) => {
    const {
        state,
        start,
        updateProgress,
        complete,
        fail,
        reset
    } = useProcessingTask<ConversionResult>();

    const startConversion = useMemoizedFn(
        async (file: File, outputFormat: AudioFormat, qualityMode: QualityMode) => {
            if (!ffmpeg) {
                fail(new Error('FFmpeg 未加载完成，请稍候再试'));
                return;
            }

            try {
                start('准备转换...');
                
                const outputBlob = await convertAudio(
                    file,
                    ffmpeg,
                    outputFormat,
                    qualityMode,
                    isMultiThread,
                    audioInfo,
                    mediaMetadata?.audio.codec,
                    (progress, step, remainingTime) => {
                        const message = remainingTime 
                            ? `${step} (剩余: ${remainingTime})`
                            : step;
                        updateProgress(progress, message);
                    }
                );

                const finalFileName = `${file.name.replace(/\.[^/.]+$/, '')}.${outputFormat}`;

                complete({
                    outputFile: outputBlob,
                    outputFileName: finalFileName
                }, '转换完成！');

            } catch (error) {
                console.error('转换失败:', error);
                fail(error instanceof Error ? error : new Error('未知错误'));
            }
        }
    );

    return {
        conversionState: {
            isConverting: state.status === 'processing',
            progress: state.progress,
            currentStep: state.message,
            error: state.error?.message || null,
            outputFile: state.result?.outputFile || null,
            outputFileName: state.result?.outputFileName || '',
            // We map status to legacy fields if needed, or consumer adapts
            status: state.status
        },
        startConversion,
        resetConversion: reset
    };
};
