'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '../../src/components/ui/alert';
import { Upload, File, CheckCircle, XCircle, Copy } from 'lucide-react';
import { uploadToGalleryServer } from '../../src/api/upload';

interface UploadState {
    file: File | null;
    uploading: boolean;
    progress: number;
    success: boolean;
    error: string | null;
    uploadedUrl: string | null;
}

interface UploadHistoryItem {
    url: string;
    time: number;
}

export default function UploadPage() {
    const [uploadState, setUploadState] = useState<UploadState>({
        file: null,
        uploading: false,
        progress: 0,
        success: false,
        error: null,
        uploadedUrl: null,
    });

    const [history, setHistory] = useState<UploadHistoryItem[]>([]);

    // 读取历史
    useEffect(() => {
        const raw = localStorage.getItem('uploadHistory');
        if (raw) {
            try {
                setHistory(JSON.parse(raw));
            } catch { }
        }
    }, []);

    // 上传成功后写入历史
    useEffect(() => {
        if (uploadState.success && uploadState.uploadedUrl) {
            const newItem = { url: uploadState.uploadedUrl, time: Date.now() };
            let newHistory = [newItem, ...history];
            if (newHistory.length > 100) newHistory = newHistory.slice(0, 100);
            setHistory(newHistory);
            localStorage.setItem('uploadHistory', JSON.stringify(newHistory));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadState.success, uploadState.uploadedUrl]);

    // 清空历史
    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('uploadHistory');
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadState({
                file,
                uploading: false,
                progress: 0,
                success: false,
                error: null,
                uploadedUrl: null,
            });
            setTimeout(() => {
                handleUpload(file);
            }, 0);
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            setUploadState({
                file,
                uploading: false,
                progress: 0,
                success: false,
                error: null,
                uploadedUrl: null,
            });
            setTimeout(() => {
                handleUpload(file);
            }, 0);
        }
    };

    const handleUpload = async (fileParam?: File) => {
        const fileToUpload = fileParam || uploadState.file;
        if (!fileToUpload) return;

        setUploadState(prev => ({
            ...prev,
            uploading: true,
            progress: 0,
            error: null,
        }));

        try {
            // 模拟上传进度
            const progressInterval = setInterval(() => {
                setUploadState(prev => ({
                    ...prev,
                    progress: Math.min(prev.progress + 10, 90),
                }));
            }, 200);

            const uploadedUrl = await uploadToGalleryServer(fileToUpload);

            clearInterval(progressInterval);

            if (uploadedUrl) {
                setUploadState(prev => ({
                    ...prev,
                    uploading: false,
                    progress: 100,
                    success: true,
                    uploadedUrl,
                }));
            } else {
                throw new Error('上传失败，请重试');
            }
        } catch (error) {
            setUploadState(prev => ({
                ...prev,
                uploading: false,
                progress: 0,
                error: error instanceof Error ? error.message : '上传失败',
            }));
        }
    };

    const copyToClipboard = () => {
        if (uploadState.uploadedUrl) {
            navigator.clipboard.writeText(uploadState.uploadedUrl);
        }
    };

    const resetUpload = () => {
        setUploadState({
            file: null,
            uploading: false,
            progress: 0,
            success: false,
            error: null,
            uploadedUrl: null,
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">文件上传</h1>
                <p className="text-muted-foreground">
                    选择文件进行上传，支持拖拽上传
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        上传文件
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 文件选择区域 */}
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${uploadState.file
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            } ${uploadState.uploading ? 'pointer-events-none opacity-50' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => !uploadState.uploading && document.getElementById('file-input')?.click()}
                    >
                        {uploadState.file ? (
                            <div className="space-y-2">
                                <File className="h-8 w-8 mx-auto text-green-600" />
                                <p className="font-medium">{uploadState.file.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {(uploadState.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                <p className="text-xs text-muted-foreground">点击重新选择文件</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                                <p className="text-lg font-medium">拖拽文件到这里或点击选择</p>
                            </div>
                        )}
                        <input
                            id="file-input"
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={uploadState.uploading}
                        />
                    </div>

                    {/* 上传进度 */}
                    {uploadState.uploading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>上传中...</span>
                                <span>{uploadState.progress}%</span>
                            </div>
                            <Progress value={uploadState.progress} className="w-full" />
                        </div>
                    )}

                    {/* 错误信息 */}
                    {uploadState.error && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{uploadState.error}</AlertDescription>
                        </Alert>
                    )}

                    {/* 成功结果 */}
                    {uploadState.success && uploadState.uploadedUrl && (
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p>文件上传成功！</p>
                                    <div className="flex items-center gap-2">
                                        <textarea
                                            value={uploadState.uploadedUrl}
                                            readOnly
                                            rows={2}
                                            className="flex-1 px-2 py-1 text-sm border rounded resize-none bg-background"
                                            style={{ minHeight: '2.5em' }}
                                        />
                                        <Button size="sm" variant="outline" onClick={copyToClipboard}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            <Card className="mt-8">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">上传历史</CardTitle>
                    {history.length > 0 && (
                        <Button size="sm" variant="ghost" onClick={clearHistory}>
                            清空历史
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <div className="text-muted-foreground text-sm py-6 text-center">暂无上传历史</div>
                    ) : (
                        <ul className="space-y-3">
                            {history.map((item, idx) => (
                                <li key={item.url + item.time} className="flex items-center gap-2">
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="truncate flex-1 underline hover:text-primary"
                                    >
                                        {item.url}
                                    </a>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {new Date(item.time).toLocaleString()}
                                    </span>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        onClick={() => navigator.clipboard.writeText(item.url)}
                                        title="复制链接"
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 