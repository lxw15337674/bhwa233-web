'use client';

import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/TranslationProvider';

interface VideoTimeRangeSliderProps {
    /** 视频总时长（秒） */
    duration: number;
    /** 开始时间（秒） */
    startTime: number;
    /** 结束时间（秒） */
    endTime: number;
    /** 最大选择时长（秒），默认10秒 */
    maxDuration?: number;
    /** 时间变化回调 */
    onChange: (startTime: number, endTime: number) => void;
    /** 当前时间（用于预览窗口同步） */
    onSeek?: (time: number) => void;
    /** 是否禁用 */
    disabled?: boolean;
}

export const VideoTimeRangeSlider: React.FC<VideoTimeRangeSliderProps> = ({
    duration,
    startTime,
    endTime,
    maxDuration = 10,
    onChange,
    onSeek,
    disabled = false
}) => {
    const { t } = useTranslation();
    const [localStart, setLocalStart] = useState(startTime);
    const [localEnd, setLocalEnd] = useState(endTime);

    useEffect(() => {
        setLocalStart(startTime);
        setLocalEnd(endTime);
    }, [startTime, endTime]);

    const handleSliderChange = (values: number[]) => {
        let [newStart, newEnd] = values;

        // 强制限制最小时长为1秒
        const minDuration = 1;
        const selectedDuration = newEnd - newStart;

        if (selectedDuration < minDuration) {
            // 如果时长小于1秒，根据拖动方向调整
            if (newEnd !== localEnd) {
                // 用户在拖右滑块，向右扩展到至少1秒
                newEnd = newStart + minDuration;
            } else {
                // 用户在拖左滑块，向左扩展到至少1秒
                newStart = newEnd - minDuration;
            }
        }

        // 强制限制最大时长
        if (newEnd - newStart > maxDuration) {
            // 滑动窗口模式：如果拖动右侧超出限制，推动左侧
            if (newEnd !== localEnd) {
                // 用户在拖右滑块
                newStart = newEnd - maxDuration;
            } else {
                // 用户在拖左滑块
                newEnd = newStart + maxDuration;
            }
        }

        // 确保不超出视频总时长
        if (newEnd > duration) {
            newEnd = duration;
            newStart = Math.max(0, newEnd - Math.min(maxDuration, newEnd));
            // 确保至少1秒
            if (newEnd - newStart < minDuration) {
                newStart = Math.max(0, newEnd - minDuration);
            }
        }
        if (newStart < 0) {
            newStart = 0;
            newEnd = Math.min(duration, newStart + maxDuration);
            // 确保至少1秒
            if (newEnd - newStart < minDuration) {
                newEnd = Math.min(duration, newStart + minDuration);
            }
        }

        setLocalStart(newStart);
        setLocalEnd(newEnd);
        onChange(newStart, newEnd);

        // 如果有seek回调，跟随右滑块（结束位置）
        if (onSeek) {
            onSeek(newEnd);
        }
    };

    const handleStartInputChange = (value: string) => {
        const newStart = Math.max(0, Math.min(parseFloat(value) || 0, duration));
        let newEnd = localEnd;

        // 确保时长至少1秒
        if (newEnd - newStart < 1) {
            newEnd = Math.min(duration, newStart + 1);
        }

        // 确保时长不超过最大限制
        if (newEnd - newStart > maxDuration) {
            newEnd = newStart + maxDuration;
        }

        setLocalStart(newStart);
        setLocalEnd(newEnd);
        onChange(newStart, newEnd);
    };

    const handleEndInputChange = (value: string) => {
        const newEnd = Math.max(0, Math.min(parseFloat(value) || 0, duration));
        let newStart = localStart;

        // 确保时长至少1秒
        if (newEnd - newStart < 1) {
            newStart = Math.max(0, newEnd - 1);
        }

        // 确保时长不超过最大限制
        if (newEnd - newStart > maxDuration) {
            newStart = newEnd - maxDuration;
        }

        setLocalStart(newStart);
        setLocalEnd(newEnd);
        onChange(newStart, newEnd);
    };

    const handlePreviewClip = () => {
        if (onSeek) {
            onSeek(localStart);
        }
    };

    const selectedDuration = localEnd - localStart;
    const isMaxDuration = selectedDuration >= maxDuration;

    return (
        <div className="space-y-4">
            {/* 双滑块时间轴 */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label>{t('videoControlPanels.gif.timeRange')}</Label>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                            {t('videoControlPanels.gif.selected')}: {selectedDuration.toFixed(1)}s
                        </span>
                        {isMaxDuration && (
                            <span className="text-amber-600 dark:text-amber-400">
                                ({t('videoControlPanels.gif.maxDuration')})
                            </span>
                        )}
                    </div>
                </div>

                <Slider
                    value={[localStart, localEnd]}
                    onValueChange={handleSliderChange}
                    min={0}
                    max={duration}
                    step={0.1}
                    disabled={disabled}
                    className="py-4"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0:00</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* 精确时间输入 */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-xs">{t('videoControlPanels.gif.startTime')}</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="0"
                            max={duration}
                            step="0.1"
                            value={localStart.toFixed(1)}
                            onChange={(e) => handleStartInputChange(e.target.value)}
                            disabled={disabled}
                            className="text-xs"
                        />
                        <span className="text-xs text-muted-foreground">s</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-xs">{t('videoControlPanels.gif.endTime')}</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            min="0"
                            max={duration}
                            step="0.1"
                            value={localEnd.toFixed(1)}
                            onChange={(e) => handleEndInputChange(e.target.value)}
                            disabled={disabled}
                            className="text-xs"
                        />
                        <span className="text-xs text-muted-foreground">s</span>
                    </div>
                </div>
            </div>

            {/* 预览片段按钮 */}
            {onSeek && (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handlePreviewClip}
                    disabled={disabled}
                >
                    {t('videoControlPanels.gif.previewClip')}
                </Button>
            )}
        </div>
    );
};

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
