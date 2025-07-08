'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProcessorCategory, ProcessorFunction } from '@/types/media-processor';
import { getFunctionsByCategory, getFunctionById } from '@/config/processor-functions';

interface FunctionSelectorProps {
  category: ProcessorCategory;
  selectedFunction: string;
  onFunctionChange: (functionId: string) => void;
  disabled?: boolean;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  category,
  selectedFunction,
  onFunctionChange,
  disabled = false
}) => {
  const availableFunctions = getFunctionsByCategory(category);
  const currentFunction = getFunctionById(selectedFunction);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        功能选择
      </label>
      <Select
        value={selectedFunction}
        onValueChange={onFunctionChange}
        disabled={disabled}
      >
        <SelectTrigger className="bg-background border-border">
          <SelectValue>
            {currentFunction ? (
              <div className="flex items-center gap-2">
                <span>{currentFunction.icon}</span>
                <span>{currentFunction.label}</span>
              </div>
            ) : (
              '选择功能...'
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {availableFunctions.map((func) => (
            <SelectItem 
              key={func.id} 
              value={func.id} 
              className="hover:bg-accent"
            >
              <div className="flex items-center gap-2">
                <span>{func.icon}</span>
                <div className="flex flex-col">
                  <span className="font-medium">{func.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {func.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}; 