import { TFTEquip, EquipmentType } from '@/api/tft/model/Equipment';

export interface RecipeInfo {
    materials: TFTEquip[];
    canCraft: boolean;
    isAdvanced: boolean;
}

// 预处理的装备映射缓存
let equipmentMapCache: Map<string, TFTEquip> | null = null;
let basicEquipmentCache: Map<string, TFTEquip> | null = null;

/**
 * 创建装备ID到装备对象的映射 - O(1) 查找优化
 * @param allEquips 所有装备数据
 * @returns 装备映射表
 */
export function createEquipmentMap(allEquips: TFTEquip[]): Map<string, TFTEquip> {
    if (equipmentMapCache && equipmentMapCache.size === allEquips.length) {
        return equipmentMapCache;
    }

    equipmentMapCache = new Map<string, TFTEquip>();
    allEquips.forEach(equip => {
        equipmentMapCache!.set(equip.equipId, equip);
    });
    return equipmentMapCache;
}

/**
 * 创建基础装备的映射缓存
 * @param allEquips 所有装备数据
 * @returns 基础装备映射表
 */
export function createBasicEquipmentMap(allEquips: TFTEquip[]): Map<string, TFTEquip> {
    if (basicEquipmentCache && basicEquipmentCache.size > 0) {
        return basicEquipmentCache;
    }

    basicEquipmentCache = new Map<string, TFTEquip>();
    allEquips.forEach(equip => {
        if (equip.type === EquipmentType.basic) {
            basicEquipmentCache!.set(equip.equipId, equip);
        }
    });
    return basicEquipmentCache;
}

/**
 * 解析装备合成配方 - 优化版本，使用预处理映射
 * @param equip 目标装备
 * @param allEquips 所有装备数据
 * @returns 合成信息
 */
export function parseEquipmentRecipe(
    equip: TFTEquip,
    allEquips: TFTEquip[]
): RecipeInfo | null {
    // 只有成装才有合成配方
    if (equip.type !== EquipmentType.advanced || !equip.formula) {
        return null;
    }

    // 解析配方字符串，格式通常是 "equipId1,equipId2"
    const materialIds = equip.formula.split(',').map(id => id.trim());

    if (materialIds.length !== 2) {
        return null;
    }

    // 使用预处理的基础装备映射进行 O(1) 查找
    const basicEquipMap = createBasicEquipmentMap(allEquips);
    const materials: TFTEquip[] = [];

    for (const materialId of materialIds) {
        const material = basicEquipMap.get(materialId);
        if (material) {
            materials.push(material);
        }
    }

    // 必须找到2个基础装备才算有效合成配方
    if (materials.length !== 2) {
        return null;
    }

    return {
        materials,
        canCraft: true,
        isAdvanced: true
    };
}

/**
 * 批量预处理装备配方信息，用于进一步优化
 * @param allEquips 所有装备数据
 * @returns 配方信息映射
 */
export function preProcessRecipes(allEquips: TFTEquip[]): Map<string, RecipeInfo> {
    const recipeMap = new Map<string, RecipeInfo>();
    const basicEquipMap = createBasicEquipmentMap(allEquips);

    allEquips.forEach(equip => {
        if (equip.type === EquipmentType.advanced && equip.formula) {
            const materialIds = equip.formula.split(',').map(id => id.trim());

            if (materialIds.length === 2) {
                const materials: TFTEquip[] = [];

                for (const materialId of materialIds) {
                    const material = basicEquipMap.get(materialId);
                    if (material) {
                        materials.push(material);
                    }
                }

                if (materials.length === 2) {
                    recipeMap.set(equip.equipId, {
                        materials,
                        canCraft: true,
                        isAdvanced: true
                    });
                }
            }
        }
    });

    return recipeMap;
}
