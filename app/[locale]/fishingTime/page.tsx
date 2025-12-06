import FishingTimeView from './FishingTimeView';
import type { Metadata } from 'next';
import { Locale, getTranslations } from '@/lib/i18n';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations(locale);
  const baseUrl = 'https://233tools.vercel.app';
  const path = '/fishingTime';
  const canonicalUrl = locale === 'en' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`;

  return {
    title: t.fishingTime.title,
    description: t.fishingTime.description,
    authors: [{ name: '233tools' }],
    creator: '233tools',
    publisher: t.home.title.split(' - ')[0],
    keywords: [
      'fishing time', 'countdown', 'holiday countdown', 'salary countdown',
      '摸鱼办', '倒计时', '节假日倒计时', '工资倒计时',
      locale === 'zh' ? '摸鱼工具' : locale === 'zh-tw' ? '摸魚工具' : 'office tools'
    ],
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}${path}`,
        'zh': `${baseUrl}/zh${path}`,
        'zh-tw': `${baseUrl}/zh-tw${path}`,
      }
    },
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
      title: t.fishingTime.title,
      description: t.fishingTime.description,
      url: canonicalUrl,
      siteName: t.home.title.split(' - ')[0],
      locale: locale === 'zh' ? 'zh_CN' : locale === 'zh-tw' ? 'zh_TW' : 'en_US',
      type: 'website',
      images: [
        {
          url: '/icons/icon-256.png',
          width: 256,
          height: 256,
          alt: t.fishingTime.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t.fishingTime.title,
      description: t.fishingTime.description,
      images: ['/icons/icon-256.png'],
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en': `${baseUrl}/en/fishingTime`,
        'zh': `${baseUrl}/zh/fishingTime`,
        'zh-TW': `${baseUrl}/zh-tw/fishingTime`,
      },
    },
  };
}

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

const Page = async ({ params }: { params: Promise<{ locale: Locale }> }) => {
  const { locale } = await params;
  const nextHolidayData = await getHolidays();
  const t = await getTranslations(locale);

  return (
    <>
      {/* 结构化数据 - JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: t.fishingTime.title,
            description: t.fishingTime.description,
            url: `https://233tools.vercel.app/${locale}/fishingTime`,
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            inLanguage: locale === 'zh' ? 'zh-CN' : locale === 'zh-tw' ? 'zh-TW' : 'en',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: locale === 'zh' || locale === 'zh-tw' ? 'CNY' : 'USD',
              availability: 'https://schema.org/InStock',
            },
            browserRequirements: 'HTML5, JavaScript enabled',
            softwareVersion: '1.0',
            author: {
              '@type': 'Person',
              name: '233tools',
            },
            provider: {
              '@type': 'Organization',
              name: t.home.title.split(' - ')[0],
              url: 'https://233tools.vercel.app',
            },
          }),
        }}
      />
      <FishingTimeView nextHolidayData={nextHolidayData} />
    </>
  );
};

export default Page;
