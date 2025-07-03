import React from 'react';
import { Desc } from './Desc';
import { TFTEquip } from '@/api/tft/model/Equipment';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { parseEquipmentRecipe } from '@/utils/equipmentRecipe';
import { ChevronRight, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  equip: TFTEquip | null;
  allEquips?: TFTEquip[];
}

const Equipment = ({ equip, allEquips = [] }: Props) => {
  const isMobile = useIsMobile();
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
        <div className={`flex items-center justify-center ${isMobile ? 'gap-1' : 'gap-2'}`}>
          {/* 第一个材料 */}
          <div className="flex flex-col items-center">
            <Avatar className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-none`}>
              <AvatarImage src={recipeInfo.materials[0]?.imagePath} />
              <AvatarFallback className="text-xs">
                {recipeInfo.materials[0]?.name}
              </AvatarFallback>
            </Avatar>
            <span className={`${isMobile ? 'text-xs max-w-12' : 'text-xs max-w-16'} text-gray-400 mt-1 text-center truncate`}>
              {recipeInfo.materials[0]?.name}
            </span>
          </div>

          {/* 加号 */}
          <Plus className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400`} />

          {/* 第二个材料 */}
          <div className="flex flex-col items-center">
            <Avatar className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-none`}>
              <AvatarImage src={recipeInfo.materials[1]?.imagePath} />
              <AvatarFallback className="text-xs">
                {recipeInfo.materials[1]?.name}
              </AvatarFallback>
            </Avatar>
            <span className={`${isMobile ? 'text-xs max-w-12' : 'text-xs max-w-16'} text-gray-400 mt-1 text-center truncate`}>
              {recipeInfo.materials[1]?.name}
            </span>
          </div>

          {/* 箭头 */}
          <ChevronRight className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-gray-400`} />

          {/* 成品 */}
          <div className="flex flex-col items-center">
            <Avatar className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-none`}>
              <AvatarImage src={equip?.imagePath} />
              <AvatarFallback className="text-xs">
                {equip?.name}
              </AvatarFallback>
            </Avatar>
            <span className={`${isMobile ? 'text-xs max-w-12' : 'text-xs max-w-16'} text-gray-400 mt-1 text-center truncate`}>
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
      <div className={`${isMobile ? 'min-w-64 max-w-80' : 'min-w-72'}`}>
        <div className="flex items-center">
          <Avatar className={isMobile ? 'w-8 h-8' : 'w-12 h-12'}>
            <AvatarImage src={equip.imagePath} />
            <AvatarFallback>{equip.name}</AvatarFallback>
          </Avatar>
          <div className={`ml-2 ${isMobile ? 'text-base' : 'text-lg'} font-bold`}>{equip.name}</div>
        </div>
        <div className="mt-2">
          <Desc text={equip.effect} />
        </div>
        {renderRecipe()}
      </div>
    );
  };

  return (
    <HoverCard>
      <HoverCardTrigger>
        <Avatar className={`equipment-avatar cursor-pointer rounded-none inline-block`}>
          <AvatarImage src={equip?.imagePath} />
          <AvatarFallback className={isMobile ? 'text-xs' : 'text-sm'}>{equip?.name}</AvatarFallback>
        </Avatar>
      </HoverCardTrigger >
      <HoverCardContent className="w-auto" side={isMobile ? 'top' : 'bottom'}>
        {
          !equip ? <div>Empty</div> : renderCard()
        }
      </HoverCardContent>
    </HoverCard>
  );
};

export default Equipment;
