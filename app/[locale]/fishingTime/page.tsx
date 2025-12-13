import FishingTimeView from './FishingTimeView';
import type { Metadata } from 'next';
import {
  generateToolBreadcrumbs,
  generateSoftwareAppSchema,
  generateCombinedSchema,
  generateBreadcrumbSchema,
} from '@/lib/seo';
import { StructuredData } from '@/components/structured-data';

export const metadata: Metadata = {
  title: '摸鱼办 - 假期工资倒计时工具 | 上班族必备神器',
  description: '专为上班族打造的摸鱼神器，实时显示假期倒计时、工资倒计时、调休安排。让您的工作生活更有盼头，摸鱼更有意思！包含春节、国庆、中秋等所有法定假日倒计时。',
  keywords: [
    '摸鱼办', '假期倒计时', '工资倒计时', '摸鱼工具', '休假提醒',
    '上班族工具', '法定假日', '调休安排', '工作日计算', '薪资倒计时',
    '节假日查询', '春节倒计时', '国庆倒计时', '中秋倒计时', '劳动节倒计时',
    'fishing time', 'countdown', 'holiday countdown', 'salary countdown'
  ],
  authors: [{ name: '233tools', url: 'https://tools.bhwa233.com' }],
  creator: '233tools',
  publisher: '233工具箱',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: '摸鱼办 - 假期工资倒计时工具',
    description: '专为上班族打造的摸鱼神器，实时显示假期倒计时、工资倒计时、调休安排',
    url: 'https://tools.bhwa233.com/fishingTime',
    siteName: '233工具箱',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/icons/icon-256.png',
        width: 256,
        height: 256,
        alt: '摸鱼办',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '摸鱼办 - 假期工资倒计时工具',
    description: '专为上班族打造的摸鱼神器，实时显示假期倒计时、工资倒计时、调休安排',
    images: ['/icons/icon-256.png'],
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

  const breadcrumbs = generateToolBreadcrumbs('zh', '摸鱼办', '/fishingTime');

  const appSchema = generateSoftwareAppSchema({
    name: '摸鱼办 - 假期工资倒计时工具',
    description: '专为上班族打造的摸鱼神器，实时显示假期倒计时、工资倒计时、调休安排',
    url: 'https://tools.bhwa233.com/zh/fishingTime',
    applicationCategory: 'UtilityApplication',
    datePublished: '2024-01-01',
    dateModified: '2024-12-01',
    featureList: [
      '假期倒计时 - 春节、国庆、中秋等法定假日',
      '工资倒计时 - 实时显示距离发薪日天数',
      '调休安排 - 查看补班日期',
      '工作日计算 - 统计剩余工作日',
      '节假日查询 - 全年法定假日一览',
    ],
  });

  const combinedSchema = generateCombinedSchema([
    generateBreadcrumbSchema(breadcrumbs),
    appSchema,
  ]);

  return (
    <>
      <StructuredData data={combinedSchema} id="fishing-time-structured-data" />
      <FishingTimeView nextHolidayData={nextHolidayData} />
    </>
  );
};

export default Page;
