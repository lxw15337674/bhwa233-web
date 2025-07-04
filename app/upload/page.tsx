'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '../../src/components/ui/alert';
import { Upload, File, CheckCircle, XCircle, Copy } from 'lucide-react';
import { uploadToGalleryServer } from '../../src/api/upload';

interface UploadFileState {
    file: File;
    uploading: boolean;
    progress: number;
    success: boolean;
    error: string | null;
    uploadedUrl: string | null;
}

interface UploadHistoryItem {
    url: string;
    fileName: string;
    time: number;
}

export default function UploadPage() {
    const [uploadFiles, setUploadFiles] = useState<UploadFileState[]>([]);
    const [history, setHistory] = useState<UploadHistoryItem[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const uploadingCount = useRef(0);
    const queueRef = useRef<UploadFileState[]>([]);

    // 读取历史
    useEffect(() => {
        const raw = localStorage.getItem('uploadHistory');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                // 检查数据结构是否兼容（包含fileName字段）
                if (Array.isArray(parsed) && parsed.length > 0 && 'fileName' in parsed[0]) {
                    setHistory(parsed);
                } else {
                    // 清空旧格式的历史记录
                    localStorage.removeItem('uploadHistory');
                }
            } catch {
                // JSON解析失败，清空历史记录
                localStorage.removeItem('uploadHistory');
            }
        }
    }, []);

    // 上传成功后写入历史
    useEffect(() => {
        const newItems = uploadFiles.filter(f => f.success && f.uploadedUrl && !history.some(h => h.url === f.uploadedUrl));
        if (newItems.length > 0) {
            const newHistory = [...newItems.map(f => ({ url: f.uploadedUrl!, fileName: f.file.name, time: Date.now() })), ...history];
            setHistory(newHistory.slice(0, 100));
            localStorage.setItem('uploadHistory', JSON.stringify(newHistory.slice(0, 100)));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uploadFiles]);

    // 清空历史
    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('uploadHistory');
    };

    // 选择文件
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        const fileArr = Array.from(files);
        if (fileArr.length > 10) {
            setErrorMsg('一次最多只能上传10个文件');
            return;
        }
        setErrorMsg(null);
        const states: UploadFileState[] = fileArr.map(file => ({
            file,
            uploading: false,
            progress: 0,
            success: false,
            error: null,
            uploadedUrl: null,
        }));
        setUploadFiles(states);
        queueRef.current = [...states]; // 创建副本避免引用问题
        setTimeout(() => startUploadQueue(), 0);
    };

    // 拖拽
    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
    };
    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (!files) return;
        const fileArr = Array.from(files);
        if (fileArr.length > 10) {
            setErrorMsg('一次最多只能上传10个文件');
            return;
        }
        setErrorMsg(null);
        const states: UploadFileState[] = fileArr.map(file => ({
            file,
            uploading: false,
            progress: 0,
            success: false,
            error: null,
            uploadedUrl: null,
        }));
        setUploadFiles(states);
        queueRef.current = [...states]; // 创建副本避免引用问题
        setTimeout(() => startUploadQueue(), 0);
    };

    // 并发上传队列
    const startUploadQueue = () => {
        uploadingCount.current = 0;
        for (let i = 0; i < 3; i++) {
            uploadNext();
        }
    };
    const uploadNext = () => {
        const nextIdx = queueRef.current.findIndex(f => !f.uploading && !f.success && !f.error);
        if (nextIdx === -1) return;
        if (uploadingCount.current >= 3) return;
        uploadingCount.current++;
        uploadFile(nextIdx);
    };
    const uploadFile = async (idx: number) => {
        setUploadFiles(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], uploading: true, progress: 0, error: null };
            return copy;
        });

        // 同步更新队列引用的状态
        queueRef.current[idx] = { ...queueRef.current[idx], uploading: true, progress: 0, error: null };

        const file = queueRef.current[idx].file;
        try {
            // 使用真实进度回调
            const uploadedUrl = await uploadToGalleryServer(file, (progress) => {
                setUploadFiles(prev => {
                    const copy = [...prev];
                    copy[idx] = { ...copy[idx], progress };
                    return copy;
                });
                queueRef.current[idx] = { ...queueRef.current[idx], progress };
            });

            // 检查上传结果
            if (!uploadedUrl) {
                throw new Error('上传失败：服务器未返回文件URL');
            }

            setUploadFiles(prev => {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], uploading: false, progress: 100, success: true, uploadedUrl };
                return copy;
            });
            queueRef.current[idx] = { ...queueRef.current[idx], uploading: false, progress: 100, success: true, uploadedUrl };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '上传失败';
            setUploadFiles(prev => {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], uploading: false, progress: 0, error: errorMessage };
                return copy;
            });
            queueRef.current[idx] = { ...queueRef.current[idx], uploading: false, progress: 0, error: errorMessage };
        } finally {
            uploadingCount.current--;
            setTimeout(() => uploadNext(), 0);
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
    };

    const resetUpload = () => {
        setUploadFiles([]);
        setErrorMsg(null);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* 页面头部区域 */}
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">免费在线文件上传工具</h1>
                {/* 功能特点标签 */}
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">免费使用</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">任意格式</span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">任意大小</span>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">永久保存</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">批量上传(一次最多只能上传10个文件)</span>
                </div>
            </header>

            {/* 主要上传功能区域 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" aria-hidden="true" />
                        上传文件
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* 文件选择区域 */}
                    <section
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${uploadFiles.length > 0
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-300 hover:border-gray-400 '
                            } ${(uploadFiles.some(f => f.uploading)) ? 'pointer-events-none opacity-50' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => !uploadFiles.some(f => f.uploading) && document.getElementById('file-input')?.click()}
                        role="button"
                        tabIndex={0}
                        aria-label="点击选择文件或拖拽文件到此处上传"
                    >
                        {uploadFiles.length > 0 ? (
                            <div className="space-y-2">
                                <p className="font-medium">已选择 {uploadFiles.length} 个文件</p>
                                <p className="text-xs text-muted-foreground">点击重新选择文件</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                    <Upload className="h-8 w-8 mx-auto text-gray-400" aria-hidden="true" />
                                <p className="text-lg font-medium">拖拽文件到这里或点击选择</p>
                                    <p className="text-sm text-muted-foreground">支持任意格式文件，单个文件无大小限制</p>
                            </div>
                        )}
                        <input
                            id="file-input"
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={uploadFiles.some(f => f.uploading)}
                            multiple
                            aria-label="选择要上传的文件"
                        />
                    </section>

                    {/* 错误信息 */}
                    {errorMsg && (
                        <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>{errorMsg}</AlertDescription>
                        </Alert>
                    )}

                    {/* 批量上传进度与结果 */}
                    {uploadFiles.length > 0 && (
                        <section className="space-y-4" aria-label="上传进度和结果">
                            <h3 className="sr-only">文件上传进度</h3>
                            {uploadFiles.map((f, idx) => (
                                <article key={f.file.name + f.file.size + idx} className="border rounded p-3 bg-background flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <File className="h-5 w-5 text-green-600" aria-hidden="true" />
                                        <span className="font-medium text-sm flex-1 truncate" title={f.file.name}>
                                            {f.file.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {(f.file.size / 1024 / 1024).toFixed(2)} MB
                                        </span>
                                    </div>
                                    {f.uploading && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>上传中...</span>
                                                <span>{f.progress}%</span>
                                            </div>
                                            <Progress value={f.progress} className="w-full" />
                                        </div>
                                    )}
                                    {f.error && (
                                        <Alert variant="destructive" className="my-1">
                                            <XCircle className="h-4 w-4" aria-hidden="true" />
                                            <AlertDescription>{f.error}</AlertDescription>
                                        </Alert>
                                    )}
                                    {f.success && f.uploadedUrl && (
                                        <AlertDescription>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        value={f.uploadedUrl}
                                                        readOnly
                                                        className="flex-1 px-2 py-1 text-sm border rounded bg-background"
                                                        aria-label={`${f.file.name} 上传成功，文件链接`}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => copyToClipboard(f.uploadedUrl!)}
                                                        aria-label={`复制 ${f.file.name} 的文件链接`}
                                                    >
                                                        复制链接
                                                    </Button>
                                                </div>
                                            </div>
                                        </AlertDescription>
                                    )}
                                </article>
                            ))}
                        </section>
                    )}
                </CardContent>
            </Card>

            {/* 上传历史记录区域 */}
            <Card className="mt-8">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">上传历史记录</CardTitle>
                    {history.length > 0 && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={clearHistory}
                            aria-label="清空所有上传历史记录"
                        >
                            清空历史
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <div className="text-muted-foreground text-sm py-6 text-center">
                            暂无上传历史记录
                        </div>
                    ) : (
                            <nav aria-label="上传历史文件列表">
                                <ul className="space-y-3" role="list">
                                    {history.map((item, idx) => (
                                        <li key={item.url + item.time} className="flex items-center gap-2">
                                            <File className="h-4 w-4 text-green-600" aria-hidden="true" />
                                            <span className="font-medium text-sm flex-1 truncate" title={item.fileName}>
                                                {item.fileName}
                                            </span>
                                            <time className="text-xs text-muted-foreground whitespace-nowrap" dateTime={new Date(item.time).toISOString()}>
                                                {new Date(item.time).toLocaleString()}
                                            </time>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => navigator.clipboard.writeText(item.url)}
                                                aria-label={`复制 ${item.fileName} 的文件链接`}
                                                title={`复制 ${item.fileName} 的文件链接`}
                                            >
                                                复制链接
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            </nav>
                    )}
                </CardContent>
            </Card>
        </div>
    );
} 