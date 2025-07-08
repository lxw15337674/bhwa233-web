import { redirect } from 'next/navigation';

export default function AudioConverterPage() {
    // 重定向到新的统一媒体处理器，保持音频提取功能
    redirect('/media-processor?category=video&function=audio-extract');
}
