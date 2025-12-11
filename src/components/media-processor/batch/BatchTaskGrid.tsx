import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { useBatchImageStore, ImageTask } from '@/stores/media-processor/batch-image-store';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatFileSize } from '@/utils/imageProcessor';
import { X, FileImage, CheckCircle2, AlertCircle, Upload, Info, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BatchExifPopover } from './BatchExifPopover';
import { useTranslation } from '@/components/TranslationProvider';

export const BatchTaskGrid: React.FC = () => {
    const { t } = useTranslation();
    const { tasks, removeTask, addFiles, isProcessing, downloadSingle } = useBatchImageStore();
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
                <h3 className="text-lg font-medium mb-2">{t('batchTaskGrid.dragImagesHere')}</h3>
                <p className="text-sm mb-6">{t('batchTaskGrid.multiSelectHint')}</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    {t('batchImageProcessor.addImage')}
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
                <div className="col-span-5">{t('batchTaskGrid.fileName')}</div>
                <div className="col-span-4">{t('batchTaskGrid.sizeAndDimensions')}</div>
                <div className="col-span-1">{t('batchTaskGrid.status')}</div>
                <div className="col-span-1 text-center">EXIF</div>
                <div className="col-span-1 text-right">{t('batchTaskGrid.actions')}</div>
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
                {t('batchTaskGrid.dragToAddMore')}
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
    const { t } = useTranslation();
    const [isLoadingExif, setIsLoadingExif] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState(false);
    const { loadExifForTask, downloadSingle } = useBatchImageStore();

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
                <div className="col-span-5 flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden border">
                     {/* Simple preview if possible, else icon */}
                     <Image
                        src={URL.createObjectURL(task.file)}
                        alt={task.file.name}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                        onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                     />
                </div>
                <div className="truncate font-medium" title={task.file.name}>
                    {task.file.name}
                </div>
            </div>

                {/* Size & Dimensions */}
                <div className="col-span-4">
                    <div className="space-y-0.5">
                        {/* File Size Comparison */}
                        <div className="text-xs flex items-center gap-1">
                            <span className="text-muted-foreground">{formatFileSize(task.file.size)}</span>
                            {task.status === 'success' && task.outputBlob ? (
                                <>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="font-medium">{formatFileSize(task.outputBlob.size)}</span>
                                    {(() => {
                                        const percent = Math.round((1 - task.outputBlob.size / task.file.size) * 100);
                                        const isReduced = percent > 0;
                                        return (
                                            <span className={cn(
                                                "text-xs font-semibold ml-0.5",
                                                isReduced ? "text-green-600" : "text-red-500"
                                            )}>
                                                ({isReduced ? '-' : '+'}{Math.abs(percent)}%)
                                            </span>
                                        );
                                    })()}
                                </>
                            ) : task.status === 'processing' ? (
                                <>
                                    <span className="text-muted-foreground">→</span>
                                    <span className="text-muted-foreground">{t('batchTaskGrid.processing')}</span>
                                </>
                                ) : (
                                        <>
                                            <span className="text-muted-foreground">→</span>
                                            <span className="text-muted-foreground">-</span>
                                </>
                            )}
                        </div>
                        {/* Dimensions Comparison */}
                        {task.inputMetadata && (
                            <div className="text-xs flex items-center gap-1 text-muted-foreground">
                                <span>{task.inputMetadata.width}×{task.inputMetadata.height}</span>
                                {task.status === 'success' && task.outputMetadata ? (
                                    <>
                                        <span>→</span>
                                        <span>{task.outputMetadata.width}×{task.outputMetadata.height}</span>
                                    </>
                                ) : task.status === 'processing' ? (
                                    <>
                                        <span>→</span>
                                        <span>...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>→</span>
                                        <span>-</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

            {/* Status */}
                <div className="col-span-1">
                {task.status === 'pending' && <span className="text-muted-foreground">{t('batchTaskGrid.waiting')}</span>}
                {task.status === 'processing' && (
                    <div className="space-y-1">
                        <div className="text-xs text-primary">{t('batchTaskGrid.processing')}</div>
                        <Progress value={task.progress} className="h-1.5" />
                    </div>
                )}
                {task.status === 'success' && (
                    <div className="flex items-center text-green-600 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {t('batchTaskGrid.completed')}
                    </div>
                )}
                {task.status === 'error' && (
                    <div className="flex items-center text-destructive text-xs" title={task.error}>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {t('batchTaskGrid.failed')}
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
                            title={t('batchTaskGrid.viewExif')}
                        >
                            <Info className="w-4 h-4" />
                        </Button>
                    </BatchExifPopover>
                </div>

            {/* Actions */}
                <div className="col-span-1 flex justify-end gap-1">
                    {task.status === 'success' && task.outputBlob && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-green-600"
                            onClick={() => downloadSingle(task.id)}
                            title={t('batchTaskGrid.downloadFile')}
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                    )}
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
