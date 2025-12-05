import React from 'react';
import { useBatchImageStore } from '@/stores/media-processor/batch-image-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Play, Loader2, Trash2, Download, Plus } from 'lucide-react';
import { QualitySlider } from '../shared/QualitySlider';
import { FormatSelector } from '../shared/FormatSelector';
import { ResizeControl } from '../shared/ResizeControl';
import { ExifSwitch } from '../shared/ExifSwitch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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

    const hasPending = tasks.some(t => t.status === 'pending');
    const hasSuccess = tasks.some(t => t.status === 'success');

    // Trigger file input for adding more (hidden input trick managed by parent or we add one here too)
    // Actually, the "Add Files" is usually on the grid side, but having a button here is fine too.
    // For now, let's stick to the main actions.

    return (
        <Card className="h-full flex flex-col">
            <div className="p-4 space-y-6 flex-1 overflow-y-auto">
                {/* Main Actions */}
                <div className="space-y-2">
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
                    
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" onClick={clearTasks} disabled={isProcessing || tasks.length === 0}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            清空列表
                        </Button>
                         <Button 
                            variant="outline" 
                            onClick={downloadAll} 
                            disabled={!hasSuccess || isProcessing}
                            className={hasSuccess ? "border-green-500 text-green-600 hover:bg-green-50" : ""}
                        >
                            <Download className="w-4 h-4 mr-2" />
                            打包下载
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Settings (Disabled when processing) */}
                <div className={isProcessing ? "opacity-50 pointer-events-none" : ""}>
                    <div className="space-y-6">
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
                                <Label htmlFor="batch-filename">文件名前缀 (可选)</Label>
                                <Input
                                    id="batch-filename"
                                    type="text"
                                    placeholder="例如: holiday_2025" // This logic needs to be supported in store
                                    value={options.outputFilename || ''}
                                    onChange={(e) => updateOptions({ outputFilename: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground">
                                    设置统一的文件名，程序会自动添加后缀避免冲突
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};
