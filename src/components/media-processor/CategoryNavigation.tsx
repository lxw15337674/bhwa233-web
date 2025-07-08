'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ProcessorCategory } from '@/types/media-processor';
import { PROCESSOR_CATEGORIES } from '@/config/processor-functions';

interface CategoryNavigationProps {
  currentCategory: ProcessorCategory;
  onCategoryChange: (category: ProcessorCategory) => void;
}

export const CategoryNavigation: React.FC<CategoryNavigationProps> = ({
  currentCategory,
  onCategoryChange
}) => {
  return (
    <nav className="mb-8">
      <div className="flex justify-center">
        <div className="flex bg-muted p-1 rounded-lg">
          {Object.entries(PROCESSOR_CATEGORIES).map(([key, config]) => {
            const category = key as ProcessorCategory;
            return (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
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