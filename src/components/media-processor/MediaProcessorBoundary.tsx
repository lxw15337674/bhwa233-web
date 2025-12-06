import React from 'react';
import { MediaProcessorProvider, useMediaProcessor } from '@/components/media-processor/providers/MediaProcessorProvider';
import { UnifiedMediaAnalysisProvider } from '@/components/media-processor/providers/UnifiedMediaAnalysisProvider';
import { FileSelectionProvider } from '@/components/media-processor/providers/FileSelectionProvider';

interface MediaProcessorBoundaryProps {
  children: React.ReactNode;
}

/**
 * 媒体处理器边界组件
 * 为媒体处理功能提供统一的上下文
 * 包含 FFmpeg 管理、文件选择、媒体分析等功能
 */
export const MediaProcessorBoundary: React.FC<MediaProcessorBoundaryProps> = ({ children }) => {
  return (
    <MediaProcessorProvider>
      <FileSelectionProvider>
        {/* UnifiedMediaAnalysisProvider 需要访问 FFmpeg 实例，所以我们创建一个中间组件 */}
        <MediaProcessorContextConnector>
          {children}
        </MediaProcessorContextConnector>
      </FileSelectionProvider>
    </MediaProcessorProvider>
  );
};

// 中间组件来连接 MediaProcessorContext 和 UnifiedMediaAnalysisProvider
const MediaProcessorContextConnector: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ffmpeg } = useMediaProcessor();

  return (
    <UnifiedMediaAnalysisProvider ffmpeg={ffmpeg ? ffmpeg : null}>
      {children}
    </UnifiedMediaAnalysisProvider>
  );
};