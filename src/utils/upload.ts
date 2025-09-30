
import axios from 'axios';

const GALLERY_URL = 'https://cloudflare-imgbed-76v.pages.dev';

const log = (message: string, type: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    console.log(`[媒体上传] ${message}`);
};

export async function uploadToGallery(
    originMediaUrl: string,
    headers: Record<string, string> = {}
): Promise<string | null> {
    try {
        if (!originMediaUrl) {
            log('无效的媒体URL', 'error');
            return null;
        }
        // 下载并上传合并
        const response = await axios({
            method: 'GET',
            url: originMediaUrl,
            responseType: 'arraybuffer',
            headers: {
                'Host': new URL(originMediaUrl).hostname,
                ...headers,
            },
            timeout: 60000,
        });
        const mediaBuffer = Buffer.from(response.data);
        const fileName = `${Date.now()}`;
        const formData = new FormData();
        formData.append('file', new Blob([mediaBuffer]), fileName);
        const uploadResponse = await axios.post(`/telegraph-upload`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (!uploadResponse.data[0]?.src) {
            log('上传响应缺少文件URL', 'error');
            return null;
        }
        const galleryUrl = `${GALLERY_URL}${uploadResponse.data[0].src}`;
        log(
            `上传成功 [${originMediaUrl}]\n` +
            `  上传URL: ${galleryUrl}`,
            'success'
        );
        return galleryUrl;
    } catch (error) {
        log(`处理失败: ${originMediaUrl}, ${error}`, 'error');
        return null;
    }
}