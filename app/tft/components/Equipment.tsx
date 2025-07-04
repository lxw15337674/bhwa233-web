import React from 'react';
import { Desc } from './Desc';
import { TFTEquip } from '@/api/tft/model/Equipment';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { parseEquipmentRecipe } from '@/utils/equipmentRecipe';
import { ChevronRight, Plus } from 'lucide-react';

interface Props {
  equip: TFTEquip | null;
  allEquips?: TFTEquip[];
}

const Equipment = ({ equip, allEquips = [] }: Props) => {
  const recipeInfo = equip && allEquips.length > 0
    ? parseEquipmentRecipe(equip, allEquips)
    : null;

  const renderRecipe = () => {
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
              <AvatarImage src={recipeInfo.materials[0]?.imagePath} />
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
              <AvatarImage src={recipeInfo.materials[1]?.imagePath} />
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
              <AvatarImage src={equip?.imagePath} />
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
  };

  const renderCard = () => {
    if (!equip) {
      return null;
    }
    return (
      <div className="min-w-64 max-w-80 sm:min-w-72 sm:max-w-none">
        <div className="flex items-center">
          <Avatar className="w-8 h-8 sm:w-12 sm:h-12">
            <AvatarImage src={equip.imagePath} />
            <AvatarFallback>{equip.name}</AvatarFallback>
          </Avatar>
          <div className="ml-2 text-base sm:text-lg font-bold">{equip.name}</div>
        </div>
        <div className="mt-2">
          <Desc text={equip.effect} />
        </div>
        {renderRecipe()}
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger>
        <Avatar className={`equipment-avatar cursor-pointer rounded-none inline-block`}>
          <AvatarImage src={equip?.imagePath} />
          <AvatarFallback className="text-xs sm:text-sm">{equip?.name}</AvatarFallback>
        </Avatar>
      </PopoverTrigger >
      <PopoverContent className="w-auto" >
        {
          !equip ? <div>Empty</div> : renderCard()
        }
      </PopoverContent>
    </Popover>
  );
};

export default Equipment;
