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
  // 1. /[locale]/processor/{category}/{function}
  // 2. /[locale]/media-processor?category={category}&function={function}
  let category: string;
  let selectedFunction: string;

  if (pathname.includes('/media-processor')) {
    // 查询参数格式
    category = searchParams?.get('category') || 'audio';
    selectedFunction = searchParams?.get('function') || '';
  } else {
    // 路径参数格式 - 处理 [locale] 前缀
    const pathParts = pathname.split('/').filter(Boolean);
    const processorIndex = pathParts.findIndex(part => part === 'processor' || part === 'media-processor');

    if (processorIndex !== -1 && pathParts[processorIndex] === 'processor') {
      category = pathParts[processorIndex + 1] || 'audio';
      selectedFunction = pathParts[processorIndex + 2] || '';
    } else {
      // 回退到查询参数
      category = searchParams?.get('category') || 'audio';
      selectedFunction = searchParams?.get('function') || '';
    }
  }

  const availableFunctions = getFunctionsByCategory(category as ProcessorCategory);
  const currentFunction = getFunctionById(selectedFunction);

  const handleFunctionChange = (functionId: string) => {
    // 提取当前语言前缀
    const pathParts = pathname.split('/').filter(Boolean);
    const locale = pathParts[0] || 'en'; // 第一个部分是 locale

    // 跳转到新功能的 url，保留 locale
    if (pathname.includes('/media-processor')) {
      // 查询参数格式
      router.push(`/${locale}/media-processor?category=${category}&function=${functionId}`);
    } else {
      // 路径参数格式
      router.push(`/${locale}/processor/${category}/${functionId}`);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {t('mediaProcessor.functionSelect')}
      </label>
      <Select
        disabled={disabled}
        value={selectedFunction}
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