import { ToolCategoryList } from '@/components/ToolCategoryList';
import { getTranslations } from 'next-intl/server';
import { Locale } from '@/lib/i18n';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'navigation.categories' });
  const baseUrl = 'https://tools.bhwa233.com';
  const path = '/processor/audio';

  const title = t('audioTools') || 'Audio Tools';
  const description = locale === 'zh' 
    ? '免费在线音频处理工具集合。包含格式转换、倍速调整等功能。'
    : locale === 'zh-tw'
    ? '免費線上音訊處理工具集合。包含格式轉換、倍速調整等功能。'
    : 'Free online audio processing tools collection. Features format conversion, speed adjustment and more.';

  return {
    title: `${title} | Toolbox`,
    description,
    alternates: {
      canonical: locale === 'en' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`,
      languages: {
        'en': `${baseUrl}${path}`,
        'zh': `${baseUrl}/zh${path}`,
        'zh-tw': `${baseUrl}/zh-tw${path}`,
      }
    },
    openGraph: {
      title: `${title} | Toolbox`,
      description,
      type: 'website',
    }
  };
}

export default function AudioToolsPage() {
  return <ToolCategoryList categoryId="audio-tools" />;
}
