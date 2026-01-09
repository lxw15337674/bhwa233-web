'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { Categories } from '@/app/RouterConfig';
import { notFound } from 'next/navigation';

interface ToolCategoryListProps {
  categoryId: string;
}

export function ToolCategoryList({ categoryId }: ToolCategoryListProps) {
  const t = useTranslations();
  const locale = useLocale();

  // 查找对应的分类配置
  const category = Categories.find(c => c.id === categoryId);

  if (!category) {
    notFound();
  }

  const categoryTitle = t(category.translationKey);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {category.icon && <category.icon className="w-8 h-8" />}
          <h1 className="text-3xl font-bold">{categoryTitle}</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {t('home.description')} {/* 或者使用更具体的分类描述如果将来有的话 */}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {category.items.map((tool) => {
            const toolName = t(tool.translationKey);
            const toolDesc = t(tool.descriptionKey);

            return (
            <Link
              key={tool.url}
              href={`/${locale}${tool.url}`}
              className="group relative flex flex-col p-6 rounded-xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  {tool.icon && <tool.icon className="w-6 h-6 text-primary" />}
                </div>
                <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                  {toolName}
                </h2>
              </div>
              <p className="text-muted-foreground text-sm line-clamp-2">
                {toolDesc}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
