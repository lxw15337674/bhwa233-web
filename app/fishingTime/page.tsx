'use client';

import React, { useMemo } from 'react';
import Countdown from './Countdown';
import { Progress } from "@/components/ui/progress"
import {
  daysUntilEndOfWeek,
  percentageCompletedOfWeek,
  daysUntilEndOfMonth,
  percentageCompletedOfMonth,
  daysUntilEndOfYear,
  percentageCompletedOfYear,
  daysToLive,
  percentage,
  calculateDaysDifference,
  calculateRestDays,
  getTime,
} from '@/utils/time';

const Chat = () => {

  const fishingTime = useMemo(() => getTime(), []);
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
          <h1 className="text-lg">【下班】</h1>
          <ul>
            <li>
              距离【6点下班】：
              <Countdown />
            </li>
          </ul>
        </div>
        <div className="m-2">
          <h1 className="text-lg">【工资】</h1>
          <ul>
            <li>距离【15号发工资】: {fishingTime.salaryday15} 天</li>
          </ul>
        </div>
        <div className="m-2">
          <h1 className="text-lg">【倒计时】</h1>
          <ul>
            <div className="w-100">
              <li>距离【本周结束】还有 {daysUntilEndOfWeek} 天</li>
              <Progress value={percentageCompletedOfWeek} />
              <li>距离【本月结束】还有 {daysUntilEndOfMonth} 天</li>
              <Progress value={percentageCompletedOfMonth} />
              <li>距离【本年结束】还有 {daysUntilEndOfYear} 天</li>
              <Progress value={percentageCompletedOfYear} />
              <li>距离【70岁结束】还有 {daysToLive} 天</li>
              <Progress value={percentage} />
            </div>
          </ul>
        </div>
        <div className="m-2">
          <h1 className="text-lg">【假期】</h1>
          <ul>
            <li>距离【周六】还有 {fishingTime.day_to_weekend} 天</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
export default Chat;
