import { TFTEquip, EquipmentType } from '@/api/tft/model/Equipment';

export interface RecipeInfo {
    materials: TFTEquip[];
    canCraft: boolean;
    isAdvanced: boolean;
}

/**
 * 解析装备合成配方
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

    // 查找对应的基础装备
    const materials: TFTEquip[] = [];
    for (const materialId of materialIds) {
        const material = allEquips.find(item =>
            item.equipId === materialId && item.type === EquipmentType.basic
        );
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
 * 创建装备ID到装备对象的映射
 * @param allEquips 所有装备数据
 * @returns 装备映射表
 */
export function createEquipmentMap(allEquips: TFTEquip[]): Map<string, TFTEquip> {
    const equipMap = new Map<string, TFTEquip>();
    allEquips.forEach(equip => {
        equipMap.set(equip.equipId, equip);
    });
    return equipMap;
}
