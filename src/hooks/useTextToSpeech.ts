import { useSetState, useRequest, useMemoizedFn } from 'ahooks';

interface TextToSpeechOptions {
  voiceModel: string;
  speed: number;
  pitch: number;
}

interface TextToSpeechState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  result: Blob | null;
  outputFileName: string;
}

export const useTextToSpeech = () => {
  const [state, setState] = useSetState<TextToSpeechState>({
    isProcessing: false,
    progress: 0,
    currentStep: '',
    error: null,
    result: null,
    outputFileName: ''
  });

  const { loading: isProcessing, run: runTextToSpeech } = useRequest(
    async (text: string, options: TextToSpeechOptions) => {
      setState({
        isProcessing: true,
        progress: 0,
        currentStep: '正在连接SiliconFlow服务...',
        error: null
      });

      try {
        // 准备请求数据
        setState({
          progress: 20,
          currentStep: '正在准备文本内容...'
        });

        // SiliconFlow TTS API 参数映射
        const requestData = {
          model: "fishaudio/fish-speech-1.4",
          input: text,
          voice: options.voiceModel,
          response_format: "mp3",
          speed: options.speed,
          // SiliconFlow 支持 pitch 参数
          ...(options.pitch !== 1.0 && { pitch: options.pitch })
        };

        // 调用本地API路由
        setState({
          progress: 50,
          currentStep: '正在调用TTS服务...'
        });

        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text,
            voiceModel: options.voiceModel,
            speed: options.speed,
            pitch: options.pitch
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `TTS服务错误: ${response.status}`;
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch {
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }

        // 获取音频数据
        setState({
          progress: 80,
          currentStep: '正在处理音频数据...'
        });

        const audioBlob = await response.blob();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `tts_${timestamp}.mp3`;

        // 转换完成
        setState({
          isProcessing: false,
          progress: 100,
          currentStep: 'TTS转换完成！',
          result: audioBlob,
          outputFileName: fileName
        });

        return audioBlob;
      } catch (error) {
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
          currentStep: '转换失败'
        });
      }
    }
  );

  const startTextToSpeech = useMemoizedFn((text: string, options: TextToSpeechOptions) => {
    if (!text.trim()) {
      setState({
        error: '请输入要转换的文本内容'
      });
      return;
    }

    // 检查文本长度限制
    if (text.length > 5000) {
      setState({
        error: '文本长度不能超过5000字符'
      });
      return;
    }

    runTextToSpeech(text, options);
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
    startTextToSpeech,
    resetState
  };
};