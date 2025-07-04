'use client';

import { ImagePreloader } from '@/components/ImagePreloader';
import { EquipsByType } from '@/api/tft/model/Equipment';

interface TftImagePreloaderProps {
  equipsByType: EquipsByType;
}

/**
 * TFT 图片预加载包装组件
 * 用于在服务端组件中使用客户端图片预加载功能
 */
export function TftImagePreloader({ equipsByType }: TftImagePreloaderProps) {
  // 提取装备图片URL
  const equipmentImageUrls: string[] = [];
  
  equipsByType.forEach((equips) => {
    equips.forEach((equip) => {
      if (equip.imagePath) {
        equipmentImageUrls.push(equip.imagePath);
      }
    });
  });

  return <ImagePreloader images={equipmentImageUrls} priority={false} />;
}
