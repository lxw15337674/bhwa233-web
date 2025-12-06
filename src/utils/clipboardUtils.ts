/**
 * 剪贴板工具函数
 * 提供剪贴板图片读取的核心功能
 */

/**
 * 检查浏览器是否支持 Clipboard API
 */
export function isClipboardApiSupported(): boolean {
    return !!(navigator.clipboard && navigator.clipboard.read);
}

/**
 * 生成粘贴图片的文件名
 * @param timestamp 时间戳
 * @param mimeType MIME 类型 (例如: 'image/png')
 * @returns 文件名 (例如: 'pasted-image-1234567890.png')
 */
export function generatePastedFileName(timestamp: number, mimeType: string): string {
    const extension = mimeType.split('/')[1] || 'png';
    return `pasted-image-${timestamp}.${extension}`;
}

/**
 * 从剪贴板读取图片文件
 * @returns Promise<File[]> 图片文件数组
 * @throws Error 如果 API 不支持、权限被拒绝或读取失败
 */
export async function readImagesFromClipboard(): Promise<File[]> {
    // 检查 API 支持
    if (!isClipboardApiSupported()) {
        throw new Error('CLIPBOARD_API_NOT_SUPPORTED');
    }

    try {
        const clipboardItems = await navigator.clipboard.read();
        const imageFiles: File[] = [];

        for (const clipboardItem of clipboardItems) {
            for (const type of clipboardItem.types) {
                if (type.startsWith('image/')) {
                    const blob = await clipboardItem.getType(type);
                    const timestamp = Date.now();
                    const fileName = generatePastedFileName(timestamp, type);
                    const file = new File([blob], fileName, { type });
                    imageFiles.push(file);
                }
            }
        }

        return imageFiles;
    } catch (error) {
        // 重新抛出错误，保留原始错误类型
        if ((error as Error).name === 'NotAllowedError') {
            throw new Error('PERMISSION_DENIED');
        }
        throw error;
    }
}
