import React, { useRef, useState } from 'react';
import { useBatchImageStore, ImageTask } from '@/stores/media-processor/batch-image-store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatFileSize } from '@/utils/imageProcessor';
import { X, FileImage, CheckCircle2, AlertCircle, Upload, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BatchExifPopover } from './BatchExifPopover';

export const BatchTaskGrid: React.FC = () => {
    const { tasks, removeTask, addFiles, isProcessing } = useBatchImageStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(Array.from(e.target.files));
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (isProcessing) return;
        
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            addFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    if (tasks.length === 0) {
        return (
            <div 
                className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 text-muted-foreground bg-muted/30 hover:bg-muted/50 transition-colors"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <FileImage className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">拖拽图片到这里</h3>
                <p className="text-sm mb-6">支持多选，单次建议不超过 50 张</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    选择图片
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full border rounded-lg bg-background" onDrop={handleDrop} onDragOver={handleDragOver}>
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/40 text-sm font-medium text-muted-foreground">
                <div className="col-span-4">文件名</div>
                <div className="col-span-2">原始大小</div>
                <div className="col-span-2">处理后</div>
                <div className="col-span-2">状态</div>
                <div className="col-span-1 text-center">EXIF</div>
                <div className="col-span-1 text-right">操作</div>
            </div>

            {/* List */}
            <ScrollArea className="flex-1">
                <div className="divide-y">
                    {tasks.map((task) => (
                        <TaskRow key={task.id} task={task} onRemove={() => removeTask(task.id)} disabled={isProcessing && task.status === 'processing'} />
                    ))}
                </div>
            </ScrollArea>

            {/* Footer / Drop zone hint */}
             <div className="p-2 text-xs text-center text-muted-foreground border-t bg-muted/20">
                支持拖拽添加更多图片
             </div>
             <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
};

const TaskRow: React.FC<{ task: ImageTask; onRemove: () => void; disabled: boolean }> = ({ task, onRemove, disabled }) => {
    const [isLoadingExif, setIsLoadingExif] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const { loadExifForTask } = useBatchImageStore();

    const handlePopoverOpenChange = async (open: boolean) => {
        setPopoverOpen(open);
        if (open && !task.exifMetadata && !isLoadingExif) {
            setIsLoadingExif(true);
            await loadExifForTask(task.id);
            setIsLoadingExif(false);
        }
    };

    return (
        <>
            <div className={cn("grid grid-cols-12 gap-4 p-4 items-center text-sm hover:bg-muted/50 transition-colors", disabled && "opacity-70")}>
                {/* File Name & Preview */}
                <div className="col-span-4 flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden border">
                     {/* Simple preview if possible, else icon */}
                     <img 
                        src={URL.createObjectURL(task.file)} 
                        alt={task.file.name}
                        className="w-full h-full object-cover"
                        onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                     />
                </div>
                <div className="truncate font-medium" title={task.file.name}>
                    {task.file.name}
                </div>
            </div>

            {/* Original Size */}
            <div className="col-span-2 text-muted-foreground">
                {formatFileSize(task.file.size)}
            </div>

            {/* Output Size */}
            <div className="col-span-2">
                {task.status === 'success' && task.outputBlob ? (
                    <span className="text-green-600 font-medium">
                        {formatFileSize(task.outputBlob.size)}
                    </span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </div>

            {/* Status */}
            <div className="col-span-2">
                {task.status === 'pending' && <span className="text-muted-foreground">等待中</span>}
                {task.status === 'processing' && (
                    <div className="space-y-1">
                        <div className="text-xs text-primary">处理中...</div>
                        <Progress value={task.progress} className="h-1.5" />
                    </div>
                )}
                {task.status === 'success' && (
                    <div className="flex items-center text-green-600 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        完成
                    </div>
                )}
                {task.status === 'error' && (
                    <div className="flex items-center text-destructive text-xs" title={task.error}>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        失败
                    </div>
                )}
            </div>

                {/* EXIF */}
                <div className="col-span-1 flex justify-center">
                    <BatchExifPopover
                        fileName={task.file.name}
                        exifMetadata={task.exifMetadata}
                        isLoading={isLoadingExif}
                        onOpenChange={handlePopoverOpenChange}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            title="查看 EXIF 信息（点击或悬停）"
                        >
                            <Info className="w-4 h-4" />
                        </Button>
                    </BatchExifPopover>
                </div>

            {/* Actions */}
                <div className="col-span-1 flex justify-end">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={onRemove}
                    disabled={disabled || task.status === 'processing'}
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
        </>
    );
};
