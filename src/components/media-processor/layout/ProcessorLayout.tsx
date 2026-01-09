import React from 'react';

interface ProcessorLayoutProps {
  title: string;
  description: string;
  leftColumn: React.ReactNode;
  rightColumn: React.ReactNode;
  seoContent?: {
    title: string;
    description: string;
    features: string[];
  };
}

export const ProcessorLayout: React.FC<ProcessorLayoutProps> = ({
  title,
  description,
  leftColumn,
  rightColumn,
  seoContent,
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* 左侧：文件上传和媒体信息 */}
          <div className="lg:col-span-2 space-y-6">
            {leftColumn}
          </div>

          {/* 右侧：控制面板、进度、预览 */}
          <div className="space-y-6">
            {rightColumn}
          </div>
        </div>

        {/* SEO 内容区域 */}
        {seoContent && (
          <article className="prose prose-slate dark:prose-invert max-w-none bg-card rounded-xl p-8 border shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-primary">{seoContent.title}</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              {seoContent.description}
            </p>
            
            {seoContent.features && seoContent.features.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seoContent.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <span className="text-card-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </article>
        )}
      </div>
    </div>
  );
};
