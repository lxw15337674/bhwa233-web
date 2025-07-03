'use client';

import { useRef } from 'react';
import { useFetterGridLayout, useBreakpoint } from '@/hooks/useFetterGridLayout';
import { Item } from '@/utils/tftf';
import { TFTCard, TFTChess } from '@/api/tft/type';
import { ISeasonInfo } from '@/api/tft';
import RaceJob from './RaceJob';
import RaceJobChessItem from './RaceJobChessItem';

interface FetterGridProps {
  items: Item[][];
  currentVersion: ISeasonInfo;
  races: TFTCard[];
  jobs: TFTCard[];
}

export default function FetterGrid({ 
  items, 
  currentVersion, 
  races, 
  jobs 
}: FetterGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridConfig = useFetterGridLayout(items, containerRef);
  const breakpoint = useBreakpoint();

  // 根据断点设置 CSS 变量
  const getMinColWidth = () => {
    switch (breakpoint) {
      case 'sm': return '3.5rem';
      case 'md': return '4rem';
      case 'lg': return '5rem';
      default: return '6rem';
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fetter-grid"
      style={{
        gridTemplateColumns: gridConfig.gridTemplateColumns,
        '--min-col-width': getMinColWidth()
      } as React.CSSProperties}
    >
      {items?.map((rows, rowIndex) => 
        rows?.map((item, colIndex) => {
          const key = `${rowIndex}-${colIndex}`;
          
          // 第一行第一列 - 空白角落
          if (rowIndex === 0 && colIndex === 0) {
            return (
              <div 
                key={key}
                className="fetter-cell fetter-cell-header-corner"
              />
            );
          }
          
          // 第一行 - 列标题（职业）
          if (rowIndex === 0) {
            return (
              <div 
                key={key}
                className="fetter-cell fetter-cell-col-header"
              >
                <RaceJob raceJob={item as TFTCard} />
              </div>
            );
          }
          
          // 第一列 - 行标题（种族）
          if (colIndex === 0) {
            return (
              <div 
                key={key}
                className="fetter-cell fetter-cell-row-header"
              >
                <RaceJob raceJob={item as TFTCard} />
              </div>
            );
          }
          
          // 内容单元格 - 棋子
          return (
            <div 
              key={key}
              className="fetter-cell fetter-cell-content"
            >
              {currentVersion && (
                <RaceJobChessItem
                  version={currentVersion}
                  races={races}
                  jobs={jobs}
                  chesses={item as TFTChess[]}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
} 