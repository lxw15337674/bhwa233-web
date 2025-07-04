'use client';

import React, { useMemo } from 'react';
import { Desc } from './Desc';
import { TFTEquip } from '@/api/tft/model/Equipment';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HoverClickPopover } from '@/components/ui/hover-click-popover';
import { parseEquipmentRecipe } from '@/utils/equipmentRecipe';
import { ChevronRight, Plus } from 'lucide-react';
import Image from 'next/image';

interface Props {
  equip: TFTEquip | null;
  allEquips?: TFTEquip[];
  // 可选的预处理配方映射，用于性能优化
  recipeMap?: Map<string, any>;
}

const Equipment = ({ equip, allEquips = [], recipeMap }: Props) => {
  // 使用 useMemo 缓存配方计算，优先使用预处理的配方映射
  const recipeInfo = useMemo(() => {
    if (!equip) return null;

    // 如果有预处理的配方映射，直接使用 O(1) 查找
    if (recipeMap && equip.equipId) {
      return recipeMap.get(equip.equipId) || null;
    }

    // 否则使用原来的计算方法
    return allEquips.length > 0
      ? parseEquipmentRecipe(equip, allEquips)
      : null;
  }, [equip, allEquips, recipeMap]);

  // 使用 useMemo 缓存渲染函数，减少重复计算
  const renderRecipe = useMemo(() => {
    if (!recipeInfo || !recipeInfo.canCraft) {
      return null;
    }

    return (
      <div className="mt-3 pt-3 border-t border-gray-600">
        <div className="text-sm text-gray-400 mb-2">合成配方</div>
        <div className="flex items-center justify-center gap-1 sm:gap-2">
          {/* 第一个材料 */}
          <div className="flex flex-col items-center">
            <Avatar className="w-6 h-6 sm:w-8 sm:h-8 rounded-none">
              <AvatarImage
                src={recipeInfo.materials[0]?.imagePath}
                alt={recipeInfo.materials[0]?.name}
              />
              <AvatarFallback className="text-xs">
                {recipeInfo.materials[0]?.name}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs max-w-12 sm:max-w-16 text-gray-400 mt-1 text-center truncate">
              {recipeInfo.materials[0]?.name}
            </span>
          </div>

          {/* 加号 */}
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />

          {/* 第二个材料 */}
          <div className="flex flex-col items-center">
            <Avatar className="w-6 h-6 sm:w-8 sm:h-8 rounded-none">
              <AvatarImage
                src={recipeInfo.materials[1]?.imagePath}
                alt={recipeInfo.materials[1]?.name}
              />
              <AvatarFallback className="text-xs">
                {recipeInfo.materials[1]?.name}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs max-w-12 sm:max-w-16 text-gray-400 mt-1 text-center truncate">
              {recipeInfo.materials[1]?.name}
            </span>
          </div>

          {/* 箭头 */}
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />

          {/* 成品 */}
          <div className="flex flex-col items-center">
            <Avatar className="w-6 h-6 sm:w-8 sm:h-8 rounded-none">
              <AvatarImage
                src={equip?.imagePath}
                alt={equip?.name}
              />
              <AvatarFallback className="text-xs">
                {equip?.name}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs max-w-12 sm:max-w-16 text-gray-400 mt-1 text-center truncate">
              {equip?.name}
            </span>
          </div>
        </div>
      </div>
    );
  }, [recipeInfo, equip]);

  const renderCard = useMemo(() => {
    if (!equip) {
      return null;
    }
    return (
      <div className="min-w-64 max-w-80 sm:min-w-72 sm:max-w-none">
        <div className="flex items-center">
          <Avatar className="w-8 h-8 sm:w-12 sm:h-12">
            <AvatarImage
              src={equip.imagePath}
              alt={equip.name}
            />
            <AvatarFallback>{equip.name}</AvatarFallback>
          </Avatar>
          <div className="ml-2 text-base sm:text-lg font-bold">{equip.name}</div>
        </div>
        <div className="mt-2">
          <Desc text={equip.effect} />
        </div>
        {renderRecipe}
      </div>
    );
  }, [equip, renderRecipe]);

  return (
    <HoverClickPopover>
      <PopoverTrigger className='h-[40px]'>
        <Avatar className={`equipment-avatar cursor-pointer rounded-none inline-block `}>
          <AvatarImage
            src={equip?.imagePath}
            alt={equip?.name}
          />
          <AvatarFallback className="text-xs sm:text-sm">{equip?.name}</AvatarFallback>
        </Avatar>
      </PopoverTrigger >
      <PopoverContent className="w-auto" >
        {
          !equip ? <div>Empty</div> : renderCard
        }
      </PopoverContent>
    </HoverClickPopover>
  );
};

export default React.memo(Equipment);
