'use client';


import { usePathname, useRouter } from 'next/navigation';
import { getFunctionById, getFunctionsByCategory } from '../../config/processor-functions';
import { ProcessorCategory } from '../../types/media-processor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';


interface FunctionSelectorProps {
  disabled?: boolean;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({ disabled }) => {
  const router = useRouter();
  // 通过 usePathname 获取 category 和 function
  const pathname = usePathname();
  // 兼容 /category/function 或 /category/function/xxx
  const [, category = 'text', selectedFunction = ''] = pathname.split('/');
  const availableFunctions = getFunctionsByCategory(category as ProcessorCategory);
  const currentFunction = getFunctionById(selectedFunction);

  const handleFunctionChange = (functionId: string) => {
    // 跳转到新功能的 url
    router.push(`/${category}/${functionId}`);
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