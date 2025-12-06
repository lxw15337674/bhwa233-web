import { create } from 'zustand';
import JSZip from 'jszip';
import {
    ImageMetadata,
    ImageProcessingOptions,
    defaultImageOptions,
    getImageMetadata,
    generateOutputFilename,
    validateImageFile,
} from '@/utils/imageProcessor';
import { ExifMetadata } from './image-store';

// Max file size (same as single)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export interface ImageTask {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'success' | 'error';
    inputMetadata?: ImageMetadata;
    exifMetadata?: ExifMetadata;  // EXIF 元数据
    outputBlob?: Blob;
    outputMetadata?: ImageMetadata;
    error?: string;
    progress: number;
}

interface BatchImageStore {
    tasks: ImageTask[];
    options: ImageProcessingOptions;
    isProcessing: boolean;
    processingCurrentId: string | null; // ID of currently processing task

    // Actions
    addFiles: (files: File[]) => Promise<void>;
    removeTask: (id: string) => void;
    clearTasks: () => void;
    updateOptions: (options: Partial<ImageProcessingOptions>) => void;
    startProcessing: () => Promise<void>;
    cancelProcessing: () => void;
    resetTaskStatus: () => void; // Reset all to pending (for retry)
    downloadAll: () => Promise<void>;
    loadExifForTask: (taskId: string) => Promise<void>; // 加载单个任务的 EXIF
}

// Worker types (copied for consistency)
interface WorkerRequest {
    type: 'process' | 'getExif';
    id: string;
    buffer: ArrayBuffer;
    fileName: string;
    options: ImageProcessingOptions;
}

interface WorkerResponse {
    type: 'progress' | 'success' | 'error' | 'exif';
    id: string;
    percent?: number;
    message?: string;
    buffer?: ArrayBuffer;
    metadata?: ImageMetadata;
    error?: string;
    exifData?: ExifMetadata;
}

let workerInstance: Worker | null = null;

function getWorker(): Worker {
    if (!workerInstance) {
        workerInstance = new Worker(
            new URL('@/workers/image-processor.worker.ts', import.meta.url)
        );
    }
    return workerInstance;
}

export const useBatchImageStore = create<BatchImageStore>((set, get) => ({
    tasks: [],
    options: { ...defaultImageOptions },
    isProcessing: false,
    processingCurrentId: null,

    addFiles: async (files: File[]) => {
        const newTasks: ImageTask[] = [];
        
        for (const file of files) {
            // Validate
            if (!validateImageFile(file)) continue;
            if (file.size > MAX_FILE_SIZE) continue; // Skip large files for now

            const id = Math.random().toString(36).slice(2, 11);
            
            // Get metadata (async but fast enough for adding)
            try {
                const metadata = await getImageMetadata(file);
                newTasks.push({
                    id,
                    file,
                    status: 'pending',
                    inputMetadata: metadata,
                    progress: 0
                });
            } catch (e) {
                console.error(`Failed to read metadata for ${file.name}`, e);
                // Still add, but maybe mark as error or skip? 
                // Let's skip for now to be safe
            }
        }

        set((state) => ({
            tasks: [...state.tasks, ...newTasks]
        }));
    },

    removeTask: (id: string) => {
        set((state) => ({
            tasks: state.tasks.filter(t => t.id !== id)
        }));
    },

    clearTasks: () => {
        set({ tasks: [], isProcessing: false, processingCurrentId: null });
    },

    updateOptions: (newOptions: Partial<ImageProcessingOptions>) => {
        set((state) => ({
            options: { ...state.options, ...newOptions }
        }));
    },

    resetTaskStatus: () => {
        set((state) => ({
            tasks: state.tasks.map(t => ({ ...t, status: 'pending', progress: 0, error: undefined, outputBlob: undefined }))
        }));
    },

    startProcessing: async () => {
        const { isProcessing, tasks } = get();
        if (isProcessing) return;

        set({ isProcessing: true });

        const pendingTasks = tasks.filter(t => t.status === 'pending');
        if (pendingTasks.length === 0) {
            set({ isProcessing: false });
            return;
        }

        const worker = getWorker();

        for (const task of pendingTasks) {
            // Check if cancelled
            if (!get().isProcessing) break;

            set({ processingCurrentId: task.id });
            
            // Update status to processing
            set(state => ({
                tasks: state.tasks.map(t => t.id === task.id ? { ...t, status: 'processing' } : t)
            }));

            try {
                const buffer = await task.file.arrayBuffer();
                
                const result = await new Promise<{ blob: Blob; metadata: ImageMetadata }>((resolve, reject) => {
                    const handleMessage = (event: MessageEvent<WorkerResponse>) => {
                        const response = event.data;
                        if (response.id !== task.id) return;

                        if (response.type === 'progress') {
                            set(state => ({
                                tasks: state.tasks.map(t => t.id === task.id ? { ...t, progress: response.percent || 0 } : t)
                            }));
                        } else if (response.type === 'success' && response.buffer && response.metadata) {
                            worker.removeEventListener('message', handleMessage);
                            const blob = new Blob([response.buffer], { type: response.metadata.format });
                            resolve({ blob, metadata: response.metadata });
                        } else if (response.type === 'error') {
                            worker.removeEventListener('message', handleMessage);
                            reject(new Error(response.error));
                        }
                    };

                    worker.addEventListener('message', handleMessage);

                    const request: WorkerRequest = {
                        type: 'process',
                        id: task.id,
                        buffer,
                        fileName: task.file.name,
                        options: get().options,
                    };
                    
                    worker.postMessage(request, { transfer: [buffer] });
                });

                set(state => ({
                    tasks: state.tasks.map(t => t.id === task.id ? {
                        ...t,
                        status: 'success',
                        progress: 100,
                        outputBlob: result.blob,
                        outputMetadata: result.metadata
                    } : t)
                }));

            } catch (error) {
                set(state => ({
                    tasks: state.tasks.map(t => t.id === task.id ? {
                        ...t,
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Processing failed'
                    } : t)
                }));
            }
        }

        set({ isProcessing: false, processingCurrentId: null });
    },

    cancelProcessing: () => {
        set({ isProcessing: false, processingCurrentId: null });
        // Note: We can't easily cancel the *current* worker task without terminating the worker.
        // Since we reuse the worker, we let the current one finish or fail, but the loop in startProcessing will stop.
    },

    downloadAll: async () => {
        const { tasks, options } = get();
        const completedTasks = tasks.filter(t => t.status === 'success' && t.outputBlob);
        
        if (completedTasks.length === 0) return;

        const zip = new JSZip();
        
        completedTasks.forEach(task => {
            if (task.outputBlob && task.outputMetadata) {
                // Use the correct filename logic
                // If user specified a custom name pattern (e.g. "photo_"), we might need to append index or keep original name
                // For now, use the standard generator but maybe we should handle conflicts if multiple files map to same name?
                // Let's use original name + edited suffix for now, unless we implement pattern renaming.
                // If options.outputFilename is set, it's a bit tricky for batch. 
                // Usually batch renaming means "prefix_{index}" or "prefix_{original}".
                // For V1, let's just use generateOutputFilename which handles extension change.
                // If user set a specific outputFilename in batch mode, it implies they want ALL files named that? 
                // That would overwrite. 
                // Assumption: In batch mode, if outputFilename is set, it might be treated as a prefix? 
                // Let's stick to: if outputFilename is empty, use "original_edited".
                
                let filename = generateOutputFilename(task.file.name, options.outputFormat, options.outputFilename);
                
                // Check for duplicates in the zip
                let counter = 1;
                const originalFilename = filename;
                while (zip.file(filename)) {
                    const parts = originalFilename.split('.');
                    const ext = parts.pop();
                    const base = parts.join('.');
                    filename = `${base}_${counter}.${ext}`;
                    counter++;
                }
                
                zip.file(filename, task.outputBlob);
            }
        });

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch_processed_${new Date().getTime()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    loadExifForTask: async (taskId: string) => {
        const { tasks } = get();
        const task = tasks.find(t => t.id === taskId);

        if (!task || task.exifMetadata) {
            // 已经加载过或任务不存在
            return;
        }

        try {
            const worker = getWorker();
            const buffer = await task.file.arrayBuffer();

            return new Promise<void>((resolve) => {
                const handleMessage = (e: MessageEvent<WorkerResponse>) => {
                    if (e.data.id !== taskId) return;

                    if (e.data.type === 'exif') {
                        worker.removeEventListener('message', handleMessage);

                        set((state) => ({
                            tasks: state.tasks.map(t =>
                                t.id === taskId
                                    ? { ...t, exifMetadata: e.data.exifData }
                                    : t
                            )
                        }));
                        resolve();
                    } else if (e.data.type === 'error') {
                        worker.removeEventListener('message', handleMessage);
                        console.error('Failed to load EXIF for task', taskId, e.data.error);
                        resolve();
                    }
                };

                worker.addEventListener('message', handleMessage);
                worker.postMessage({
                    type: 'getExif',
                    id: taskId,
                    buffer,
                    fileName: task.file.name,
                    options: get().options
                } as WorkerRequest);
            });
        } catch (error) {
            console.error('Failed to load EXIF:', error);
        }
    }
}));
