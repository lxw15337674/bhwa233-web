'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, X, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BaseFileUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onReset: () => void;
  disabled?: boolean;
  accept?: string;
  multiple?: boolean;
  fileValidator?: (file: File) => boolean;
  supportedFormats?: string[];
  className?: string;
  onPasteFromClipboard?: (e: ClipboardEvent) => void;
}

export const BaseFileUpload: React.FC<BaseFileUploadProps> = ({
  selectedFile,
  onFileSelect,
  onReset,
  disabled = false,
  accept = '*',
  multiple = false,
  fileValidator,
  supportedFormats = [],
  className,
  onPasteFromClipboard
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      validateAndSelectFile(file);
    }
  };

  const validateAndSelectFile = (file: File) => {
    if (fileValidator && !fileValidator(file)) {
      alert(`不支持的文件格式。支持的格式: ${supportedFormats.join(', ')}`);
      return;
    }
    onFileSelect(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      validateAndSelectFile(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (onPasteFromClipboard) {
      onPasteFromClipboard(e as any as ClipboardEvent);
    }
  };

  const handleCopy = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {!selectedFile ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept={accept}
            multiple={multiple}
            onChange={handleFileInputChange}
            disabled={disabled}
            onPaste={handlePaste}
          />
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">拖拽文件到这里或点击上传</p>
          <p className="text-sm text-muted-foreground">
            支持格式: {supportedFormats.join(', ')}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!selectedFile}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};