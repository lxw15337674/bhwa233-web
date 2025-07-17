import React, { useRef, useState } from 'react';
import { Upload, Music, AlertCircle, Clock, Film, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { useAudioProcessorStore } from '@/stores/media-processor/audio-store';

interface AudioInputAreaProps {
  maxFileSize?: number; // MB
  disabled?: boolean;
}

export const AudioInputArea: React.FC<AudioInputAreaProps> = ({
  maxFileSize = 50,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>('');
  
  const {
    inputAudio,
    mediaMetadata,
    validateAudioFile,
    setInputAudio,
    analyzeAudio,
    clearAudioData
  } = useAudioProcessorStore();

  const supportedFormats = ['.mp3', '.wav', '.aac', '.flac', '.ogg', '.m4a'];

  const validateFile = (file: File): boolean => {
    if (!validateAudioFile(file)) {
      setError(`不支持的文件格式。支持的格式: ${supportedFormats.join(', ')}`);
      return false;
    }
    
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`文件大小不能超过${maxFileSize}MB`);
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    setInputAudio(file);
    setError('');
    
    // 分析音频文件
    analyzeAudio(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const clearAudio = () => {
    clearAudioData();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError('');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* 文件上传区域 */}
      <div className="space-y-2">
        <Label>选择音频文件</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">
            拖拽音频文件到此处，或点击选择文件
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
            支持格式: {supportedFormats.join(', ')}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            最大文件大小: {maxFileSize}MB
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.aac,.flac,.ogg,.m4a"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 音频信息显示 */}
      {inputAudio && (
        <Card className="p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Music className="w-5 h-5 text-blue-500" />
              <span className="font-medium">已选择音频</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAudio}
              disabled={disabled}
            >
              清除
            </Button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">文件名:</span>
              <span className="font-medium">{inputAudio.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">大小:</span>
              <span className="font-medium">{formatFileSize(inputAudio.size)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">类型:</span>
              <span className="font-medium">{inputAudio.type || '未知'}</span>
            </div>
          </div>
        </Card>
      )}

      {/* 音频元数据信息 */}
      {mediaMetadata && (
        <Card className="p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Film className="w-5 h-5 text-purple-500" />
            <span className="font-medium">音频信息</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            {mediaMetadata.duration > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-slate-600 dark:text-slate-400">时长</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {Math.floor(mediaMetadata.duration / 60)}:{(mediaMetadata.duration % 60).toString().padStart(2, '0')}
                  </p>
                </div>
              </div>
            )}
            {mediaMetadata.bitrate > 0 && (
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-slate-600 dark:text-slate-400">比特率</p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {mediaMetadata.bitrate} kbps
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};