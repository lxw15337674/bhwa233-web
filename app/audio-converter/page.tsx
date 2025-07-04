import AudioConverterView from './AudioConverterView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '在线视频转音频工具 - 免费视频提取音频 | 支持MP4转MP3',
    description: '免费在线视频转音频工具，支持MP4、AVI、MOV等格式转换为MP3、AAC、WAV音频。基于FFmpeg.wasm技术，完全在浏览器端处理，保护隐私安全。',
    keywords: [
        '视频转音频', 'MP4转MP3', '视频提取音频', '在线音频转换',
        'FFmpeg在线', '视频音频分离', '免费转换工具', '浏览器转换',
        '无需上传', '隐私安全', 'WAV转换', 'AAC转换', 'M4A转换', '音频格式转换'
    ],
    authors: [{ name: '233tools' }],
    creator: '233tools',
    publisher: '工具箱',
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        title: '在线视频转音频工具 - 免费视频提取音频',
        description: '支持MP4、AVI、MOV等格式转换为MP3、AAC、WAV音频，完全在浏览器端处理，保护隐私安全',
        url: 'https://233tools.vercel.app/audio-converter',
        siteName: '工具箱',
        locale: 'zh_CN',
        type: 'website',
        images: [
            {
                url: '/icons/icon-256.png',
                width: 256,
                height: 256,
                alt: '在线视频转音频工具',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '在线视频转音频工具 - 免费视频提取音频',
        description: '支持MP4、AVI、MOV等格式转换为MP3、AAC、WAV音频，完全在浏览器端处理',
        images: ['/icons/icon-256.png'],
    },
    alternates: {
        canonical: 'https://233tools.vercel.app/audio-converter',
        languages: {
            'zh-CN': 'https://233tools.vercel.app/audio-converter',
        },
    },
    other: {
        'google-site-verification': 'fc9f0f35f747acd0',
    },
};

const Page = () => {
    return (
        <>
            {/* 结构化数据 - JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'WebApplication',
                        name: '在线视频转音频工具',
                        description: '免费在线视频转音频工具，支持多种视频格式转换为音频格式，基于FFmpeg.wasm技术',
                        url: 'https://233tools.vercel.app/audio-converter',
                        applicationCategory: 'MultimediaApplication',
                        operatingSystem: 'Any',
                        inLanguage: 'zh-CN',
                        audience: {
                            '@type': 'Audience',
                            audienceType: '内容创作者、媒体工作者、普通用户',
                        },
                        offers: {
                            '@type': 'Offer',
                            price: '0',
                            priceCurrency: 'CNY',
                            availability: 'https://schema.org/InStock',
                        },
                        featureList: [
                            '视频转音频',
                            '支持多种格式',
                            '浏览器端处理',
                            '隐私安全',
                            '免费使用',
                            '无需上传',
                            '实时转换',
                            '高质量输出',
                        ],
                        browserRequirements: 'HTML5, WebAssembly, JavaScript enabled',
                        softwareVersion: '1.0',
                        author: {
                            '@type': 'Person',
                            name: '233tools',
                        },
                        provider: {
                            '@type': 'Organization',
                            name: '工具箱',
                            url: 'https://233tools.vercel.app',
                        },
                        about: [
                            {
                                '@type': 'Thing',
                                name: '视频转音频',
                                description: '从视频文件中提取音频轨道的过程',
                            },
                            {
                                '@type': 'Thing',
                                name: 'FFmpeg',
                                description: '强大的多媒体处理工具',
                            },
                        ],
                    }),
                }}
            />
            <AudioConverterView />
        </>
    );
};

export default Page;
