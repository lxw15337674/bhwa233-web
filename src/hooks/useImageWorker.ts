/**
 * 图片处理 Worker Hook
 * 管理 Web Worker 的生命周期和通信
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
    WorkerRequest,
    WorkerResponse,
    WorkerProgressResponse,
    WorkerSuccessResponse,
    WorkerErrorResponse,
} from '@/workers/image-processor.worker';
import { ImageProcessingOptions, ImageMetadata } from '@/utils/imageProcessor';

// 最大文件大小 50MB
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

export interface ProcessingProgress {
    percent: number;
    message: string;
}

export interface ProcessingResult {
    blob: Blob;
    metadata: ImageMetadata;
}

interface UseImageWorkerReturn {
    /** 处理图片 */
    processImage: (file: File, options: ImageProcessingOptions) => Promise<ProcessingResult>;
    /** 是否正在处理 */
    isProcessing: boolean;
    /** 处理进度 */
    progress: ProcessingProgress | null;
    /** 错误信息 */
    error: string | null;
    /** Worker 是否已加载 */
    isWorkerReady: boolean;
    /** 取消当前处理 */
    cancel: () => void;
}

export function useImageWorker(): UseImageWorkerReturn {
    const workerRef = useRef<Worker | null>(null);
    const pendingRequestRef = useRef<{
        resolve: (result: ProcessingResult) => void;
        reject: (error: Error) => void;
    } | null>(null);
    const requestIdRef = useRef<string>('');

    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState<ProcessingProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isWorkerReady, setIsWorkerReady] = useState(false);

    // 初始化 Worker（懒加载）
    const initWorker = useCallback(() => {
        if (workerRef.current) {
            return workerRef.current;
        }

        const worker = new Worker(
            new URL('../workers/image-processor.worker.ts', import.meta.url)
        );

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const response = event.data;

            // 检查请求 ID 是否匹配
            if (response.id !== requestIdRef.current) {
                return;
            }

            switch (response.type) {
                case 'progress': {
                    const progressResponse = response as WorkerProgressResponse;
                    setProgress({
                        percent: progressResponse.percent,
                        message: progressResponse.message,
                    });
                    break;
                }
                case 'success': {
                    const successResponse = response as WorkerSuccessResponse;
                    const blob = new Blob([successResponse.buffer], {
                        type: successResponse.metadata.format,
                    });

                    if (pendingRequestRef.current) {
                        pendingRequestRef.current.resolve({
                            blob,
                            metadata: successResponse.metadata,
                        });
                        pendingRequestRef.current = null;
                    }

                    setIsProcessing(false);
                    setProgress({ percent: 100, message: '完成' });
                    break;
                }
                case 'error': {
                    const errorResponse = response as WorkerErrorResponse;
                    setError(errorResponse.error);

                    if (pendingRequestRef.current) {
                        pendingRequestRef.current.reject(new Error(errorResponse.error));
                        pendingRequestRef.current = null;
                    }

                    setIsProcessing(false);
                    setProgress(null);
                    break;
                }
            }
        };

        worker.onerror = (event) => {
            const errorMessage = event.message || 'Worker 错误';
            setError(errorMessage);

            if (pendingRequestRef.current) {
                pendingRequestRef.current.reject(new Error(errorMessage));
                pendingRequestRef.current = null;
            }

            setIsProcessing(false);
        };

        workerRef.current = worker;
        setIsWorkerReady(true);

        return worker;
    }, []);

    // 处理图片
    const processImage = useCallback(
        async (file: File, options: ImageProcessingOptions): Promise<ProcessingResult> => {
            // 检查文件大小
            if (file.size > MAX_FILE_SIZE) {
                const sizeMB = (file.size / 1024 / 1024).toFixed(2);
                throw new Error(`文件过大 (${sizeMB}MB)，最大支持 50MB`);
            }

            // 初始化 Worker
            const worker = initWorker();

            // 取消之前的请求
            if (pendingRequestRef.current) {
                pendingRequestRef.current.reject(new Error('已取消'));
                pendingRequestRef.current = null;
            }

            // 重置状态
            setIsProcessing(true);
            setProgress({ percent: 0, message: '准备中...' });
            setError(null);

            // 生成请求 ID
            const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
            requestIdRef.current = requestId;

            // 读取文件
            const buffer = await file.arrayBuffer();

            return new Promise((resolve, reject) => {
                pendingRequestRef.current = { resolve, reject };

                const request: WorkerRequest = {
                    type: 'process',
                    id: requestId,
                    buffer,
                    fileName: file.name,
                    options,
                };

                // 发送请求，转移 buffer 所有权
                worker.postMessage(request, { transfer: [buffer] });
            });
        },
        [initWorker]
    );

    // 取消处理
    const cancel = useCallback(() => {
        if (pendingRequestRef.current) {
            pendingRequestRef.current.reject(new Error('已取消'));
            pendingRequestRef.current = null;
        }

        // 更新请求 ID 使进行中的请求响应被忽略
        requestIdRef.current = '';

        setIsProcessing(false);
        setProgress(null);
    }, []);

    // 清理 Worker
    useEffect(() => {
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, []);

    return {
        processImage,
        isProcessing,
        progress,
        error,
        isWorkerReady,
        cancel,
    };
}
