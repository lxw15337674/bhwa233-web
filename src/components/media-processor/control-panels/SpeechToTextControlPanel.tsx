'use client';
import React, { useEffect } from 'react';
import { ControlPanelProps } from '@/types/media-processor';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { Textarea } from '../../ui/textarea';
import { Input } from '../../ui/input';

export const SpeechToTextControlPanel: React.FC<ControlPanelProps> = ({
  selectedFile,
  onStateChange,
  onOutputReady
}) => {
  const {
    isProcessing,
    progress,
    currentStep,
    error,
    result,
    outputFileName,
    startTranscription,
    resetState
  } = useSpeechToText();

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
      const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
      onOutputReady(blob, outputFileName);
    }
  }, [result, outputFileName, onOutputReady]);

  const handleStartTranscription = () => {
    if (!selectedFile) return;
    startTranscription(selectedFile);
  };

  const handleDownload = () => {
    if (result) {
      const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyToClipboard = async () => {
    if (result) {
      try {
        await navigator.clipboard.writeText(result);
        // 可以添加一个toast提示
      } catch (error) {
        console.error('复制失败:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button 
          onClick={handleStartTranscription} 
          disabled={!selectedFile || isProcessing}
          className="flex-1"
        >
          {isProcessing ? '识别中...' : '开始语音识别'}
        </Button>
        
        <Button onClick={resetState} variant="outline">
          重置
        </Button>
      </div>

      {/* 文本预览区域 */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm text-gray-700">识别结果：</h4>
            <div className="flex gap-2">
              <Button 
                onClick={handleCopyToClipboard} 
                variant="outline" 
                size="sm"
              >
                复制文本
              </Button>
              <Button 
                onClick={handleDownload} 
                variant="outline" 
                size="sm"
              >
                下载文件
              </Button>
            </div>
          </div>
          <Textarea
            value={result}
            readOnly
          />
          <div className="text-xs text-gray-500">
            文件将保存为: {outputFileName}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 