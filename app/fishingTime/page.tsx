import FishingTimeView from './FishingTimeView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '摸鱼办 - 假期、工资倒计时',
  description: '实时查看假期、工资倒计时，让摸鱼更有意思',
  keywords: ['摸鱼办', '假期倒计时', '工资倒计时', '摸鱼工具', '休假提醒'],
  openGraph: {
    title: '摸鱼办 - 假期、工资倒计时',
    description: '实时查看假期、工资倒计时，让摸鱼更有意思',
    url: 'https://bhwa233-web.vercel.app/fishingTime',
    type: 'website',
  },
};

interface Holiday {
  holiday: string;
  name: string;
  start?: string;
  end?: string;
}

interface HolidayResponse {
  vacation: Holiday[]
}

async function getHolidays(): Promise<Holiday[] | undefined> {
  try {
    const res = await fetch('https://s3.cn-north-1.amazonaws.com.cn/general.lesignstatic.com/config/jiaqi.json', {
      next: { revalidate: 86400 } // Revalidate every 24 hours
    });

    if (!res.ok) {
      console.error('Failed to fetch holidays');
      return undefined;
    }

    const data: HolidayResponse = await res.json();
    return data.vacation;
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return undefined;
  }
}


const Page = async () => {
  const nextHolidayData = await getHolidays();

  return <FishingTimeView nextHolidayData={nextHolidayData} />;
};
export default Page;
