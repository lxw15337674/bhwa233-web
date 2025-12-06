'use client';


import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getFunctionById, getFunctionsByCategory } from '../../config/processor-functions';
import { ProcessorCategory } from '../../types/media-processor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


interface FunctionSelectorProps {
  disabled?: boolean;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({ disabled }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 支持两种 URL 格式：
  // 1. /processor/{category}/{function}
  // 2. /media-processor?category={category}&function={function}
  let category: string;
  let selectedFunction: string;

  if (pathname.startsWith('/media-processor')) {
    // 查询参数格式
    category = searchParams?.get('category') || 'audio';
    selectedFunction = searchParams?.get('function') || '';
  } else {
    // 路径参数格式
    const [, , cat = 'text', func = ''] = pathname.split('/');
    category = cat;
    selectedFunction = func;
  }

  // 调试日志
  console.log('[FunctionSelector] Debug:', {
    pathname,
    category,
    selectedFunction,
    searchParams: searchParams?.toString()
  });

  const availableFunctions = getFunctionsByCategory(category as ProcessorCategory);
  const currentFunction = getFunctionById(selectedFunction);

  console.log('[FunctionSelector] Functions:', {
    availableFunctions: availableFunctions.map(f => ({ id: f.id, label: f.label })),
    currentFunction: currentFunction ? { id: currentFunction.id, label: currentFunction.label } : null
  });

  const handleFunctionChange = (functionId: string) => {
    // 跳转到新功能的 url
    if (pathname.startsWith('/media-processor')) {
      // 查询参数格式
      router.push(`/media-processor?category=${category}&function=${functionId}`);
    } else {
    // 路径参数格式
      router.push(`/processor/${category}/${functionId}`);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        功能选择
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