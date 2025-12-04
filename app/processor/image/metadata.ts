import { Metadata } from 'next';

const siteName = '在线工具箱';
const baseUrl = 'https://tools.colorfu.me';

export const metadata: Metadata = {
    title: '在线图片处理器 - 压缩、格式转换、尺寸调整 | ' + siteName,
    description:
        '免费在线图片处理工具，支持 JPEG/PNG/WebP 格式转换、图片压缩、尺寸调整、旋转翻转。本地浏览器处理，无需上传服务器，保护您的隐私安全。',
    keywords: [
        '图片压缩',
        '图片格式转换',
        '在线图片处理',
        'WebP转换',
        'JPEG压缩',
        'PNG压缩',
        '图片尺寸调整',
        '图片旋转',
        '免费图片工具',
    ],
    openGraph: {
        title: '在线图片处理器 - 压缩、格式转换、尺寸调整',
        description:
            '免费在线图片处理工具，支持格式转换、压缩、尺寸调整。本地处理，保护隐私。',
        url: `${baseUrl}/processor/image`,
        siteName,
        type: 'website',
        locale: 'zh_CN',
    },
    twitter: {
        card: 'summary_large_image',
        title: '在线图片处理器 - 压缩、格式转换、尺寸调整',
        description:
            '免费在线图片处理工具，支持格式转换、压缩、尺寸调整。本地处理，保护隐私。',
    },
    alternates: {
        canonical: `${baseUrl}/processor/image`,
    },
};
