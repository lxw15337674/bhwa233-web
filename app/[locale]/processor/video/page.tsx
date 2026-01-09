import { ToolCategoryList } from '@/components/ToolCategoryList';
import { getTranslations } from 'next-intl/server';
import { Locale } from '@/lib/i18n';
import { SITE_CONFIG, getFullUrl, getAlternateLanguages } from '@/lib/site-config';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'navigation.categories' });
  const path = '/processor/video';

  const title = t('videoTools') || 'Video Tools';
  const description = locale === 'zh' 
    ? '免费在线视频处理工具集合。包含视频提取音频、视频转GIF等功能。'
    : locale === 'zh-tw'
    ? '免費線上影片處理工具集合。包含影片提取音訊、影片轉GIF等功能。'
    : 'Free online video processing tools collection. Features audio extraction, video to GIF and more.';

  return {
    title: `${title} | Toolbox`,
    description,
    alternates: {
      canonical: getFullUrl(path, locale),
      languages: getAlternateLanguages(path)
    },
    openGraph: {
      title: `${title} | Toolbox`,
      description,
      type: 'website',
    }
  };
}

export default function VideoToolsPage() {
  return <ToolCategoryList categoryId="video-tools" />;
}
