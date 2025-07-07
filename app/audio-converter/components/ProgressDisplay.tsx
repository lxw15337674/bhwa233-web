import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ConversionState } from '@/utils/audioConverter';

interface ProgressDisplayProps {
    conversionState: ConversionState;
    messageRef?: React.RefObject<HTMLDivElement | null>;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
    conversionState,
    messageRef
}) => {
    if (!conversionState.isConverting && conversionState.progress === 0) {
        return null;
    }

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-4">
                <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-foreground">处理进度</span>
                        <span className="text-primary">{conversionState.progress}%</span>
                    </div>
                    <Progress
                        value={conversionState.progress}
                        className="h-2"
                    />
                    {conversionState.currentStep && (
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-muted-foreground">{conversionState.currentStep}</p>
                            {conversionState.remainingTime && (
                                <p className="text-xs text-blue-500 font-medium">{conversionState.remainingTime}</p>
                            )}
                        </div>
                    )}

                    {/* FFmpeg 日志显示 */}
                    {messageRef && (
                        <div
                            ref={messageRef}
                            className="text-xs font-mono text-muted-foreground bg-muted/30 p-2 rounded border max-h-20 overflow-y-auto"
                            style={{ minHeight: '1.5rem' }}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
