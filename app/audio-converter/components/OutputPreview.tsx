import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadBlob } from '@/utils/audioConverter';

interface OutputPreviewProps {
    outputFile: Blob | null;
    outputFileName: string;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
    onEnded: () => void;
    audioRef?: React.RefObject<HTMLAudioElement | null>;
}

export const OutputPreview: React.FC<OutputPreviewProps> = ({
    outputFile,
    outputFileName,
    isPlaying,
    onPlay,
    onPause,
    onEnded,
    audioRef
}) => {
    if (!outputFile) return null;

    const handleDownload = () => {
        downloadBlob(outputFile, outputFileName);
    };

    return (
        <Card className="bg-card border-border">
            <CardContent className="p-4">
                <div className="space-y-4">
                    <h3 className="font-medium text-foreground">输出文件</h3>

                    {/* 音频播放器 */}
                    <div className="bg-muted rounded-lg p-3">
                        <audio
                            ref={audioRef}
                            src={URL.createObjectURL(outputFile)}
                            onPlay={onPlay}
                            onPause={onPause}
                            onEnded={onEnded}
                            className="w-full"
                            controls
                        />
                    </div>

                    {/* 文件信息 */}
                    <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between items-center">
                            <span>文件名:</span>
                            <span>{outputFileName}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>文件大小:</span>
                            <span>{(outputFile.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                    </div>

                    {/* 下载按钮 */}
                    <Button
                        onClick={handleDownload}
                        className="w-full bg-green-600 hover:bg-green-700"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        下载文件
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
