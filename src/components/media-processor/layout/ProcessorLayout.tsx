import React from 'react';

interface ProcessorLayoutProps {
  title: string;
  description: string;
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
}

export const ProcessorLayout: React.FC<ProcessorLayoutProps> = ({
  title,
  description,
  leftColumn,
  rightColumn,
}) => {
  return (
    <div className="min-h-screen text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            {title}
          </h1>
          <p className="text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：文件上传和媒体信息 */}
          <div className="lg:col-span-2 space-y-6">
            {leftColumn}
          </div>

          {/* 右侧：控制面板、进度、预览 */}
          <div className="space-y-6">
            {rightColumn}
          </div>
        </div>
      </div>
    </div>
  );
};
