import { Suspense } from 'react';

// 模拟数据
const mockItems = [
  [null, { name: '职业1', imagePath: '/logo/lol.png', level: [{ chessCount: 2 }, { chessCount: 4 }] }, { name: '职业2', imagePath: '/logo/lol.png', level: [{ chessCount: 3 }] }],
  [{ name: '种族1', imagePath: '/logo/lol.png', level: [{ chessCount: 2 }, { chessCount: 4 }] }, [{ TFTID: '1', displayName: '棋子1', price: 1 }], []],
  [{ name: '种族2', imagePath: '/logo/lol.png', level: [{ chessCount: 3 }] }, [], [{ TFTID: '2', displayName: '棋子2', price: 2 }]]
];

export default function TestResponsivePage() {
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">羁绊表格响应式测试</h1>
      
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">新的 CSS Grid 布局</h2>
        <p className="text-sm text-gray-600">
          请调整浏览器窗口大小来测试响应式效果。表格会根据屏幕尺寸自动调整单元格大小。
        </p>
        
        {/* 使用新的 fetter-grid 样式 */}
                 <div 
           className="fetter-grid"
           style={{ 
             gridTemplateColumns: 'auto repeat(2, minmax(6rem, 1fr))',
             ['--min-col-width' as any]: '6rem'
           } as React.CSSProperties}
         >
          {/* 第一行第一列 - 空白 */}
          <div className="fetter-cell fetter-cell-header-corner" />
          
          {/* 第一行 - 职业标题 */}
          <div className="fetter-cell fetter-cell-col-header">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold">职业1</span>
              <span className="text-xs text-gray-400">2/4</span>
            </div>
          </div>
          <div className="fetter-cell fetter-cell-col-header">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold">职业2</span>
              <span className="text-xs text-gray-400">3</span>
            </div>
          </div>
          
          {/* 第二行 */}
          <div className="fetter-cell fetter-cell-row-header">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold">种族1</span>
              <span className="text-xs text-gray-400">2/4</span>
            </div>
          </div>
          <div className="fetter-cell fetter-cell-content">
            <div className="w-8 h-8 bg-blue-500 rounded border-2 border-blue-300"></div>
          </div>
          <div className="fetter-cell fetter-cell-content">
            <span className="text-xs text-gray-500">空</span>
          </div>
          
          {/* 第三行 */}
          <div className="fetter-cell fetter-cell-row-header">
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold">种族2</span>
              <span className="text-xs text-gray-400">3</span>
            </div>
          </div>
          <div className="fetter-cell fetter-cell-content">
            <span className="text-xs text-gray-500">空</span>
          </div>
          <div className="fetter-cell fetter-cell-content">
            <div className="w-8 h-8 bg-green-500 rounded border-2 border-green-300"></div>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-md font-semibold">响应式断点测试</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="p-2 bg-gray-100 rounded">
            <span className="block sm:hidden">移动端 (&lt; 640px)</span>
            <span className="hidden sm:block md:hidden">小平板 (640px+)</span>
            <span className="hidden md:block lg:hidden">平板 (768px+)</span>
            <span className="hidden lg:block">桌面 (1024px+)</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">优化特性说明：</h3>
        <ul className="text-sm space-y-1 list-disc list-inside">
          <li>使用 CSS Grid 替代 Flexbox，提供更好的表格布局控制</li>
          <li>响应式单元格尺寸：移动端较小，桌面端较大</li>
          <li>自适应列宽：根据容器宽度自动调整</li>
          <li>文本截断和换行优化，避免内容溢出</li>
          <li>保持服务端渲染性能，仅在必要时使用客户端 JavaScript</li>
        </ul>
      </div>
    </div>
  );
} 