import { Metadata } from 'next';

const siteName = '在线工具箱';
const baseUrl = 'https://tools.colorfu.me';

export const metadata: Metadata = {
    title: '在线图片编辑器 - 裁剪、滤镜、标注、水印 | ' + siteName,
    description:
        '免费在线图片编辑工具，支持裁剪、滤镜、标注、水印、文字添加等高级编辑功能。本地浏览器处理，无需上传服务器，保护您的隐私安全。',
    keywords: [
        '图片编辑器',
        '在线图片编辑',
        '图片裁剪',
        '图片滤镜',
        '图片标注',
        '添加水印',
        '图片文字',
        '免费图片编辑',
    ],
    openGraph: {
        title: '在线图片编辑器 - 裁剪、滤镜、标注、水印',
        description:
            '免费在线图片编辑工具，支持裁剪、滤镜、标注、水印等功能。本地处理，保护隐私。',
        url: `${baseUrl}/processor/editor`,
        siteName,
        type: 'website',
        locale: 'zh_CN',
    },
    twitter: {
        card: 'summary_large_image',
        title: '在线图片编辑器 - 裁剪、滤镜、标注、水印',
        description:
            '免费在线图片编辑工具，支持裁剪、滤镜、标注、水印等功能。本地处理，保护隐私。',
    },
    alternates: {
        canonical: `${baseUrl}/processor/editor`,
    },
};
