import type { Metadata } from 'next';
import { Suspense } from 'react';
import MediaProcessorView from '@/components/media-processor/MediaProcessorView';

export const metadata: Metadata = {
  title: '媒体处理器 | 视频音频处理工具',
  description: '强大的在线媒体处理工具，支持视频音频提取、格式转换、压缩等功能',
};

export default function MediaProcessorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MediaProcessorView />
    </Suspense>
  );
} 