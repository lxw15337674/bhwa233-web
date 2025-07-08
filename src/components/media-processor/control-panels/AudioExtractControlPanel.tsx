'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Play } from 'lucide-react';
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
  SUPPORTED_VIDEO_FORMATS,
  getFileExtension
} from '@/utils/audioConverter';
import { ControlPanelProps } from '@/types/media-processor';
import { useMediaProcessing } from '@/hooks/useMediaProcessing';

interface AudioExtractParams {
  outputFormat: AudioFormat;
  qualityMode: QualityMode;
}

export const AudioExtractControlPanel: React.FC<ControlPanelProps> = ({
  selectedFile,
  mediaMetadata,
  audioInfo,
  ffmpeg,
  isMultiThread,
  ffmpegLoaded,
  isAnalyzing,
  analyzeError,
  onRetryAnalysis,
  onStateChange,
  onOutputReady
}) => {
  const [outputFormat, setOutputFormat] = React.useState<AudioFormat>('mp3');
  const [qualityMode, setQualityMode] = React.useState<QualityMode>('original');

  const {
    processingState,
    startProcessing,
    finishProcessing,
    setError,
    updateProgress,
    resetState
  } = useMediaProcessing();

  // 通知主容器状态变化
  React.useEffect(() => {
    onStateChange(processingState);
  }, [processingState, onStateChange]);

  // 文件大小预估
  const sizeEstimate = audioInfo ? calculateFileSize(
    audioInfo,
    outputFormat,
    qualityMode,
    mediaMetadata?.audio.codec
  ) : null;

  // 获取智能转换策略描述
  const smartParams = selectedFile && mediaMetadata ?
    generateSmartAudioParams(
      audioInfo,
      mediaMetadata.audio.codec,
      outputFormat,
      qualityMode
    ) : null;

  // 检查是否可以开始处理
  const canStartProcessing = selectedFile &&
    ffmpeg &&
    ffmpegLoaded &&
    !processingState.isProcessing &&
    !isAnalyzing &&
    SUPPORTED_VIDEO_FORMATS.includes(getFileExtension(selectedFile.name));

  // 处理音频提取
  const handleStartProcessing = async () => {
    if (!selectedFile || !ffmpeg || !canStartProcessing) return;

    try {
      startProcessing();

      const outputFileName = `${selectedFile.name.replace(/\.[^/.]+$/, '')}.${AUDIO_FORMATS[outputFormat].ext}`;

      const outputBlob = await convertAudio(
        selectedFile,
        ffmpeg,
        outputFormat,
        qualityMode,
        isMultiThread,
        audioInfo,
        mediaMetadata?.audio.codec,
        updateProgress
      );

      finishProcessing(outputBlob, outputFileName);
      onOutputReady(outputBlob, outputFileName);
    } catch (error) {
      console.error('Audio extraction failed:', error);
      setError(error instanceof Error ? error.message : '音频提取失败');
    }
  };

  // 下载文件
  const handleDownload = () => {
    if (processingState.outputFile && processingState.outputFileName) {
      downloadBlob(processingState.outputFile, processingState.outputFileName);
    }
  };

  // 重新开始
  const handleRestart = () => {
    resetState();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* 输出格式选择 */}
            {!processingState.outputFile ? (
              <Button
                onClick={handleStartProcessing}
                disabled={!canStartProcessing}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                {processingState.isProcessing ? '正在提取音频...' : '开始提取音频'}
              </Button>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载音频文件
                </Button>
                <Button
                  onClick={handleRestart}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  重新提取
                </Button>
              </div>
            )}

            {/* 显示不能处理的原因 */}
            {!canStartProcessing && selectedFile && !processingState.isProcessing && (
              <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  {!ffmpegLoaded ? '等待 FFmpeg 加载完成...' :
                    isAnalyzing ? '正在分析文件...' :
                      !SUPPORTED_VIDEO_FORMATS.includes(getFileExtension(selectedFile.name)) ?
                        '不支持的文件格式，请选择视频文件' : '请选择有效的视频文件'}
                </div>
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">
                  音频格式
                </label>
                {/* 多线程模式状态 */}
                {ffmpegLoaded && (
                  <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    FFmpeg 已就绪
                  </span>
                )}
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
                音频质量
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
                          <div className="font-medium text-sm">{mode.label}</div>
                          <div className="text-xs text-muted-foreground">{mode.description}</div>
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
                  提取预览
                </label>
                <div className="p-3 bg-muted/30 rounded-lg border">
                  <div className="text-xs text-muted-foreground mb-1">
                    预估输出文件大小
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        {formatFileSize(sizeEstimate.estimatedSizeMB)}
                      </span>
                      {sizeEstimate.compressionRatio > 0 && (
                        <span className="text-xs text-green-600 ml-2">
                          压缩 {sizeEstimate.compressionRatio.toFixed(0)}%
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      原文件: {formatFileSize(selectedFile.size / (1024 * 1024))}
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
                  <span className="text-sm text-blue-700 dark:text-blue-300">正在分析视频信息...</span>
                </div>
              </div>
            )}

            {/* 分析错误提示 */}
            {analyzeError && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                  {analyzeError}
                  <div className="mt-1 text-yellow-600 dark:text-yellow-400">
                    无法显示精确预估，请直接进行提取
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
                      等待 FFmpeg 加载完成后分析视频信息...
                    </div>
                  ) : (
                    '无法获取详细的音频信息，将使用默认设置进行提取'
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

export default AudioExtractControlPanel; 