import { Metadata } from 'next';

const siteName = '在线工具箱';
const baseUrl = 'https://tools.colorfu.me';

export const metadata: Metadata = {
    title: '图片批量处理器 - 支持批量转换格式压缩图片 | ' + siteName,
    description:
        '免费在线批量图片处理工具，支持批量转换格式、压缩、尺寸调整、旋转翻转等功能。本地浏览器处理，无需上传服务器，保护您的隐私安全。',
    keywords: [
        '批量图片处理',
        '图片批量转换',
        '图片批量压缩',
        '在线批量图片工具',
        '批量格式转换',
        '隐私保护',
    ],
    openGraph: {
        title: '批量图片处理器 - 在线批量转换格式压缩图片',
        description:
            '免费在线批量图片处理工具，支持批量转换格式、压缩、尺寸调整。本地处理，保护隐私。',
        url: `${baseUrl}/processor/batchimage`,
        siteName,
        type: 'website',
        locale: 'zh_CN',
    },
    twitter: {
        card: 'summary_large_image',
        title: '批量图片处理器 - 在线批量转换格式压缩图片',
        description:
            '免费在线批量图片处理工具，支持批量转换格式、压缩、尺寸调整。本地处理，保护隐私。',
    },
    alternates: {
        canonical: `${baseUrl}/processor/batchimage`,
    },
};