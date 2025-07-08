import React, { useState } from 'react';
import { ControlPanelProps } from '@/types/media-processor';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const ConversionSettings: React.FC<ControlPanelProps> = ({ selectedFile, ffmpeg, onStateChange, onOutputReady }) => {
  const [format, setFormat] = useState('mp3');

  const handleConvert = async () => {
    if (!selectedFile || !ffmpeg) return;

    onStateChange({ isProcessing: true, progress: 0, error: null, currentStep: '准备转换' });

    try {
      const outputFileName = `${selectedFile.name.split('.').slice(0, -1).join('.')}.${format}`;
      onStateChange({ currentStep: `正在转换为 ${format.toUpperCase()}` });

      await ffmpeg.exec(['-i', selectedFile.name, '-b:a', '192k', outputFileName]);

      const data = await ffmpeg.readFile(outputFileName);
      const blob = new Blob([data], { type: `audio/${format}` });

      onOutputReady(blob, outputFileName);
      onStateChange({ isProcessing: false, progress: 100, currentStep: '转换完成' });
    } catch (error) {
      onStateChange({ isProcessing: false, error: error.message, currentStep: '转换失败' });
    }
  };

  return (
    <div className="space-y-4">
      <Select value={format} onValueChange={setFormat}>
        <SelectTrigger>
          <SelectValue placeholder="选择格式" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="mp3">MP3</SelectItem>
          <SelectItem value="wav">WAV</SelectItem>
          <SelectItem value="aac">AAC</SelectItem>
          <SelectItem value="flac">FLAC</SelectItem>
          <SelectItem value="ogg">OGG</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleConvert} disabled={!selectedFile}>
        开始转换
      </Button>
    </div>
  );
};
