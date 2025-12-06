import React, { useRef, useState } from 'react';
import { useBatchImageStore } from '@/stores/media-processor/batch-image-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Play, Loader2, Trash2, Download, Plus, Clipboard } from 'lucide-react';
import { QualitySlider } from '../shared/QualitySlider';
import { FormatSelector } from '../shared/FormatSelector';
import { ResizeControl } from '../shared/ResizeControl';
import { ExifSwitch } from '../shared/ExifSwitch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useClipboardPaste } from '@/hooks/useClipboardPaste';

export const BatchControlPanel: React.FC = () => {
    const {
        options,
        updateOptions,
        startProcessing,
        cancelProcessing,
        isProcessing,
        tasks,
        clearTasks,
        downloadAll,
        addFiles
    } = useBatchImageStore();

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showClearConfirmDialog, setShowClearConfirmDialog] = useState(false); // State for confirm dialog

    const hasPending = tasks.some(t => t.status === 'pending');
    const hasSuccess = tasks.some(t => t.status === 'success');

    // 使用 useClipboardPaste Hook
    const { handlePaste } = useClipboardPaste({
        onFilesSelected: (files) => {
            addFiles(files);
        },
        debug: true
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(Array.from(e.target.files));
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleAddClick = () => {
        fileInputRef.current?.click();
    };

    const handleClearListConfirm = () => {
        clearTasks();
        setShowClearConfirmDialog(false);
    };

    return (
        <Card className="h-full flex flex-col">
            {/* Top: File Management */}
            <div className="p-4 space-y-2 flex-shrink-0">
                <div className="flex gap-2">
                    <Button
                        onClick={handleAddClick}
                        disabled={isProcessing}
                        className="flex-1"
                        variant="outline"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        添加图片
                    </Button>
                    <Button
                        onClick={handlePaste}
                        disabled={isProcessing}
                        className="flex-1"
                        variant="outline"
                        title="从剪贴板粘贴图片"
                    >
                        <Clipboard className="w-4 h-4 mr-2" />
                        粘贴图片
                    </Button>
                </div>
                <AlertDialog open={showClearConfirmDialog} onOpenChange={setShowClearConfirmDialog}>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            onClick={() => setShowClearConfirmDialog(true)}
                            disabled={isProcessing || tasks.length === 0}
                            className="w-full"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            清空列表
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>确认清空列表？</AlertDialogTitle>
                            <AlertDialogDescription>
                                此操作将移除所有已添加和已处理的图片任务，且无法撤销。
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearListConfirm}>
                                清空
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            <Separator />

            {/* Middle: Settings (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Settings (Disabled when processing) */}
                <div className={isProcessing ? "opacity-50 pointer-events-none space-y-6" : "space-y-6"}>
                    {/* Quality */}
                    <QualitySlider
                        value={options.quality}
                        onChange={(val) => updateOptions({ quality: val })}
                        disabled={options.outputFormat === 'png'}
                    />

                    <Separator />

                    {/* Format */}
                    <FormatSelector
                        value={options.outputFormat}
                        onChange={(val) => updateOptions({ outputFormat: val })}
                    />

                    <Separator />

                    {/* Resize */}
                    <ResizeControl
                        options={options}
                        updateOptions={updateOptions}
                    // No inputMetadata in batch mode
                    />

                    <Separator />

                    {/* Output & Privacy */}
                    <div className="space-y-4">
                        <Label>其他选项</Label>
                        <ExifSwitch
                            checked={options.stripMetadata}
                            onCheckedChange={(checked) => updateOptions({ stripMetadata: checked })}
                        />

                        {/* Output Filename - slightly different context for batch */}
                        <div className="space-y-2">
                            <Label htmlFor="batch-filename">文件名后缀</Label>
                            <Input
                                id="batch-filename"
                                type="text"
                                placeholder="例如: _compressed"
                                value={options.outputFilename || ''}
                                onChange={(e) => updateOptions({ outputFilename: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                设置文件后缀，将追加在原文件名之后
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
            />

            <Separator />

            {/* Bottom: Actions */}
            <div className="p-4 space-y-2 flex-shrink-0 bg-background rounded-b-lg">
                <Button
                    onClick={isProcessing ? cancelProcessing : startProcessing}
                    disabled={!hasPending && !isProcessing}
                    className="w-full"
                    size="lg"
                    variant={isProcessing ? "destructive" : "default"}
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            停止处理
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4 mr-2" />
                            开始批量处理
                        </>
                    )}
                </Button>

                <Button
                    variant="outline"
                    onClick={downloadAll}
                    disabled={!hasSuccess || isProcessing}
                    className={`w-full ${hasSuccess ? "border-green-500 text-green-600 hover:bg-green-50" : ""}`}
                >
                    <Download className="w-4 h-4 mr-2" />
                    打包下载
                </Button>
            </div>
        </Card>
    );
};
