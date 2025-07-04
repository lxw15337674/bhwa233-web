import FishingTimeView from './FishingTimeView';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '摸鱼办 - 假期工资倒计时工具 | 上班族必备神器',
  description: '专为上班族打造的摸鱼神器，实时显示假期倒计时、工资倒计时、调休安排。让您的工作生活更有盼头，摸鱼更有意思！包含春节、国庆、中秋等所有法定假日倒计时。',
  keywords: [
    '摸鱼办', '假期倒计时', '工资倒计时', '摸鱼工具', '休假提醒',
    '上班族工具', '法定假日', '调休安排', '工作日计算', '薪资倒计时',
    '节假日查询', '春节倒计时', '国庆倒计时', '中秋倒计时', '劳动节倒计时',
    '清明节倒计时', '端午节倒计时', '元旦倒计时', '摸鱼神器', '办公室工具'
  ],
  authors: [{ name: '233tools' }],
  creator: '233tools',
  publisher: '工具箱',
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
    title: '摸鱼办 - 上班族专属假期工资倒计时工具',
    description: '实时查看下个假期还有多少天，工资还有几天到账，让摸鱼更有意思！包含所有法定假日倒计时。',
    url: 'https://233tools.vercel.app/zh/fishingTime',
    siteName: '工具箱',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/icons/icon-256.png',
        width: 256,
        height: 256,
        alt: '摸鱼办 - 假期倒计时工具',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '摸鱼办 - 上班族专属假期工资倒计时工具',
    description: '实时查看下个假期还有多少天，工资还有几天到账，让摸鱼更有意思！',
    images: ['/icons/icon-256.png'],
  },
  alternates: {
    canonical: 'https://233tools.vercel.app/zh/fishingTime',
    languages: {
      'zh-CN': 'https://233tools.vercel.app/zh/fishingTime',
    },
  },
  other: {
    'google-site-verification': 'fc9f0f35f747acd0',
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

  return (
    <>
      {/* 结构化数据 - JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: '摸鱼办',
            description: '专为上班族打造的假期工资倒计时工具，实时显示法定假日倒计时、工资倒计时、调休安排',
            url: 'https://233tools.vercel.app/zh/fishingTime',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            inLanguage: 'zh-CN',
            audience: {
              '@type': 'Audience',
              audienceType: '上班族',
              geographicArea: {
                '@type': 'Country',
                name: '中国',
              },
            },
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'CNY',
              availability: 'https://schema.org/InStock',
            },
            featureList: [
              '法定假日倒计时',
              '工资发放倒计时',
              '调休安排查询',
              '工作日计算',
              '节假日提醒',
              '实时更新倒计时',
              '支持所有法定假日',
              '移动端适配',
            ],
            browserRequirements: 'HTML5, JavaScript enabled',
            softwareVersion: '1.0',
            author: {
              '@type': 'Person',
              name: '233tools',
            },
            provider: {
              '@type': 'Organization',
              name: '工具箱',
              url: 'https://233tools.vercel.app',
            },
            about: [
              {
                '@type': 'Thing',
                name: '摸鱼',
                description: '职场文化中指在工作时间进行非工作相关活动',
              },
              {
                '@type': 'Event',
                name: '法定假日',
                description: '国家规定的休假日期，包括春节、国庆节、劳动节等',
              },
            ],
          }),
        }}
      />
      <FishingTimeView nextHolidayData={nextHolidayData} />
    </>
  );
};
export default Page;
