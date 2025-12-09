'use client';

import React, { useMemo } from 'react';
import { Progress } from "@/components/ui/progress"
import {
  daysUntilEndOfWeek,
  percentageCompletedOfWeek,
  daysUntilEndOfMonth,
  percentageCompletedOfMonth,
  daysUntilEndOfYear,
  percentageCompletedOfYear,
  daysPassedInWeek,
  daysPassedInMonth,
  daysPassedInYear,
  calculateDaysDifference,
  calculateRestDays,
  getTime,
  getSalaryDayCountdown
} from '@/utils/time';

interface Holiday {
  holiday: string;
  name: string;
  start?: string;
  end?: string;
}

interface FishingTimeViewProps {
  nextHolidayData: Holiday[] | undefined;
}

const FishingTimeView = ({ nextHolidayData }: FishingTimeViewProps) => {
  const fishingTime = useMemo(() => getTime(), []);
  const salaryDays = useMemo(() => getSalaryDayCountdown(), []);

  return (
    <div className='p-2'>
      <div className="[&_>p]:text-base">
        <div className="m-2">
          <h1 className="text-lg">【摸鱼办】提醒您:</h1>
          <p>
            今天是{fishingTime.year}年{fishingTime.month}月{fishingTime.day}日，{fishingTime.weekday}。
          </p>
        </div>
        <div className="m-2">
          <h1 className="text-lg">【工资】</h1>
          <ul>
            <li>月底工资：还有{salaryDays.endOfMonth}天</li>
            <li>5号工资：还有{salaryDays.day5}天</li>
            <li>10号工资：还有{salaryDays.day10}天</li>
            <li>15号工资：还有{salaryDays.day15}天</li>
            <li>20号工资：还有{salaryDays.day20}天</li>
          </ul>
        </div>
        <div className="m-2">
          <h1 className="text-lg">【倒计时】</h1>
          <ul>
            <div className="w-100">
              <li>周末：还有{daysUntilEndOfWeek}天（已过{daysPassedInWeek}天）</li>
              <Progress value={percentageCompletedOfWeek} />
              <li>月底：还有{daysUntilEndOfMonth}天（已过{daysPassedInMonth}天）</li>
              <Progress value={percentageCompletedOfMonth} />
              <li>年底：还有{daysUntilEndOfYear}天（已过{daysPassedInYear}天）</li>
              <Progress value={percentageCompletedOfYear} />
            </div>
          </ul>
        </div>
        <div className="m-2">
          <h1 className="text-lg">【假期】</h1>
          <ul>
            <li>下个周六：还有{fishingTime.day_to_weekend}天</li>
            {nextHolidayData?.map((item, index) => {
              const restDays = calculateRestDays(item.holiday);
              if (restDays < 0) {
                return null;
              }
              if (!item.start || !item.end) {
                return <li key={index}>{item.name}：还有{restDays}天。</li>;
              }
              const totalDays = calculateDaysDifference(item.start, item.end);
              return (
                <li key={index}>
                  {item.name}：还有{restDays}天。{item.start}至{item.end}放假，共{totalDays}天。
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FishingTimeView;
