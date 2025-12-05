import { useMemoizedFn } from 'ahooks';
import { useProcessingTask } from './common/useProcessingTask';

interface SpeechToTextResult {
    text: string;
    fileName: string;
}

export const useSpeechToText = () => {
    const {
        state,
        start,
        updateProgress,
        complete,
        fail,
        reset
    } = useProcessingTask<SpeechToTextResult>();

    const startTranscription = useMemoizedFn(async (file: File) => {
        if (!file) {
            fail(new Error('请选择音频文件'), '请选择音频文件');
            return;
        }

        try {
            start('正在上传音频文件...');
            updateProgress(0, '正在上传音频文件...');

            const formData = new FormData();
            formData.append('file', file);

            // 上传文件阶段 - 50% (模拟，因为 fetch 没有上传进度)
            updateProgress(50, '正在识别音频内容...');

            const response = await fetch('/api/siliconflow/transcribe', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `识别失败: ${response.statusText}`);
            }

            const resultData = await response.json();
            const resultText = resultData.text || resultData;
            const fileName = `${file.name.split('.')[0]}.txt`;

            complete({
                text: resultText,
                fileName: fileName
            }, '识别完成！');

        } catch (error: any) {
            fail(error instanceof Error ? error : new Error(error.message || '识别失败'), '识别失败');
        }
    });

    const resetState = useMemoizedFn(() => {
        reset();
    });

    return {
        isProcessing: state.status === 'processing',
        progress: state.progress,
        currentStep: state.message,
        error: state.error?.message || null,
        result: state.result?.text || null,
        outputFileName: state.result?.fileName || '',
        startTranscription,
        resetState
    };
}; 