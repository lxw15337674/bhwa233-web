import { useMemo } from 'react';
import { TFTEquip, EquipmentType, EquipsByType } from '@/api/tft/model/Equipment';
import { preProcessRecipes, RecipeInfo } from '@/utils/equipmentRecipe';

interface EquipmentMaps {
    basicEquips: TFTEquip[];
    advancedMapByFormula: Map<string, TFTEquip>;
    equipIdMap: Map<string, TFTEquip>;
    recipeMap: Map<string, RecipeInfo>;
}

/**
 * 装备映射优化 Hook
 * 预处理所有装备数据，提供 O(1) 查找性能
 */
export function useEquipmentMaps(equipsByType: EquipsByType, allEquips: TFTEquip[]): EquipmentMaps {
    return useMemo(() => {
        const basicEquips = equipsByType.get(EquipmentType['basic']) || [];
        const advancedEquips = equipsByType.get(EquipmentType['advanced']) || [];

        // 创建高级装备的公式映射，O(1) 查找
        const advancedMapByFormula = new Map<string, TFTEquip>();
        advancedEquips.forEach((equip) => {
            if (equip.formula) {
                advancedMapByFormula.set(equip.formula, equip);
            }
        });

        // 创建装备 ID 映射，O(1) 查找
        const equipIdMap = new Map<string, TFTEquip>();
        allEquips.forEach(equip => {
            equipIdMap.set(equip.equipId, equip);
        });

        // 预处理所有配方信息
        const recipeMap = preProcessRecipes(allEquips);

        return {
            basicEquips,
            advancedMapByFormula,
            equipIdMap,
            recipeMap
        };
    }, [equipsByType, allEquips]);
}

/**
 * 装备矩阵生成 Hook
 * 使用预处理的映射数据生成装备矩阵
 */
export function useEquipmentMatrix(equipmentMaps: EquipmentMaps): (TFTEquip | null)[][] {
    return useMemo(() => {
        const { basicEquips, advancedMapByFormula } = equipmentMaps;

        if (basicEquips.length === 0) return [[]];

        const array: (TFTEquip | null)[][] = Array.from(
            { length: basicEquips.length + 1 },
            () => Array(basicEquips.length + 1).fill(null)
        );

        for (let i = 0; i <= basicEquips.length; i++) {
            for (let j = 0; j <= basicEquips.length; j++) {
                if (i === 0 && j === 0) continue;
                if (i === 0) {
                    array[i][j] = basicEquips[j - 1];
                } else if (j === 0) {
                    array[i][j] = basicEquips[i - 1];
                } else {
                    // 使用预计算的映射进行 O(1) 查找
                    const equip1 = basicEquips[i - 1];
                    const equip2 = basicEquips[j - 1];
                    const formula1 = `${equip1.equipId},${equip2.equipId}`;
                    const formula2 = `${equip2.equipId},${equip1.equipId}`;
                    array[i][j] = advancedMapByFormula.get(formula1) || advancedMapByFormula.get(formula2) || null;
                }
            }
        }

        return array;
    }, [equipmentMaps]);
}
