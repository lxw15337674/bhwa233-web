import React, { useRef, useState, useMemo } from 'react';
import { Upload, FileText, AlertCircle, Clock, Languages, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';

interface TextInputAreaProps {
  text: string;
  onTextChange: (text: string) => void;
  onFileUpload: (file: File) => void;
  maxLength?: number;
  disabled?: boolean;
}

export const TextInputArea: React.FC<TextInputAreaProps> = ({
  text,
  onTextChange,
  onFileUpload,
  maxLength = 5000,
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string>('');

  const supportedFormats = ['.txt', '.md', '.doc', '.docx', '.pdf'];

  const validateFile = (file: File): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!supportedFormats.includes(extension)) {
      setError(`不支持的文件格式。支持的格式: ${supportedFormats.join(', ')}`);
      return false;
    }
    
    if (file.size > 1024 * 1024 * 10) { // 10MB限制
      setError('文件大小不能超过10MB');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content.length > maxLength) {
        setError(`文本内容过长，最大支持 ${maxLength} 字符`);
        return;
      }
      onTextChange(content);
      onFileUpload(file);
      setError('');
    };
    reader.onerror = () => {
      setError('文件读取失败，请重试');
    };
    reader.readAsText(file);
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

  const clearText = () => {
    onTextChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setError('');
  };

  const charCount = text.length;

  const stats = useMemo(() => {
    if (!text.trim()) return { words: 0, sentences: 0, paragraphs: 0 };

    const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0).length;

    return { words, paragraphs };
  }, [text]);

  return (
    <div className="space-y-4">
      {/* 文本输入区域 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="text-input">输入文本内容</Label>
          <span className={`text-xs ${charCount > maxLength ? 'text-red-500' : 'text-muted-foreground'}`}>
            {charCount}/{maxLength} 字符
          </span>
        </div>
        <Textarea
          id="text-input"
          value={text}
          onChange={(e) => {
            const newText = e.target.value;
            if (newText.length <= maxLength) {
              onTextChange(newText);
              setError('');
            }
          }}
          placeholder="请输入要转换为语音的文本内容，或拖拽上传文本文件..."
          rows={12}
          className="min-h-[300px] resize-none"
          disabled={disabled}
        />
        {charCount > maxLength && (
          <p className="text-xs text-red-500">文本长度超过限制</p>
        )}
      </div>

      {/* 文件上传区域 */}
      <div className="space-y-2">
        <Label>或上传文本文件</Label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
            ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
            拖拽文本文件到此处，或点击选择文件
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            支持格式: {supportedFormats.join(', ')}
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* 操作按钮 */}
      {text && (
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearText}
            disabled={disabled}
          >
            清空文本
          </Button>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 文本统计信息 */}
      {text && (
        <Card className="p-4  shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-slate-600 dark:text-slate-400">字数</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{charCount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-slate-600 dark:text-slate-400">段落</p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">{stats.paragraphs}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};