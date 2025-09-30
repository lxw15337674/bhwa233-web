// 'use server';

import axios from "axios";

const GALLERY_URL = 'https://cloudflare-imgbed-76v.pages.dev';

export async function uploadToGalleryServer(
    file: File,
    onProgress?: (progress: number) => void
): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`/telegraph-upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total && onProgress) {
                    const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress(progress);
                }
            }
        });

        if (!response.data[0]?.src) {
            throw new Error('Upload response missing file URL');
        }

        const url = `${GALLERY_URL}${response.data[0].src}`;
        return url;
    } catch (error: any) {
        console.error(`File upload failed: ${error.message}`);
        if (error.response?.status === 403) {
            throw new Error('上传失败：访问被拒绝，可能是CORS问题');
        }
        throw new Error(`上传失败：${error.message || '未知错误'}`);
    }
}
