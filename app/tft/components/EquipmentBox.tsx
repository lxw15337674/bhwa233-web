'use client';

import React from 'react';
import {
  EquipmentType,
  EquipsByType,
  TFTEquip,
} from '@/api/tft/model/Equipment';
import Equipment from './Equipment';
import { useEquipmentMaps, useEquipmentMatrix } from '@/hooks/useEquipmentMaps';

interface Props {
  equipsByType: EquipsByType;
  allEquips?: TFTEquip[];
}

const EquipmentBox = ({ equipsByType, allEquips = [] }: Props) => {
  // 使用优化的装备映射 Hook
  const equipmentMaps = useEquipmentMaps(equipsByType, allEquips);
  const equipmentArray = useEquipmentMatrix(equipmentMaps);

  return (
    <div className="equipment-grid">
      {equipmentArray.map((row, rowIndex) => (
        <div key={rowIndex} className="equipment-row">
          {row.map((equip, colIndex) => (
            <div className="equipment-cell " key={colIndex}>
              <Equipment
                equip={equip}
                allEquips={allEquips}
                recipeMap={equipmentMaps.recipeMap}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default EquipmentBox;