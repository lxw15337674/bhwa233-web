'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getFunctionById, getFunctionsByCategory } from '../../config/processor-functions';
import { ProcessorCategory } from '../../types/media-processor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useTranslation } from '@/components/TranslationProvider';


interface FunctionSelectorProps {
  disabled?: boolean;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({ disabled }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 支持两种 URL 格式：
  // 1. /[locale]/processor/{category}/{path} (新)
  // 2. /[locale]/media-processor?category={category}&function={function} (旧 - 兼容)
  let category: string;
  let selectedFunctionId: string = '';

  if (pathname.includes('/media-processor')) {
    // 查询参数格式 (旧)
    category = searchParams?.get('category') || 'audio';
    selectedFunctionId = searchParams?.get('function') || '';
  } else {
    // 路径参数格式 (新)
    const pathParts = pathname.split('/').filter(Boolean);
    const processorIndex = pathParts.findIndex(part => part === 'processor');

    if (processorIndex !== -1) {
      category = pathParts[processorIndex + 1] || 'audio';
      const path = pathParts[processorIndex + 2] || '';
      
      // 通过 category 和 path 查找对应的 function ID
      const functions = getFunctionsByCategory(category as ProcessorCategory);
      const func = functions.find(f => f.path === path || f.id === path); // 兼容 path 或 id
      if (func) {
        selectedFunctionId = func.id;
      }
    } else {
      // 默认回退
      category = 'audio';
    }
  }

  const availableFunctions = getFunctionsByCategory(category as ProcessorCategory);
  const currentFunction = getFunctionById(selectedFunctionId);

  const handleFunctionChange = (functionId: string) => {
    // 提取当前语言前缀
    const pathParts = pathname.split('/').filter(Boolean);
    const locale = pathParts[0] || 'en'; // 第一个部分是 locale

    const targetFunc = getFunctionById(functionId);
    if (!targetFunc) return;

    // 跳转到新功能的 url，保留 locale
    if (pathname.includes('/media-processor')) {
      // 查询参数格式 (旧 - 保持兼容，或者重定向到新格式？这里保持旧格式跳转)
      router.push(`/${locale}/media-processor?category=${category}&function=${functionId}`);
    } else {
      // 路径参数格式 (新)
      // 优先使用 path，如果没有则使用 id
      const pathSegment = targetFunc.path || targetFunc.id;
      router.push(`/${locale}/processor/${category}/${pathSegment}`);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {t('mediaProcessor.functionSelect')}
      </label>
      <Select
        disabled={disabled}
        value={selectedFunctionId}
        onValueChange={handleFunctionChange}
      >
        <SelectTrigger className="bg-background border-border">
          <SelectValue>
            {currentFunction ? (
              <div className="flex items-center gap-2">
                <span>{currentFunction.icon}</span>
                <span>
                  {currentFunction.labelKey
                    ? t(currentFunction.labelKey)
                    : currentFunction.label}
                </span>
              </div>
            ) : (
              t('mediaProcessor.selectFunction')
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
                  <span className="font-medium">
                    {func.labelKey ? t(func.labelKey) : func.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {func.descriptionKey ? t(func.descriptionKey) : func.description}
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