'use client'
import React from 'react';
import { TFTCard } from '@/api/tft/type';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  getRaceJobLevelBorderColor,
  getRaceJobLevelColor,
} from '../../../src/api/tft/model/RaceJob';
import Image from 'next/image';

interface Props {
  raceJob: TFTCard;
}

const RaceJob = ({ raceJob }: Props) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={`flex flex-col items-center cursor-pointer justify-center 
                     w-full h-full min-h-0 p-1
                     sm:p-0.5 md:p-1 lg:p-1.5`}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center justify-center flex-wrap gap-1 min-w-0">
            <Image
              className="white-icon flex-shrink-0"
              src={raceJob.imagePath}
              alt={raceJob.name}
              width={16}
              height={16}
            />
            <span className="text-xs sm:text-sm md:text-base font-bold text-white 
                           truncate max-w-full text-center leading-tight">
              {raceJob.name}
            </span>
          </div>

          {raceJob.level.length > 1 && (
            <span className="text-xs text-gray-400 mt-0.5 text-center leading-none">
              {raceJob.level.map((e) => e.chessCount).join('/')}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto max-w-sm pointer-events-none"
        side="bottom"
        align="start"
      >
        <div className="flex flex-col">
          <span className="text-base mb-2">{raceJob.introduce}</span>
          {raceJob.level?.map((level, index) => {
            return (
              <div className={`flex items-center`} key={index}>
                <div
                  className={`flex items-center justify-center w-5 h-5 m-1 border`}
                  style={{
                    backgroundColor: getRaceJobLevelColor(level.color),
                    borderColor: getRaceJobLevelBorderColor(level.color),
                  }}
                >
                  <span className="text-xs font-bold text-white text-center">
                    {level.chessCount}
                  </span>
                </div>
                <span className="flex-1 text-sm leading-5 text-gray-200">
                  {level.description}
                </span>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default RaceJob;
