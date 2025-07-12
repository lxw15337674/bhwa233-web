import { useSetState, useRequest, useMemoizedFn } from 'ahooks';

interface SpeechToTextState {
    isProcessing: boolean;
    progress: number;
    currentStep: string;
    error: string | null;
    result: string | null;
    outputFileName: string;
}

export const useSpeechToText = () => {
    const [state, setState] = useSetState<SpeechToTextState>({
        isProcessing: false,
        progress: 0,
        currentStep: '',
        error: null,
        result: null,
        outputFileName: ''
    });

    const { loading: isProcessing, run: runTranscription } = useRequest(
        async (file: File) => {
            setState({
                isProcessing: true,
                progress: 0,
                currentStep: '正在上传音频文件...',
                error: null
            });

            // 模拟进度更新
            const progressInterval = setInterval(() => {
                setState(prev => ({
                    progress: Math.min(prev.progress + 15, 90),
                    currentStep: '正在识别音频内容...'
                }));
            }, 800);

            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch('/api/siliconflow/transcribe', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `识别失败: ${response.statusText}`);
                }

                const result = await response.json();

                clearInterval(progressInterval);

                setState({
                    isProcessing: false,
                    progress: 100,
                    currentStep: '识别完成！',
                    result: result.text || result,
                    outputFileName: `${file.name.split('.')[0]}.txt`
                });

                return result;
            } catch (error) {
                clearInterval(progressInterval);
                throw error;
            }
        },
        {
            manual: true,
            onError: (error) => {
                setState({
                    isProcessing: false,
                    progress: 0,
                    error: error.message,
                    currentStep: '识别失败'
                });
            }
        }
    );

    const startTranscription = useMemoizedFn((file: File) => {
        if (!file) {
            setState({
                error: '请选择音频文件'
            });
            return;
        }
        runTranscription(file);
    });

    const resetState = useMemoizedFn(() => {
        setState({
            isProcessing: false,
            progress: 0,
            currentStep: '',
            error: null,
            result: null,
            outputFileName: ''
        });
    });

    return {
        ...state,
        isProcessing,
        startTranscription,
        resetState
    };
}; 