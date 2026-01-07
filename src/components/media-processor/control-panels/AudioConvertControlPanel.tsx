'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  AUDIO_FORMATS,
  QUALITY_MODES,
  AudioFormat,
  QualityMode,
  formatFileSize,
  calculateFileSize,
  generateSmartAudioParams,
  convertAudio,
  downloadBlob,
  SUPPORTED_AUDIO_FORMATS,
  getFileExtension
} from '@/utils/audioConverter';
// import { ControlPanelProps } from '@/types/media-processor'; // No longer needed
// import { useMediaProcessing } from '@/hooks/useMediaProcessing'; // No longer needed
import { useAppStore } from '@/stores/media-processor/app-store';
import { useFFmpegStore } from '@/stores/ffmpeg-store';

export const AudioConvertControlPanel: React.FC = () => { // No props received
  const t = useTranslations();
  
  // 从 app store 获取数据和 actions
  const selectedFile = useAppStore(state => state.selectedFile);
  const mediaMetadata = useAppStore(state => state.mediaMetadata);
  const audioInfo = useAppStore(state => state.audioInfo);
  const isAnalyzing = useAppStore(state => state.isAnalyzing);
  const analyzeError = useAppStore(state => state.analyzeError);
  const processingState = useAppStore(state => state.processingState);
  const startProcessing = useAppStore(state => state.startProcessing);
  const finishProcessing = useAppStore(state => state.finishProcessing);
  const setProcessingError = useAppStore(state => state.setProcessingError);
  const updateProcessingState = useAppStore(state => state.updateProcessingState);
  const resetAppStore = useAppStore(state => state.reset); // Reset the whole app store for a fresh start

  // 从 ffmpeg store 获取数据
  const { ffmpeg, isMultiThread, isLoaded: ffmpegLoaded } = useFFmpegStore();

  const [outputFormat, setOutputFormat] = React.useState<AudioFormat>('mp3');
  const [qualityMode, setQualityMode] = React.useState<QualityMode>('original');

  // 文件大小预估
  const sizeEstimate = audioInfo ? calculateFileSize(
    audioInfo,
    outputFormat,
    qualityMode,
    mediaMetadata?.audio?.codec
  ) : null;

  // 获取智能转换策略描述
  const smartParams = selectedFile && mediaMetadata ?
    generateSmartAudioParams(
      audioInfo,
      mediaMetadata?.audio?.codec,
      outputFormat,
      qualityMode
    ) : null;

  // 检查是否可以开始处理
  const canStartProcessing = selectedFile &&
    ffmpeg &&
    ffmpegLoaded &&
    !processingState.isProcessing &&
    !isAnalyzing &&
    SUPPORTED_AUDIO_FORMATS.includes(getFileExtension(selectedFile.name));

  // 处理音频转换
  const handleStartProcessing = async () => {
    if (!selectedFile || !ffmpeg || !canStartProcessing) return;

    try {
      startProcessing(); // 启动处理状态
      
      const outputFileName = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.${AUDIO_FORMATS[outputFormat].ext}`;

      const outputBlob = await convertAudio(
        selectedFile,
        ffmpeg,
        outputFormat,
        qualityMode,
        isMultiThread,
        audioInfo,
        mediaMetadata?.audio?.codec,
        (progress, step, remainingTime) => updateProcessingState({ progress, currentStep: step, remainingTime }), // 更新进度回调
        t
      );

      finishProcessing(outputBlob, outputFileName); // 完成处理状态
    } catch (error) {
      console.error('Audio conversion failed:', error);
      setProcessingError(error instanceof Error ? error.message : t('audioControlPanels.convert.conversionFailed'));
    }
  };

  // 下载文件
  const handleDownload = () => {
    if (processingState.outputFile && processingState.outputFileName) {
      downloadBlob(processingState.outputFile, processingState.outputFileName);
    }
  };

  // 重新开始 (重置整个 Store)
  const handleRestart = () => {
    resetAppStore();
  };
  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="space-y-4">
            {!processingState.outputFile ? (
              <Button
                onClick={handleStartProcessing}
                disabled={!canStartProcessing}
                className="w-full"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                {processingState.isProcessing ? t('audioControlPanels.convert.converting') : t('audioControlPanels.convert.startConvert')}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleDownload}
                  className="w-full"
                  variant="default"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                    {t('audioControlPanels.convert.downloadResult')}
                </Button>
                <Button
                  onClick={handleRestart}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                    {t('audioControlPanels.convert.reconvert')}
                </Button>
              </div>
            )}

            {/* 显示不能处理的原因 */}
            {!canStartProcessing && selectedFile && !processingState.isProcessing && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  {!ffmpegLoaded ? t('audioControlPanels.convert.waitingFFmpeg') :
                    isAnalyzing ? t('audioControlPanels.convert.analyzingFile') :
                      !SUPPORTED_AUDIO_FORMATS.includes(getFileExtension(selectedFile.name)) ?
                        t('audioControlPanels.convert.unsupportedFormat') : t('audioControlPanels.convert.selectValidFile')}
                </div>
              </div>
            )}
            {/* 输出格式选择 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  {t('audioControlPanels.convert.targetFormat')}
                </label>

              </div>
              <Select
                value={outputFormat}
                onValueChange={(value) => setOutputFormat(value as AudioFormat)}
                disabled={processingState.isProcessing}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {Object.entries(AUDIO_FORMATS).map(([key, format]) => (
                    <SelectItem key={key} value={key} className="hover:bg-accent">
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 音频质量选择 */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                {t('audioControlPanels.convert.conversionQuality')}
              </label>
              <div className="space-y-2">
                {Object.entries(QUALITY_MODES).map(([key, mode]) => (
                  <div
                    key={key}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${qualityMode === key
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground hover:bg-accent'
                      } ${processingState.isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => !processingState.isProcessing && setQualityMode(key as QualityMode)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{mode.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{t(`audioConverter.qualityModes.${key}.label`)}</div>
                          <div className="text-xs text-muted-foreground">{t(`audioConverter.qualityModes.${key}.description`)}</div>
                          {/* 显示智能转换策略 */}
                          {smartParams && qualityMode === key && (
                            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              {smartParams.description}
                            </div>
                          )}
                        </div>
                      </div>
                      {qualityMode === key && (
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 文件大小预估 */}
            {selectedFile && sizeEstimate && (
              <div className="pt-4 border-t border-border/50">
                <label className="text-sm font-medium text-foreground mb-3 block">
                  {t('audioControlPanels.convert.conversionPreview')}
                </label>
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-1">
                    {t('audioControlPanels.convert.estimatedSize')}
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {formatFileSize(sizeEstimate.estimatedSizeMB)}
                      </span>
                      {sizeEstimate.compressionRatio > 0 && (
                        <span className="text-xs text-green-600 ml-2">
                          {t('audioControlPanels.convert.compressed')} {sizeEstimate.compressionRatio.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('audioControlPanels.convert.originalFile')}: {formatFileSize(selectedFile.size / (1024 * 1024))}
                    </div>
                  </div>
                  {sizeEstimate.note && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {sizeEstimate.note}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 分析状态显示 */}
            {isAnalyzing && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-blue-700 dark:text-blue-300">{t('audioControlPanels.convert.analyzingAudio')}</span>
                </div>
              </div>
            )}

            {/* 分析错误提示 */}
            {analyzeError && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  {t(analyzeError)}
                  <div className="mt-1 text-yellow-600 dark:text-yellow-400">
                    {t('audioControlPanels.convert.cannotAnalyze')}
                  </div>
                </div>
              </div>
            )}

            {/* 无音频信息时的提示 */}
            {!isAnalyzing && !audioInfo && !analyzeError && selectedFile && (
              <div className="p-3 bg-muted/20 rounded-lg border">
                <div className="text-xs text-muted-foreground">
                  {!ffmpegLoaded ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                      {t('audioControlPanels.convert.waitingFFmpegAnalysis')}
                    </div>
                  ) : (
                      t('audioControlPanels.convert.noAudioInfo')
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


    </div>
  );
};