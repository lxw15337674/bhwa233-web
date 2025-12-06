'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Download, Play, RotateCcw } from 'lucide-react';
import {
    AUDIO_SPEED_PRESETS,
    AudioSpeedPreset,
    AudioSpeedParams,
    convertAudioSpeed,
    calculateSpeedFileSize,
    formatFileSize,
    formatDuration,
    downloadBlob,
    SUPPORTED_AUDIO_FORMATS,
    getFileExtension
} from '@/utils/audioConverter';
import { ControlPanelProps } from '@/types/media-processor';
import { useMediaProcessing } from '@/hooks/useMediaProcessing';
import { useAppStore } from '@/stores/media-processor/app-store';

export const AudioSpeedControlPanel: React.FC<ControlPanelProps> = (props) => {
    // 从 app store 获取数据
    const inputAudio = useAppStore(state => state.inputAudio);
    const mediaMetadata = useAppStore(state => state.mediaMetadata);
    const audioInfo = useAppStore(state => state.audioInfo);
    const ffmpeg = useAppStore(state => state.ffmpeg);
    const isMultiThread = useAppStore(state => state.isMultiThread);
    const ffmpegLoaded = useAppStore(state => state.ffmpegLoaded);
    const isAnalyzing = useAppStore(state => state.isAnalyzing);
    const analyzeError = useAppStore(state => state.analyzeError);

    // 优先使用 props，否则使用 store 的数据
    const selectedFile = props.selectedFile ?? inputAudio;

    const [speed, setSpeed] = React.useState<number>(1.0);
    const [preservePitch, setPreservePitch] = React.useState<boolean>(true);
    const [selectedPreset, setSelectedPreset] = React.useState<AudioSpeedPreset>('1.0');

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
        props.onStateChange?.(processingState);
    }, [processingState, props.onStateChange]);

    // 文件大小预估
    const sizeEstimate = audioInfo ? calculateSpeedFileSize(
        audioInfo,
        speed,
        'mp3' // 倍速处理总是输出MP3格式以确保兼容性
    ) : null;

    // 检查是否可以开始处理
    const canStartProcessing = selectedFile &&
        ffmpeg &&
        ffmpegLoaded &&
        !processingState.isProcessing &&
        !isAnalyzing &&
        SUPPORTED_AUDIO_FORMATS.includes(getFileExtension(selectedFile.name));

    // 预设速度选择处理
    const handlePresetChange = (preset: AudioSpeedPreset) => {
        const presetSpeed = parseFloat(preset);
        setSpeed(presetSpeed);
        setSelectedPreset(preset);
    };

    // 自定义速度变化处理
    const handleSpeedChange = (newSpeed: number) => {
        setSpeed(newSpeed);
        // 找到最接近的预设，如果没有则清除预设选择
        const closestPreset = Object.keys(AUDIO_SPEED_PRESETS).find(
            preset => Math.abs(parseFloat(preset) - newSpeed) < 0.01
        ) as AudioSpeedPreset | undefined;
        setSelectedPreset(closestPreset || '1.0');
    };

    // 处理音频倍速调整
    const handleStartProcessing = async () => {
        if (!selectedFile || !ffmpeg || !canStartProcessing) return;

        try {
            startProcessing();

            const params: AudioSpeedParams = {
                speed,
                preservePitch
            };

            const result = await convertAudioSpeed(
                selectedFile,
                ffmpeg,
                params,
                isMultiThread,
                audioInfo,
                updateProgress
            );

            const outputFileName = `${selectedFile.name.replace(/\.[^/.]+$/, '')}_speed_${speed}x.mp3`;

            finishProcessing(result.outputFile, outputFileName);
            props.onOutputReady?.(result.outputFile, outputFileName);
        } catch (error) {
            console.error('Audio speed adjustment failed:', error);
            setError(error instanceof Error ? error.message : '音频倍速调整失败');
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
                        {!processingState.outputFile ? (
                            <Button
                                onClick={handleStartProcessing}
                                disabled={!canStartProcessing}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                size="lg"
                            >
                                <Play className="w-4 h-4 mr-2" />
                                {processingState.isProcessing ? '正在调整倍速...' : '开始调整倍速'}
                            </Button>
                        ) : (
                            <div className="space-y-2">
                                <Button
                                    onClick={handleDownload}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    size="lg"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    下载调整结果
                                </Button>
                                <Button
                                    onClick={handleRestart}
                                    variant="outline"
                                    className="w-full"
                                    size="sm"
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    重新调整
                                </Button>
                            </div>
                        )}

                        {/* 显示不能处理的原因 */}
                        {!canStartProcessing && selectedFile && !processingState.isProcessing && (
                            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded border border-yellow-200 dark:border-yellow-800">
                                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                    {!ffmpegLoaded ? '等待 FFmpeg 加载完成...' :
                                        isAnalyzing ? '正在分析文件...' :
                                            !SUPPORTED_AUDIO_FORMATS.includes(getFileExtension(selectedFile.name)) ?
                                                '不支持的文件格式，请选择音频文件' : '请选择有效的音频文件'}
                                </div>
                            </div>
                        )}

                        {/* 预设速度选择 */}
                        <div>
                            <Label className="text-sm font-medium text-foreground mb-2 block">
                                快速选择倍速
                            </Label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(AUDIO_SPEED_PRESETS).map(([preset, config]) => (
                                    <div
                                        key={preset}
                                        className={`border rounded-lg p-2 cursor-pointer transition-all text-center ${selectedPreset === preset
                                                ? 'border-primary bg-primary/10 ring-1 ring-primary'
                                                : 'border-border hover:border-muted-foreground hover:bg-accent'
                                            } ${processingState.isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => !processingState.isProcessing && handlePresetChange(preset as AudioSpeedPreset)}
                                    >
                                        <div className="font-medium text-sm">{config.label}</div>
                                        <div className="text-xs text-muted-foreground">{config.description}</div>
                                        {selectedPreset === preset && (
                                            <CheckCircle2 className="h-3 w-3 text-primary mx-auto mt-1" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 自定义倍速设置 */}
                        <div>
                            <Label htmlFor="custom-speed" className="text-sm font-medium text-foreground mb-2 block">
                                自定义倍速 (0.5x - 4.0x)
                            </Label>
                            <div className="space-y-3">
                                <Slider
                                    id="custom-speed"
                                    min={0.5}
                                    max={4.0}
                                    step={0.1}
                                    value={[speed]}
                                    onValueChange={(value) => !processingState.isProcessing && handleSpeedChange(value[0])}
                                    disabled={processingState.isProcessing}
                                    className="w-full"
                                />
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        min={0.5}
                                        max={4.0}
                                        step={0.1}
                                        value={speed}
                                        onChange={(e) => !processingState.isProcessing && handleSpeedChange(parseFloat(e.target.value) || 1.0)}
                                        disabled={processingState.isProcessing}
                                        className="w-20"
                                    />
                                    <span className="text-sm text-muted-foreground">倍</span>
                                </div>
                            </div>
                        </div>

                        {/* 音调保持选项 */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="preserve-pitch"
                                checked={preservePitch}
                                onCheckedChange={(checked) => !processingState.isProcessing && setPreservePitch(checked as boolean)}
                                disabled={processingState.isProcessing}
                            />
                            <Label htmlFor="preserve-pitch" className="text-sm">
                                保持音调不变 (推荐)
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            勾选后音调保持不变，仅调整播放速度。取消勾选会同时改变音调和速度。
                        </p>

                        {/* 预估信息 */}
                        {selectedFile && audioInfo && sizeEstimate && (
                            <div className="pt-4 border-t border-border/50">
                                <Label className="text-sm font-medium text-foreground mb-3 block">
                                    调整预览
                                </Label>

                                {/* 时长变化 */}
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-3">
                                    <div className="text-xs text-blue-700 dark:text-blue-300 mb-1">
                                        时长变化
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className="text-sm font-medium text-foreground">
                                                {formatDuration(audioInfo.duration / speed)}
                                            </span>
                                            {speed !== 1.0 && (
                                                <span className="text-xs text-blue-600 ml-2">
                                                    {speed > 1.0 ? '缩短' : '延长'} {Math.abs(((audioInfo.duration / speed) - audioInfo.duration) / audioInfo.duration * 100).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            原时长: {formatDuration(audioInfo.duration)}
                                        </div>
                                    </div>
                                </div>

                                {/* 文件大小预估 */}
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
                                                    减小 {sizeEstimate.compressionRatio.toFixed(0)}%
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
                                    <span className="text-sm text-blue-700 dark:text-blue-300">正在分析音频信息...</span>
                                </div>
                            </div>
                        )}

                        {/* 分析错误提示 */}
                        {analyzeError && (
                            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                <div className="text-xs text-yellow-700 dark:text-yellow-300">
                                    {analyzeError}
                                    <Button
                                        onClick={props.onRetryAnalysis}
                                        variant="outline"
                                        size="sm"
                                        className="mt-1"
                                    >
                                        重试
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}; 