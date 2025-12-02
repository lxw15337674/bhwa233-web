'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ProcessorCategory } from '@/types/media-processor';
import { PROCESSOR_CATEGORIES } from '@/config/processor-functions';
import { usePathname } from 'next/navigation';

export const CategoryNavigation = ({
}) => {
  const pathname = usePathname(); // /processor/audio/xxx 或 /processor/image
  const [, , currentCategory] = pathname.split('/'); // currentCategory = 'audio' 或 'image'
  return (
    <nav className="mb-8">
      <div className="flex justify-center">
        <div className="flex bg-muted p-1 rounded-lg">
          {Object.entries(PROCESSOR_CATEGORIES).map(([key, config]) => {
            const category = key as ProcessorCategory;
            // 构建目标 URL：如果有默认子路由则添加，否则直接到分类页面
            const targetUrl = config.default
              ? `/processor/${category}/${config.default}`
              : `/processor/${category}`;
            return (
              <button
                key={category}
                onClick={() => {
                  window.location.href = targetUrl;
                }}
                className={cn(
                  "flex items-center space-x-2 px-6 py-3 rounded-md text-sm font-medium transition-colors",
                  currentCategory === category
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-lg">{config.icon}</span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}; 