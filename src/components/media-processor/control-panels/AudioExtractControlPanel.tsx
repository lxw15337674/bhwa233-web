'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useAppStore } from '@/stores/media-processor/app-store';
import { useFFmpegStore } from '@/stores/ffmpeg-store';
import {
    detectAudioTracks,
    extractAudioTrack,
    getOutputExtension,
    formatChannelLayout,
    formatBitrate,
    formatSampleRate,
    validateVideoFile,
    generateOutputFileName,
    type AudioTrack
} from '@/utils/audioExtractor';
import { downloadBlob } from '@/utils/audioConverter';

export const AudioExtractControlPanel: React.FC = () => {
    const { t } = useTranslation();

    // Store 状态
    const selectedFile = useAppStore(state => state.selectedFile);
    const processingState = useAppStore(state => state.processingState);
    const startProcessing = useAppStore(state => state.startProcessing);
    const finishProcessing = useAppStore(state => state.finishProcessing);
    const setProcessingError = useAppStore(state => state.setProcessingError);
    const updateProcessingState = useAppStore(state => state.updateProcessingState);

    const { ffmpeg, isLoaded: ffmpegLoaded } = useFFmpegStore();

    // 本地状态
    const [isDetecting, setIsDetecting] = React.useState(false);
    const [detectionProgress, setDetectionProgress] = React.useState(0);
    const [detectionStatus, setDetectionStatus] = React.useState('');
    const [audioTracks, setAudioTracks] = React.useState<AudioTrack[]>([]);
    const [selectedTrackIndex, setSelectedTrackIndex] = React.useState<number>(0);
    const [detectionError, setDetectionError] = React.useState<string>('');
    const [fileError, setFileError] = React.useState<string>('');

    // 检测音轨
    const detectTracks = React.useCallback(async () => {
        if (!selectedFile || !ffmpeg || !ffmpegLoaded) return;

        // 验证文件
        const validation = validateVideoFile(selectedFile, t);
        if (!validation.valid) {
            setFileError(validation.error || t('audioControlPanels.extract.unsupportedFormat'));
            return;
        }

        setFileError('');
        setIsDetecting(true);
        setDetectionError('');
        setDetectionProgress(0);
        setDetectionStatus(t('audioControlPanels.extract.detectingTracks'));

        try {
            const result = await detectAudioTracks(
                selectedFile,
                ffmpeg,
                (progress, status) => {
                    setDetectionProgress(progress);
                    setDetectionStatus(status);
                },
                t
            );

            if (!result.hasAudio) {
                setDetectionError(t('audioControlPanels.extract.noAudioTrack'));
                setAudioTracks([]);
                return;
            }

            setAudioTracks(result.tracks);
            // 默认选择第一个默认轨或第一个轨道
            const defaultTrack = result.tracks.find(t => t.isDefault);
            setSelectedTrackIndex(defaultTrack ? defaultTrack.index : 0);
        } catch (error) {
            console.error('Track detection failed:', error);
            setDetectionError(error instanceof Error ? error.message : t('audioControlPanels.extract.extractFailed'));
        } finally {
            setIsDetecting(false);
            setDetectionProgress(0);
            setDetectionStatus('');
        }
    }, [selectedFile, ffmpeg, ffmpegLoaded, t]);

    // 当文件改变时自动检测音轨
    React.useEffect(() => {
        if (selectedFile && ffmpeg && ffmpegLoaded && !processingState.isProcessing) {
            detectTracks();
        } else {
            setAudioTracks([]);
            setDetectionError('');
            setFileError('');
        }
    }, [selectedFile, ffmpeg, ffmpegLoaded]);

    // 提取音频
    const handleExtract = async () => {
        if (!selectedFile || !ffmpeg || audioTracks.length === 0) return;

        const selectedTrack = audioTracks.find(t => t.index === selectedTrackIndex);
        if (!selectedTrack) return;

        try {
            startProcessing();

            const outputExt = getOutputExtension(selectedTrack.codec);
            const outputFileName = generateOutputFileName(
                selectedFile.name,
                outputExt,
                selectedTrack.index,
                selectedTrack.language
            );

            const audioBlob = await extractAudioTrack(
                selectedFile,
                ffmpeg,
                selectedTrack.index,
                outputExt,
                (progress) => {
                    updateProcessingState({ progress });
                },
                t
            );

            finishProcessing(audioBlob, outputFileName);
        } catch (error) {
            console.error('Audio extraction failed:', error);
            setProcessingError(
                error instanceof Error ? error.message : t('audioControlPanels.extract.extractFailed')
            );
        }
    };

    // 获取文件大小警告
    const getFileSizeWarning = () => {
        if (!selectedFile) return null;

        const size = selectedFile.size;
        const sizeInMB = size / (1024 * 1024);

        if (sizeInMB > 500) {
            return t('audioControlPanels.extract.fileSizeWarning');
        }

        return null;
    };

    const fileSizeWarning = getFileSizeWarning();

    // 检查是否可以开始提取
    const canExtract = selectedFile &&
        ffmpeg &&
        ffmpegLoaded &&
        audioTracks.length > 0 &&
        !processingState.isProcessing &&
        !isDetecting &&
        !fileError;

    // 处理完成状态
    if (processingState.isComplete && processingState.outputBlob) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {/* 成功提示 */}
                        <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <div className="flex-1">
                                <p className="font-medium text-green-900 dark:text-green-100">
                                    {t('audioControlPanels.extract.extractSuccess')}
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                    {processingState.outputFileName}
                                </p>
                            </div>
                        </div>

                        {/* 下载按钮 */}
                        <Button
                            onClick={() => {
                                if (processingState.outputBlob && processingState.outputFileName) {
                                    downloadBlob(processingState.outputBlob, processingState.outputFileName);
                                }
                            }}
                            className="w-full"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            {t('audioControlPanels.extract.downloadAudio')}
                        </Button>

                        {/* 转换提示 */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                                💡 {t('audioControlPanels.extract.convertPrompt')}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    window.location.href = '/media-processor?category=audio&function=audio-convert';
                                }}
                                className="w-full"
                            >
                                {t('audioControlPanels.extract.convertButton')} →
                            </Button>
                        </div>

                        {/* 重新提取 */}
                        <Button
                            variant="outline"
                            onClick={() => {
                                useAppStore.getState().reset();
                                detectTracks();
                            }}
                            className="w-full"
                        >
                            {t('audioControlPanels.extract.reextract')}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    {/* FFmpeg 加载提示 */}
                    {!ffmpegLoaded && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                                {t('audioControlPanels.extract.waitingFFmpeg')}
                            </p>
                        </div>
                    )}

                    {/* 文件信息 */}
                    {selectedFile && (
                        <div className="space-y-2">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{selectedFile.name}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 文件大小警告 */}
                            {fileSizeWarning && (
                                <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-yellow-900 dark:text-yellow-100">
                                        {fileSizeWarning}
                                    </p>
                                </div>
                            )}

                            {/* 文件格式错误 */}
                            {fileError && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-red-900 dark:text-red-100 font-medium">
                                            {fileError}
                                        </p>
                                        <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                            {t('audioControlPanels.extract.supportedFormats')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 检测中 */}
                    {isDetecting && (
                        <div className="flex items-center justify-center p-8">
                            <div className="flex flex-col items-center gap-3 w-full max-w-sm">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <div className="w-full space-y-2">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                        {detectionStatus}
                                    </p>
                                    {/* 进度条 */}
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${detectionProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 text-center">
                                        {detectionProgress}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 检测错误 */}
                    {detectionError && (
                        <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-900 dark:text-red-100">
                                {detectionError}
                            </p>
                        </div>
                    )}

                    {/* 音轨列表 */}
                    {!isDetecting && audioTracks.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">
                                    🎵 {t('audioControlPanels.extract.tracksFound', { count: audioTracks.length })}
                                </h3>
                            </div>

                            <div className="space-y-2">
                                {audioTracks.map((track) => {
                                    const outputExt = getOutputExtension(track.codec);
                                    const isSelected = track.index === selectedTrackIndex;

                                    return (
                                        <button
                                            key={track.index}
                                            onClick={() => setSelectedTrackIndex(track.index)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${isSelected
                                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium">
                                                            {t('audioControlPanels.extract.trackInfo', { index: track.index + 1 })}
                                                        </span>
                                                        {track.isDefault && (
                                                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded">
                                                                {t('audioControlPanels.extract.defaultTrack')}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                                        <p>
                                                            {track.codec.toUpperCase()}, {formatBitrate(track.bitrate)}, {formatChannelLayout(track.channelLayout, t)}, {formatSampleRate(track.sampleRate)}
                                                        </p>
                                                        {track.language && (
                                                            <p>
                                                                {t('audioControlPanels.extract.language')}: {track.language}
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                                            {t('audioControlPanels.extract.output')}: {generateOutputFileName(selectedFile?.name || '', outputExt, track.index, track.language)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {isSelected && (
                                                    <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 提取按钮 */}
                    {!processingState.isComplete && (
                        <Button
                            onClick={handleExtract}
                            disabled={!canExtract}
                            className="w-full"
                        >
                            {processingState.isProcessing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('audioControlPanels.extract.extracting')} {processingState.progress}%
                                </>
                            ) : (
                                t('audioControlPanels.extract.extractButton')
                            )}
                        </Button>
                    )}

                    {/* 错误提示 */}
                    {processingState.error && (
                        <div className="flex items-start gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-red-900 dark:text-red-100">
                                    {processingState.error}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
