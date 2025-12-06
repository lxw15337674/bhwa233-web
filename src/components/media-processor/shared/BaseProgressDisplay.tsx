'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  outputFile: Blob | null;
  outputFileName: string;
  remainingTime: string | null;
}

interface BaseProgressDisplayProps {
  processingState: ProcessingState;
  className?: string;
}

export const BaseProgressDisplay: React.FC<BaseProgressDisplayProps> = ({
  processingState,
  className
}) => {
  const { isProcessing, progress, currentStep, error } = processingState;

  if (!isProcessing && progress === 0) {
    return null;
  }

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {error ? <AlertCircle className="h-4 w-4 text-destructive" /> : <CheckCircle className="h-4 w-4 text-primary" />}
          处理进度
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-3">
          <Progress value={progress} className="w-full" />
          <div className="flex justify-between text-sm">
            <span>{progress}%</span>
            <span>{isProcessing ? '处理中...' : '完成'}</span>
          </div>
          {currentStep && (
            <p className="text-sm text-muted-foreground">{currentStep}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};