'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, CheckCircle, XCircle, Copy } from 'lucide-react';
import { uploadToGalleryServer } from '@/api/upload';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations();
    const [uploadFiles, setUploadFiles] = useState<UploadFileState[]>([]);
    const [history, setHistory] = useState<UploadHistoryItem[]>([]);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const uploadingCount = useRef(0);
    const queueRef = useRef<UploadFileState[]>([]);

    // 文件大小限制：50MB
    const MAX_FILE_SIZE = 1024 * 1024 * 50;

    // 验证文件大小
    const validateFileSizes = (files: File[]) => {
        const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
        const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE);
        return {
            valid: oversizedFiles.length === 0,
            oversizedFiles,
            validFiles
        };
    };

    // 读取历史
    useEffect(() => {
        const raw = localStorage.getItem('uploadHistory');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0 && 'fileName' in parsed[0]) {
                    setHistory(parsed);
                } else {
                    localStorage.removeItem('uploadHistory');
                }
            } catch {
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

    // 处理文件选择/拖拽的共同逻辑
    const handleFiles = (fileArr: File[]) => {
        if (fileArr.length > 10) {
            setErrorMsg(t('upload.errors.maxFiles'));
            return;
        }

        const validation = validateFileSizes(fileArr);

        if (!validation.valid) {
            const oversizedInfo = validation.oversizedFiles.map(file =>
                `${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`
            ).join('、');

            if (validation.validFiles.length > 0) {
                setErrorMsg(t('upload.oversizedFiltered', { 
                    files: oversizedInfo, 
                    count: validation.validFiles.length 
                }));
            } else {
                setErrorMsg(t('upload.allOversized', { files: oversizedInfo }));
                return;
            }
        } else {
            setErrorMsg(null);
        }

        const states: UploadFileState[] = validation.validFiles.map(file => ({
            file,
            uploading: false,
            progress: 0,
            success: false,
            error: null,
            uploadedUrl: null,
        }));
        setUploadFiles(states);
        queueRef.current = [...states];
        if (states.length > 0) {
            setTimeout(() => startUploadQueue(), 0);
        }
    };

    // 选择文件
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files) return;
        handleFiles(Array.from(files));
    };

    // 拖拽
    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
    };
    
    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        const files = event.dataTransfer.files;
        if (!files) return;
        handleFiles(Array.from(files));
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

        queueRef.current[idx] = { ...queueRef.current[idx], uploading: true, progress: 0, error: null };

        const file = queueRef.current[idx].file;
        try {
            const uploadedUrl = await uploadToGalleryServer(file, (progress) => {
                setUploadFiles(prev => {
                    const copy = [...prev];
                    copy[idx] = { ...copy[idx], progress };
                    return copy;
                });
                queueRef.current[idx] = { ...queueRef.current[idx], progress };
            });

            if (!uploadedUrl) {
                throw new Error(t('upload.errors.noUrl'));
            }

            setUploadFiles(prev => {
                const copy = [...prev];
                copy[idx] = { ...copy[idx], uploading: false, progress: 100, success: true, uploadedUrl };
                return copy;
            });
            queueRef.current[idx] = { ...queueRef.current[idx], uploading: false, progress: 100, success: true, uploadedUrl };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('upload.errors.uploadFailed');
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

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            {/* 页面头部区域 */}
            <header className="text-center mb-4">
                <h1 className="text-3xl font-bold mb-2">{t('upload.title')}</h1>
                {/* 功能特点标签 */}
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">{t('upload.features.free')}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{t('upload.features.anyFormat')}</span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">{t('upload.features.anySize')}</span>
                    <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">{t('upload.features.permanent')}</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">{t('upload.features.batch')}</span>
                </div>
            </header>

            {/* 主要上传功能区域 */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" aria-hidden="true" />
                        {t('upload.uploadFiles')}
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
                        aria-label={t('upload.dragOrClick')}
                    >
                        {uploadFiles.length > 0 ? (
                            <div className="space-y-2">
                                <p className="font-medium">{t('upload.selectedFiles', { count: uploadFiles.length })}</p>
                                <p className="text-xs text-muted-foreground">{t('upload.clickToReselect')}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Upload className="h-8 w-8 mx-auto text-gray-400" aria-hidden="true" />
                                <p className="text-lg font-medium">{t('upload.dragOrClick')}</p>
                                <p className="text-sm text-muted-foreground">{t('upload.supportAnyFormat')}</p>
                            </div>
                        )}
                        <input
                            id="file-input"
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            disabled={uploadFiles.some(f => f.uploading)}
                            multiple
                            aria-label={t('upload.dragOrClick')}
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
                        <section className="space-y-4" aria-label={t('upload.uploading')}>
                            <h3 className="sr-only">{t('upload.uploading')}</h3>
                            {uploadFiles.map((f, idx) => (
                                <article key={f.file.name + f.file.size + idx} className="border rounded p-3 bg-background flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <File className="h-5 w-5 text-green-600" aria-hidden="true" />
                                        <span className="font-medium text-sm flex-1 truncate" title={f.file.name}>
                                            {f.file.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {t('upload.fileSizeLabel', { size: (f.file.size / 1024 / 1024).toFixed(2) })}
                                        </span>
                                    </div>
                                    {f.uploading && (
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs">
                                                <span>{t('upload.uploading')}</span>
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
                                                        aria-label={`${f.file.name} ${t('upload.copyLink')}`}
                                                    />
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => copyToClipboard(f.uploadedUrl!)}
                                                        aria-label={`${t('upload.copyLink')} ${f.file.name}`}
                                                    >
                                                        {t('upload.copyLink')}
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
                    <CardTitle className="text-base">{t('upload.uploadHistory')}</CardTitle>
                    {history.length > 0 && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={clearHistory}
                            aria-label={t('upload.clearHistory')}
                        >
                            {t('upload.clearHistory')}
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <div className="text-muted-foreground text-sm py-6 text-center">
                            {t('upload.noHistory')}
                        </div>
                    ) : (
                        <nav aria-label={t('upload.uploadHistory')}>
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
                                            aria-label={`${t('upload.copyLink')} ${item.fileName}`}
                                            title={`${t('upload.copyLink')} ${item.fileName}`}
                                        >
                                            {t('upload.copyLink')}
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
