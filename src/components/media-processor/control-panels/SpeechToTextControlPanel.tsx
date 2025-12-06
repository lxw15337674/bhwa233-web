'use client';
import React, { useEffect } from 'react';
import { ControlPanelProps } from '@/types/media-processor';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { Textarea } from '../../ui/textarea';
import { useAppStore } from '@/stores/media-processor/app-store';
import { Copy, Download, FileText, Loader2 } from 'lucide-react';

export const SpeechToTextControlPanel: React.FC<ControlPanelProps> = (props) => {
  // 从 app store 获取数据
  const inputAudio = useAppStore(state => state.inputAudio);

  // 优先使用 props，否则使用 store 的数据
  const selectedFile = props.selectedFile ?? inputAudio;

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
    props.onStateChange?.({
      isProcessing,
      progress,
      currentStep,
      error
    });
  }, [isProcessing, progress, currentStep, error, props.onStateChange]);

  // 通知输出结果
  useEffect(() => {
    if (result) {
      const blob = new Blob([result], { type: 'text/plain;charset=utf-8' });
      props.onOutputReady?.(blob, outputFileName);
    }
  }, [result, outputFileName, props.onOutputReady]);

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
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Button
              onClick={handleStartTranscription}
              disabled={!selectedFile || isProcessing}
              className="flex-1"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  识别中...
                </>
              ) : (
                '开始语音识别'
              )}
            </Button>

            <Button onClick={resetState} variant="outline" size="lg">
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 识别结果卡片 */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                识别结果
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyToClipboard}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  复制
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-1" />
                  下载
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={result}
              readOnly
              className="min-h-[300px] resize-none bg-muted/30 border-muted"
            />
            <p className="text-xs text-muted-foreground mt-2">
              文件将保存为: {outputFileName}
            </p>
          </CardContent>
        </Card>
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