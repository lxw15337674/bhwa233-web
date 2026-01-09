import React from 'react';

export interface SEOContentData {
  title: string;
  description: string;
  features: string[];
}

interface SEOContentProps {
  data?: SEOContentData;
  className?: string;
}

/**
 * 专门用于在页面底部展示 SEO 友好内容的组件
 * 包含标题、描述和功能点列表
 */
export const SEOContent: React.FC<SEOContentProps> = ({ data, className = "" }) => {
  if (!data) return null;

  return (
    <article className={`prose prose-slate dark:prose-invert max-w-none bg-card rounded-xl p-8 border shadow-sm ${className}`}>
      <h2 className="text-2xl font-bold mb-4 text-primary">{data.title}</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        {data.description}
      </p>
      
      {data.features && data.features.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <span className="text-card-foreground">{feature}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};
