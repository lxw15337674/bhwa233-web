'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/stores/media-processor/app-store';
import { ProcessingState } from '@/types/media-processor'; // Import ProcessingState
import { useTranslations } from 'next-intl';

interface UnifiedProgressDisplayProps {
    // Make processingState optional. If not provided, it will read from useAppStore.
    processingState?: ProcessingState;
}

export const UnifiedProgressDisplay: React.FC<UnifiedProgressDisplayProps> = ({
    processingState: propProcessingState, // Renamed to avoid conflict
}) => {
    const t = useTranslations();
    // If prop is provided, use it. Otherwise, use from AppStore.
    const { processingState: appStoreProcessingState } = useAppStore();
    const currentProcessingState = propProcessingState || appStoreProcessingState;

    const { isProcessing, progress, currentStep, error, remainingTime } = currentProcessingState;

    // Only show if there's an active process or a result/error to display
    if (!isProcessing && progress === 0 && !error) {
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
                    {t('common.progress.title')}
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {!error && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">
                                {progress >= 100 ? t('common.progress.complete') : currentStep || t('common.progress.preparing')}
                            </span>
                            <span className="font-medium">
                                {progress}%
                            </span>
                        </div>
                        <Progress
                            value={progress}
                            className="h-2"
                        />
                    </div>
                )}
                {error && (
                    <div className="text-sm text-destructive">
                        {error}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};