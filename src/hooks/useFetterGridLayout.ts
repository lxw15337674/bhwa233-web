import { useState, useEffect, RefObject } from 'react';
import { Item } from '@/utils/tftf';

interface GridConfig {
  columns: number;
  rows: number;
  gridTemplateColumns: string;
}

export const useFetterGridLayout = (
  items: Item[][],
  containerRef: RefObject<HTMLDivElement | null>
): GridConfig => {
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    columns: 0,
    rows: 0,
    gridTemplateColumns: 'auto'
  });

  useEffect(() => {
    const updateLayout = () => {
      if (!items.length || !containerRef.current) return;

      const rows = items.length;
      const columns = items[0]?.length || 0;
      
      // 生成响应式的 grid-template-columns
      // 第一列固定为 auto（用于行标题），其余列采用 minmax 响应式
      const gridTemplateColumns = columns > 1 
        ? `auto repeat(${columns - 1}, minmax(var(--min-col-width, 6rem), 1fr))`
        : 'auto';

      setGridConfig({
        columns,
        rows,
        gridTemplateColumns
      });
    };

    updateLayout();
    
    // 监听窗口大小变化
    const handleResize = () => {
      requestAnimationFrame(updateLayout);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [items, containerRef]);

  return gridConfig;
};

// 用于获取当前屏幕断点的 Hook
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<'sm' | 'md' | 'lg' | 'xl'>('lg');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 480) setBreakpoint('sm');
      else if (width < 768) setBreakpoint('md');
      else if (width < 1200) setBreakpoint('lg');
      else setBreakpoint('xl');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
}; 