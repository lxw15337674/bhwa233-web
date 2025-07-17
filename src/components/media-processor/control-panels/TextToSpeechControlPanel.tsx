import React, { useState, useEffect } from 'react';
import { ControlPanelProps } from '@/types/media-processor';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

interface TextToSpeechControlPanelProps extends ControlPanelProps {
  textInput?: string;
}

export const TextToSpeechControlPanel: React.FC<TextToSpeechControlPanelProps> = ({
  textInput = '',
  onStateChange,
  onOutputReady
}) => {
  const [speed, setSpeed] = useState(1.0);

  const {
    isProcessing,
    progress,
    currentStep,
    error,
    result,
    outputFileName,
    startTextToSpeech,
    resetState
  } = useTextToSpeech();

  // 通知主容器状态变化
  useEffect(() => {
    onStateChange({
      isProcessing,
      progress,
      currentStep,
      error
    });
  }, [isProcessing, progress, currentStep, error, onStateChange]);

  // 通知输出结果
  useEffect(() => {
    if (result) {
      onOutputReady(result, outputFileName);
    }
  }, [result, outputFileName, onOutputReady]);

  const handleStartConversion = () => {
    if (!textInput.trim()) return;

    startTextToSpeech(textInput, {
      voiceModel,
      speed,
      pitch
    });
  };

  const handleDownload = () => {
    if (result) {
      const url = URL.createObjectURL(result);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-4">
      {/* 文本统计信息 */}
      {textInput && (
        <div className="bg-blue-50 rounded-lg p-3 space-y-1">
          <p className="text-sm font-medium text-blue-900">文本信息</p>
          <p className="text-xs text-blue-700">
            字符数: {textInput.length} |
            字数: {textInput.trim() ? textInput.trim().split(/\s+/).length : 0} |
            行数: {textInput.split('\n').length}
          </p>
        </div>
      )}

      {/* 语音设置 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="speed">语速: {speed}</Label>
          <Input
            id="speed"
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
          />
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button
          onClick={handleStartConversion}
          disabled={!textInput.trim() || isProcessing}
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