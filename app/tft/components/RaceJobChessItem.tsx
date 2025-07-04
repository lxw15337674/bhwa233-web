import React, { Fragment } from 'react';
import {
  ChessImageType,
  getBorderColor,
  getChessImage,
} from '../../../src/api/tft/model/Chess';
import { TFTChess, TFTCard } from '@/api/tft/type';
import { ISeasonInfo } from '@/api/tft';
import { Desc } from './Desc';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HoverClickPopover } from '@/components/ui/hover-click-popover';

interface Props {
  races: TFTCard[];
  jobs: TFTCard[];
  chesses: TFTChess[];
  version: ISeasonInfo;
}
const imageWidth = 420;

const Attributes: { label: string; value: keyof TFTChess; defaultValue?: string }[] = [
  { label: '生命', value: 'lifeData' },
  { label: '护甲', value: 'armor' },
  { label: '魔抗', value: 'spellBlock' },
  { label: '攻击', value: 'attackData' },
  { label: '攻击距离', value: 'attackRange' },
  { label: '攻速', value: 'attackSpeed' },
  { label: '暴击', value: 'crit' },
  { label: '初始法力值', value: 'startMagic', defaultValue: '0' },
  { label: '最大法力值', value: 'magic', defaultValue: '0' },
];
const RaceJobChessItem: React.FC<Props> = ({
  chesses,
  races,
  jobs,
  version,
}) => {


  return (
    <div className="flex flex-wrap justify-center items-center gap-1 w-full h-full p-1
                    sm:gap-0.5 sm:p-0.5 md:gap-1 md:p-1">
      {chesses?.map((chess) => {
        const borderColor = getBorderColor(chess.price);
        const raceJobs: TFTCard[] = [];
        for (const id of chess.raceIds.split(',')) {
          const race = races.find((race) => race.id === id);
          if (race) {
            raceJobs.push(race);
          }
        }

        for (const id of chess.jobIds.split(',')) {
          const job = jobs.find((job) => job.id === id);
          if (job) {
            raceJobs.push(job);
          }
        }
        return (
          <Fragment key={chess.TFTID}>
            <HoverClickPopover>
              <PopoverTrigger>
                <Avatar
                  className="equipment-avatar cursor-pointer rounded-none border-2 flex-shrink-0"
                  style={{
                    borderColor
                  }}
                >
                  <AvatarImage
                    src={getChessImage(version.idSeason, chess.TFTID, ChessImageType.head)}
                    alt={chess.displayName}
                    loading="lazy"
                  />
                  <AvatarFallback>
                    {chess.displayName}
                  </AvatarFallback>
                </Avatar>
              </PopoverTrigger>
              <PopoverContent className={`p-0 w-[${imageWidth}px]`}>
                <div className="flex flex-col rounded-lg" style={{ width: imageWidth }}>
                  <div className="relative w-full aspect-[624/318]">
                    <Image
                      src={getChessImage(version.idSeason, chess.TFTID, ChessImageType.full)}
                      alt={`${chess.displayName}`}
                      width={imageWidth}
                      height={210}
                      loading="lazy"
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDIwIiBoZWlnaHQ9IjIxMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjY2NjIi8+PC9zdmc+"
                      className="rounded-t-lg"
                    />
                    <div className="absolute left-5 bottom-4 flex flex-col">
                      {raceJobs.map((raceJob) => (
                        <div className="flex items-center mt-1" key={raceJob.id}>
                          <Image
                            className={'white-icon'}
                            src={raceJob.imagePath}
                            alt={raceJob.name}
                            width={16}
                            height={16}
                            loading="lazy"
                          />
                          <span className="text-sm">{raceJob.name}</span>
                        </div>
                      ))}
                      <span className="text-lg font-bold mt-2">
                        {chess.title} {chess.displayName}
                      </span>
                    </div>
                  </div>
                  <div className="m-2 grid grid-rows-4 grid-flow-col">
                    {Attributes.map((attr) => (
                      <div key={attr.label} className="flex justify-between">
                        <span className="text-center text-sm p-1 text-gray-400 font-bold border border-white/10 bg-white/10">{attr.label}</span>
                        <span className="text-center text-sm p-1 font-bold border border-white/10 flex-1">{chess[attr.value] || attr.defaultValue}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col px-4 mb-4">
                    <div className="flex items-center mb-1.5">
                      <Avatar className="equipment-avatar rounded-none mr-2">
                        <AvatarImage
                          src={chess.skillImage}
                          alt={`${chess.skillName}技能图片`}
                          loading="lazy"
                        />
                        <AvatarFallback>技能图片</AvatarFallback>
                      </Avatar>
                      <span className="text-lg font-bold">{chess.skillName}</span>
                    </div>
                    <span className="text-xs">
                      <Desc text={chess.skillDetail} />
                    </span>
                  </div>
                </div>
              </PopoverContent>
            </HoverClickPopover>
          </Fragment>
        );
      })}
    </div>
  );
};

export default RaceJobChessItem;
