import React from 'react';

interface MediaProcessorBoundaryProps {
  children: React.ReactNode;
}

/**
 * 媒体处理器边界组件
 * 为媒体处理功能提供统一的UI/UX边界
 * 所有状态管理已迁移到Zustand
 */
export const MediaProcessorBoundary: React.FC<MediaProcessorBoundaryProps> = ({ children }) => {
  return <>{children}</>;
};