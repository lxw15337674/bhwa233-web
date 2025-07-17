'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { ProcessingState } from '@/types/media-processor';

interface UnifiedProgressDisplayProps {
    processingState: ProcessingState;
}

export const UnifiedProgressDisplay: React.FC<UnifiedProgressDisplayProps> = ({
    processingState,
}) => {
    const { isProcessing, progress, currentStep, error, remainingTime } = processingState;

    if (!isProcessing && progress === 0) {
        return null;
    }

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    {error ? (
                        <AlertCircle className="h-5 w-5 text-destructive" />
                    ) : progress >= 100 ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                        <Clock className="h-5 w-5 text-blue-500" />
                    )}
                    处理进度
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {!error && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                {progress >= 100 ? '处理完成' : currentStep || '准备中...'}
                            </span>
                            <span className="font-medium">
                                {progress}%
                            </span>
                        </div>
                        <Progress
                            value={progress}
                            className="h-2"
                        />
                        {remainingTime && progress > 0 && progress < 100 && (
                            <div className="text-xs text-muted-foreground text-right">
                                {remainingTime}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}; 