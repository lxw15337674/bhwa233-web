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
            今天是 {fishingTime.year}年{fishingTime.month}月{fishingTime.day}
            日, 星期{fishingTime.weekday}。
          </p>
        </div>
        <div className="m-2">
          <h1 className="text-lg">【工资】</h1>
          <ul>
            <li>距离【月底发工资】: {salaryDays.endOfMonth} 天</li>
            <li>距离【05号发工资】: {salaryDays.day5} 天</li>
            <li>距离【10号发工资】: {salaryDays.day10} 天</li>
            <li>距离【15号发工资】: {salaryDays.day15} 天</li>
            <li>距离【20号发工资】: {salaryDays.day20} 天</li>
          </ul>
        </div>
        <div className="m-2">
          <h1 className="text-lg">【倒计时】</h1>
          <ul>
            <div className="w-100">
              <li>距离【本周结束】还有 {daysUntilEndOfWeek} 天 (已过去 {daysPassedInWeek} 天)</li>
              <Progress value={percentageCompletedOfWeek} />
              <li>距离【本月结束】还有 {daysUntilEndOfMonth} 天 (已过去 {daysPassedInMonth} 天)</li>
              <Progress value={percentageCompletedOfMonth} />
              <li>距离【本年结束】还有 {daysUntilEndOfYear} 天 (已过去 {daysPassedInYear} 天)</li>
              <Progress value={percentageCompletedOfYear} />
            </div>
          </ul>
        </div>
        <div className="m-2">
          <h1 className="text-lg">【假期】</h1>
          <ul>
            <li>距离【周六】还有 {fishingTime.day_to_weekend} 天</li>
            {nextHolidayData?.map((item, index) => {
              const restDays = calculateRestDays(item.holiday);
              if (restDays < 0) {
                return null;
              }
              if (!item.start || !item.end) {
                return (
                  <li key={index}>
                    距离【{item.name}】还有 {restDays} 天。
                  </li>
                );
              }
              return (
                <li key={index}>
                  距离【{item.name}】还有 {restDays} 天。
                  {item.start} 至 {item.end} 放假调休, 共
                  {calculateDaysDifference(item.start, item.end)}天。
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