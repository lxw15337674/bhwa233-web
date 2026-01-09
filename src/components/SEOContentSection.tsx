import React from 'react';

interface SEOContentSectionProps {
  content: {
    title: string;
    description: string;
    features: string[];
  };
  className?: string;
}

/**
 * 可复用的 SEO 内容区域组件
 * 用于在页面底部展示 SEO 友好的内容，包括标题、描述和功能列表
 */
export const SEOContentSection: React.FC<SEOContentSectionProps> = ({
  content,
  className = "mt-12"
}) => {
  return (
    <article className={`${className} prose prose-slate dark:prose-invert max-w-none bg-card rounded-xl p-8 border shadow-sm`}>
      <h2 className="text-2xl font-bold mb-4 text-primary">{content.title}</h2>
      <p className="text-muted-foreground leading-relaxed mb-6">
        {content.description}
      </p>

      {content.features && content.features.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.features.map((feature, index) => (
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
