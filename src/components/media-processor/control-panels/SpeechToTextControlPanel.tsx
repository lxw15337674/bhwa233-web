'use client';
import React from 'react';
import { ControlPanelProps } from '@/types/media-processor';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '../../ui/textarea';
import { useAppStore } from '@/stores/media-processor/app-store';
import { useSpeechToTextStore } from '@/stores/media-processor/speech-to-text-store';
import { Copy, Download, FileText, Loader2 } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';

export const SpeechToTextControlPanel: React.FC<ControlPanelProps> = (props) => {
  const { t } = useTranslation();
  // 从 app store 获取数据
  const inputAudio = useAppStore(state => state.inputAudio);

  // 优先使用 props，否则使用 store 的数据
  const selectedFile = props.selectedFile ?? inputAudio;

  // 从 speech-to-text store 获取状态和方法
  const isProcessing = useSpeechToTextStore(state => state.isProcessing);
  const progress = useSpeechToTextStore(state => state.progress);
  const currentStep = useSpeechToTextStore(state => state.currentStep);
  const error = useSpeechToTextStore(state => state.error);
  const result = useSpeechToTextStore(state => state.result);
  const outputFileName = useSpeechToTextStore(state => state.outputFileName);
  const startTranscription = useSpeechToTextStore(state => state.startTranscription);
  const resetState = useSpeechToTextStore(state => state.resetState);

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
        console.error(t('audioControlPanels.speechToText.copyFailed'), error);
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
                  {t('audioControlPanels.speechToText.recognizing')}
                </>
              ) : (
                  t('audioControlPanels.speechToText.startRecognition')
              )}
            </Button>

            <Button onClick={resetState} variant="outline" size="lg">
              {t('audioControlPanels.speechToText.reset')}
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
                {t('audioControlPanels.speechToText.recognitionResult')}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={handleCopyToClipboard}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4" />
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
              {t('audioControlPanels.speechToText.saveAs')}: {outputFileName}
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