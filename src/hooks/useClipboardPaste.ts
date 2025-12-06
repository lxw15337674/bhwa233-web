import { useCallback } from 'react';
import { readImagesFromClipboard, isClipboardApiSupported } from '@/utils/clipboardUtils';

/**
 * 剪贴板错误类型
 */
export enum ClipboardError {
    API_NOT_SUPPORTED = 'api_not_supported',
    PERMISSION_DENIED = 'permission_denied',
    NO_IMAGES = 'no_images',
    UNKNOWN = 'unknown'
}

/**
 * useClipboardPaste Hook 配置选项
 */
export interface UseClipboardPasteOptions {
    /**
     * 文件选择回调 (必需)
     */
    onFilesSelected: (files: File[]) => void;

    /**
     * 错误处理回调 (可选)
     */
    onError?: (error: ClipboardError, originalError?: Error) => void;

    /**
     * 是否启用调试日志 (可选，默认 false)
     */
    debug?: boolean;

    /**
     * 文件过滤器 (可选)
     * 返回 true 表示接受该文件
     */
    fileFilter?: (file: File) => boolean;
}

/**
 * 剪贴板粘贴图片 Hook
 * 
 * @example
 * ```tsx
 * const { handlePaste } = useClipboardPaste({
 *   onFilesSelected: (files) => console.log(files),
 *   debug: true,
 *   onError: (error) => {
 *     if (error === ClipboardError.PERMISSION_DENIED) {
 *       alert('需要剪贴板权限');
 *     }
 *   }
 * });
 * 
 * <Button onClick={handlePaste}>粘贴图片</Button>
 * ```
 */
export function useClipboardPaste(options: UseClipboardPasteOptions) {
    const { onFilesSelected, onError, debug = false, fileFilter } = options;

    const log = useCallback((...args: any[]) => {
        if (debug) {
            console.log('[useClipboardPaste]', ...args);
        }
    }, [debug]);

    const handlePaste = useCallback(async () => {
        try {
            // 检查 API 支持
            if (!isClipboardApiSupported()) {
                log('浏览器不支持 Clipboard API');
                onError?.(ClipboardError.API_NOT_SUPPORTED);
                alert('您的浏览器不支持剪贴板功能，请使用拖拽或选择文件的方式添加图片');
                return;
            }

            log('开始读取剪贴板...');
            const imageFiles = await readImagesFromClipboard();
            log('读取到图片:', imageFiles);

            // 应用文件过滤器
            const filteredFiles = fileFilter
                ? imageFiles.filter(fileFilter)
                : imageFiles;

            log('过滤后的图片:', filteredFiles);

            if (filteredFiles.length === 0) {
                log('剪贴板中没有符合条件的图片');
                onError?.(ClipboardError.NO_IMAGES);
                return;
            }

            // 回调文件选择
            onFilesSelected(filteredFiles);
            log('图片已添加');

        } catch (error) {
            const err = error as Error;
            log('粘贴失败:', err);

            // 判断错误类型
            if (err.message === 'PERMISSION_DENIED') {
                onError?.(ClipboardError.PERMISSION_DENIED, err);
                alert('需要剪贴板访问权限才能粘贴图片');
            } else if (err.message === 'CLIPBOARD_API_NOT_SUPPORTED') {
                onError?.(ClipboardError.API_NOT_SUPPORTED, err);
            } else {
                onError?.(ClipboardError.UNKNOWN, err);
            }
        }
    }, [onFilesSelected, onError, debug, fileFilter, log]);

    return { handlePaste };
}
