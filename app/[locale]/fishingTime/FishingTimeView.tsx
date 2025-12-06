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
import { useTranslation } from '@/components/TranslationProvider';

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
  const { t } = useTranslation();
  const fishingTime = useMemo(() => getTime(), []);
  const salaryDays = useMemo(() => getSalaryDayCountdown(), []);

  return (
    <div className='p-2'>
      <div className="[&_>p]:text-base">
        <div className="m-2">
          <h1 className="text-lg">{t.fishingTime.reminderTitle}</h1>
          <p>
            {t.fishingTime.today
              .replace('{{year}}', fishingTime.year.toString())
              .replace('{{month}}', fishingTime.month.toString())
              .replace('{{day}}', fishingTime.day.toString())
              .replace('{{weekday}}', fishingTime.weekday)}
          </p>
        </div>
        <div className="m-2">
          <h1 className="text-lg">{t.fishingTime.salary}</h1>
          <ul>
            <li>{t.fishingTime.salaryEndOfMonth.replace('{{days}}', salaryDays.endOfMonth.toString())}</li>
            <li>{t.fishingTime.salaryDay5.replace('{{days}}', salaryDays.day5.toString())}</li>
            <li>{t.fishingTime.salaryDay10.replace('{{days}}', salaryDays.day10.toString())}</li>
            <li>{t.fishingTime.salaryDay15.replace('{{days}}', salaryDays.day15.toString())}</li>
            <li>{t.fishingTime.salaryDay20.replace('{{days}}', salaryDays.day20.toString())}</li>
          </ul>
        </div>
        <div className="m-2">
          <h1 className="text-lg">{t.fishingTime.countdown}</h1>
          <ul>
            <div className="w-100">
              <li>{t.fishingTime.weekEnd
                .replace('{{remaining}}', daysUntilEndOfWeek.toString())
                .replace('{{passed}}', daysPassedInWeek.toString())}
              </li>
              <Progress value={percentageCompletedOfWeek} />
              <li>{t.fishingTime.monthEnd
                .replace('{{remaining}}', daysUntilEndOfMonth.toString())
                .replace('{{passed}}', daysPassedInMonth.toString())}
              </li>
              <Progress value={percentageCompletedOfMonth} />
              <li>{t.fishingTime.yearEnd
                .replace('{{remaining}}', daysUntilEndOfYear.toString())
                .replace('{{passed}}', daysPassedInYear.toString())}
              </li>
              <Progress value={percentageCompletedOfYear} />
            </div>
          </ul>
        </div>
        <div className="m-2">
          <h1 className="text-lg">{t.fishingTime.holiday}</h1>
          <ul>
            <li>{t.fishingTime.weekend.replace('{{days}}', fishingTime.day_to_weekend.toString())}</li>
            {nextHolidayData?.map((item, index) => {
              const restDays = calculateRestDays(item.holiday);
              if (restDays < 0) {
                return null;
              }
              if (!item.start || !item.end) {
                return (
                  <li key={index}>
                    {t.fishingTime.holidayCountdown
                      .replace('{{name}}', item.name)
                      .replace('{{days}}', restDays.toString())}
                  </li>
                );
              }
              const totalDays = calculateDaysDifference(item.start, item.end);
              return (
                <li key={index}>
                  {t.fishingTime.holidayDetail
                    .replace('{{name}}', item.name)
                    .replace('{{days}}', restDays.toString())
                    .replace('{{start}}', item.start)
                    .replace('{{end}}', item.end)
                    .replace('{{total}}', totalDays.toString())}
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
