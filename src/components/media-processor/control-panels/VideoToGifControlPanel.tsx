'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Play, Download, Settings2 } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useAppStore } from '@/stores/media-processor/app-store';
import { useFFmpegStore } from '@/stores/ffmpeg-store';
import { fetchFile } from '@ffmpeg/util';
import { downloadBlob, getFileExtension } from '@/utils/audioConverter';
import { safeCleanupFiles, createFFmpegProgressListener } from '@/utils/ffmpeg-helpers';

export const VideoToGifControlPanel: React.FC = () => {
    const { t } = useTranslation();

    // Store access
    const selectedFile = useAppStore(state => state.selectedFile);
    const processingState = useAppStore(state => state.processingState);
    const startProcessing = useAppStore(state => state.startProcessing);
    const finishProcessing = useAppStore(state => state.finishProcessing);
    const setProcessingError = useAppStore(state => state.setProcessingError);
    const updateProcessingState = useAppStore(state => state.updateProcessingState);
    const resetAppStore = useAppStore(state => state.reset);

    const { ffmpeg, isMultiThread, isLoaded: ffmpegLoaded, isLoading: ffmpegLoading, error: ffmpegError } = useFFmpegStore();

    // Local state for GIF parameters（参考代码方式）
    const [fps, setFps] = useState<number>(10);
    const [resolution, setResolution] = useState<number>(480);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
    const [gifPreviewUrl, setGifPreviewUrl] = useState<string>('');

    // 创建视频预览URL
    useEffect(() => {
        if (selectedFile) {
            const url = URL.createObjectURL(selectedFile);
            setVideoPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [selectedFile]);

    // 处理输出文件的GIF预览
    useEffect(() => {
        if (processingState.outputFile) {
            const url = URL.createObjectURL(processingState.outputFile);
            setGifPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setGifPreviewUrl('');
        }
    }, [processingState.outputFile]);

    const canStartProcessing = selectedFile && ffmpeg && ffmpegLoaded && !processingState.isProcessing;

    const handleStartProcessing = async () => {
        if (!selectedFile || !ffmpeg || !canStartProcessing) return;

        const inputExtension = getFileExtension(selectedFile.name);
        const inputFileName = `input.${inputExtension}`;
        const outputFileName = `output.gif`;

        try {
            startProcessing();

            await ffmpeg.writeFile(inputFileName, await fetchFile(selectedFile));

            const progressListener = createFFmpegProgressListener((progress, step, remainingTime) => {
                updateProcessingState({ progress, currentStep: step, remainingTime });
            }, 'video'); // Reuse 'video' type for general progress or add 'gif' support in helper if needed

            // 添加详细日志监听器（用于调试）
            const detailedLogListener = ({ type, message }: { type: string; message: string }) => {
                console.log(`[FFmpeg ${type}] ${message}`);

                // 检测可能的错误或警告
                if (type === 'fferr' || message.includes('Error') || message.includes('error')) {
                    console.error('[FFmpeg Error]', message);
                }
            };

            ffmpeg.on('log', progressListener);
            ffmpeg.on('log', detailedLogListener);

            try {
                // 参考代码实现：单步转换（简单快速验证）
                // ffmpeg -i upload.mp4 -vf "fps=10,scale=720:-1:flags=lanczos" -f gif converted_file.gif
                
                updateProcessingState({ progress: 10, currentStep: '正在转换视频为 GIF...' });

                const args: string[] = [];
                if (isMultiThread) {
                    args.push('-threads', '0');
                }

                // 单步转换命令（完全按照参考代码）
                args.push(
                    '-i', inputFileName,
                    '-vf', `fps=${fps},scale=${resolution}:-1:flags=lanczos`,
                    '-f', 'gif',
                    '-y',
                    outputFileName
                );

                console.log('[GIF] 转换参数:', args);
                console.log('[GIF] 开始转换...');

                const ret = await ffmpeg.exec(args);

                console.log('[GIF] 转换完成，返回值:', ret);
                if (ret !== 0) {
                    throw new Error('GIF 转换失败');
                }

                updateProcessingState({ progress: 95, currentStep: '即将完成...' });

                const data = await ffmpeg.readFile(outputFileName);
                const outputBlob = new Blob([data], { type: 'image/gif' });

                console.log('[GIF] ✅ 转换成功！GIF 大小:', (data.byteLength / 1024).toFixed(2), 'KB');
                finishProcessing(outputBlob, outputFileName);
            } finally {
                ffmpeg.off('log', progressListener);
                ffmpeg.off('log', detailedLogListener);
                await safeCleanupFiles(ffmpeg, [inputFileName, outputFileName]);
            }

        } catch (error) {
            console.error('GIF conversion failed:', error);
            setProcessingError(error instanceof Error ? error.message : t('videoControlPanels.gif.conversionFailed'));
        }
    };

    const handleDownload = () => {
        if (processingState.outputFile && processingState.outputFileName) {
            downloadBlob(processingState.outputFile, processingState.outputFileName);
        }
    };

    const handleRestart = () => {
        resetAppStore();
    };

    return (
        <div className="space-y-4">
            {/* 文件名显示 */}
            {selectedFile && (
                <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">选中的文件:</p>
                    <p className="text-xs text-muted-foreground break-all">{selectedFile.name}</p>
                </div>
            )}

            {/* 预览区域 */}
            <div className="relative flex items-center justify-center border border-dashed border-border rounded-lg p-4 min-h-[350px] bg-muted/20">
                {processingState.isProcessing ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <div className="text-center">
                            <p className="text-lg font-medium mb-2">{Math.round(processingState.progress)}%</p>
                            <p className="text-sm text-muted-foreground">{processingState.currentStep || '正在处理...'}</p>
                        </div>
                    </div>
                ) : gifPreviewUrl ? (
                    <img src={gifPreviewUrl} alt="GIF Preview" className="max-w-full max-h-full rounded" />
                ) : videoPreviewUrl ? (
                    <video src={videoPreviewUrl} controls className="max-w-full max-h-full rounded" />
                ) : null}
            </div>

            {/* 转换设置面板 */}
            <Card className="bg-card border-border">
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="w-4 h-4" />
                        <h3 className="font-medium">GIF 设置</h3>
                    </div>

                    {/* FFmpeg 加载状态提示 */}
                    {ffmpegLoading && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                <p className="text-sm text-blue-900 dark:text-blue-100">
                                    正在加载 FFmpeg 引擎，请稍候...
                                </p>
                            </div>
                        </div>
                    )}

                    {/* FFmpeg 加载错误提示 */}
                    {ffmpegError && !ffmpegLoaded && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-900 dark:text-red-100 font-medium mb-1">
                                FFmpeg 加载失败
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300">
                                {ffmpegError}
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                请刷新页面重试，或检查网络连接
                            </p>
                        </div>
                    )}

                    {/* 参数控制 */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                                <span>FPS (帧率)</span>
                                <span className="text-primary font-medium">{fps}</span>
                            </Label>
                            <input
                                type="range"
                                min={5}
                                max={60}
                                value={fps}
                                onChange={(e) => setFps(parseInt(e.target.value))}
                                disabled={processingState.isProcessing}
                                className="w-full h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <p className="text-xs text-muted-foreground">
                                较低的 FPS 会减小文件大小，但可能影响流畅度
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label className="flex items-center justify-between">
                                <span>分辨率</span>
                                <span className="text-primary font-medium">{resolution}p</span>
                            </Label>
                            <input
                                type="range"
                                min={144}
                                max={2160}
                                step={1}
                                value={resolution}
                                onChange={(e) => setResolution(parseInt(e.target.value))}
                                disabled={processingState.isProcessing}
                                className="w-full h-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <p className="text-xs text-muted-foreground">
                                较高的分辨率会增加文件大小和转换时间
                            </p>
                        </div>
                    </div>

                    {/* 提示信息 */}
                    <div className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                        <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">📌 提示</p>
                        <p className="text-amber-800 dark:text-amber-200">
                            将转换整个视频为 GIF。所有处理都在本地浏览器中完成，文件不会上传到服务器。
                        </p>
                    </div>

                    {/* 转换按钮 */}
                    {!processingState.outputFile ? (
                        <Button
                            onClick={handleStartProcessing}
                            disabled={!canStartProcessing || processingState.isProcessing}
                            className="w-full"
                            size="lg"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            {processingState.isProcessing ? '正在转换...' : '开始转换'}
                        </Button>
                    ) : (
                        <div className="space-y-2">
                            <Button onClick={handleDownload} className="w-full" variant="default" size="lg">
                                <Download className="w-4 h-4 mr-2" />
                                    下载 GIF
                            </Button>
                            <Button onClick={handleRestart} variant="outline" className="w-full" size="sm">
                                    重新转换
                            </Button>
                            </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
