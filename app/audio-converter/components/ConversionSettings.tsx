import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2 } from 'lucide-react';
import {
    AUDIO_FORMATS,
    QUALITY_MODES,
    AudioFormat,
    QualityMode
} from '@/utils/audioConverter';

interface ConversionSettingsProps {
    outputFormat: AudioFormat;
    qualityMode: QualityMode;
    onOutputFormatChange: (format: AudioFormat) => void;
    onQualityModeChange: (mode: QualityMode) => void;
    ffmpegLoaded: boolean;
    isMultiThread: boolean;
}

export const ConversionSettings: React.FC<ConversionSettingsProps> = ({
    outputFormat,
    qualityMode,
    onOutputFormatChange,
    onQualityModeChange,
    ffmpegLoaded,
    isMultiThread
}) => {
    return (
        <Card className="bg-card border-border">
            <CardContent className="p-4">
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-foreground">
                                输出格式
                            </label>
                            {/* 多线程模式状态 */}
                            {ffmpegLoaded && (
                                <span className={`inline-flex items-center gap-1 text-xs ${isMultiThread ? 'text-green-600' : 'text-blue-600'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isMultiThread ? 'bg-green-500' : 'bg-blue-500'
                                        }`}></span>
                                    {isMultiThread ? '多线程' : '单线程'}
                                </span>
                            )}
                        </div>
                        <Select
                            value={outputFormat}
                            onValueChange={onOutputFormatChange}
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
                                        }`}
                                    onClick={() => onQualityModeChange(key as QualityMode)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{mode.icon}</span>
                                            <div>
                                                <div className="font-medium text-sm">{mode.label}</div>
                                                <div className="text-xs text-muted-foreground">{mode.description}</div>
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
                </div>
            </CardContent>
        </Card>
    );
};
