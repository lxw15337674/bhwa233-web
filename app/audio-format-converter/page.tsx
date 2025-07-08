import { Metadata } from 'next';
import AudioFormatConverterView from './AudioFormatConverterView';

export const metadata: Metadata = {
    title: '音频格式转换 - 音频文件格式互转工具',
    description: '支持MP3、WAV、AAC、FLAC、OGG等音频格式之间的转换，保持最佳音质',
    keywords: '音频格式转换, MP3转WAV, 音频转换器, 音频格式互转, WAV转MP3, AAC转换',
    openGraph: {
        title: '音频格式转换工具',
        description: '高质量音频格式转换，支持多种主流音频格式',
        type: 'website',
    },
};

export default function AudioFormatConverterPage() {
    return <AudioFormatConverterView />;
}
