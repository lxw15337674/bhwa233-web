'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { downloadFile } from '@/utils/download';
import axios from 'axios';
import { useTextProcessorStore } from '../../../../src/stores/media-processor/text-store';

const TextToSpeechControlPanel = () => {
  const { inputText = '' } = useTextProcessorStore();

  const [speed, setSpeed] = useState(1.0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Blob | null>(null);
  const [outputFileName, setOutputFileName] = useState('');


  const startTextToSpeech = async () => {
    const text = inputText
    if (!text.trim()) {
      setError('请输入要转换的文本内容');
      return;
    }

    // 检查文本长度限制
    if (text.length > 5000) {
      setError('文本长度不能超过5000字符');
      return;
    }

    try {
      setIsProcessing(true);
      setError(null);

      // 调用本地API路由
      const response = await axios.post('/api/text-to-speech', {
        text,
        speed: speed || speed,
      }, {
        responseType: 'blob'
      });

      // 获取音频数据
      const audioBlob = response.data;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `tts_${timestamp}.mp3`;

      // 转换完成
      setResult(audioBlob);
      setOutputFileName(fileName);
      setIsProcessing(false);

    } catch (error) {
      setIsProcessing(false);
      const errorMessage = '转换失败';
      setError(errorMessage);
    }
  }

  const resetState = () => {
    setIsProcessing(false);
    setError(null);
    setResult(null);
    setOutputFileName('');
  };

  const handleDownload = () => {
    if (result) {
      downloadFile(result, outputFileName);
    }
  };
  return (
    <div className="space-y-4">
      {/* 语音设置 */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <Label htmlFor="speed">语速: {speed}x</Label>
          <Input
            id="speed"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
          <div className="text-xs text-gray-500 mt-1">
            范围 0.5x - 2.0x，当前: {speed}x
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button
          onClick={startTextToSpeech}
          disabled={!inputText.trim() || isProcessing}
          className="flex-1"
        >
          {isProcessing ? '转换中...' : '开始转换'}
        </Button>

        <Button onClick={resetState} variant="outline">
          重置
        </Button>

        {result && (
          <Button onClick={handleDownload} variant="outline">
            下载音频
          </Button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 音频预览 */}
      {result && (
        <div className="space-y-2">
          <Label>音频预览</Label>
          <audio
            controls
            src={URL.createObjectURL(result)}
            className="w-full"
          />
          <div className="text-xs text-gray-500">
            文件名: {outputFileName}
          </div>
        </div>
      )}
    </div>
  );
};

export default TextToSpeechControlPanel;