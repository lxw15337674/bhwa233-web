import type { Metadata } from 'next';
import { GetServerSideProps } from 'next';

type Props = {
  params: { locale?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = params?.locale || 'en';

  const baseUrl = 'https://bhwa233-web.vercel.app';
  const path = '/upload';

  // 根据语言生成不同的元数据
  const metadataMap = {
    en: {
      title: 'File Upload - Free Online File Storage Service',
      description: 'Free online file upload service, supports any file format, any file size, permanent storage. Batch upload up to 10 files.',
      keywords: ['file upload', 'online storage', 'free upload', 'batch upload', 'permanent storage'],
      siteName: 'Toolbox',
      locale: 'en_US',
    },
    zh: {
      title: '文件上传 - 免费在线文件存储服务',
      description: '免费在线文件上传服务，支持任意文件格式、任意大小文件上传，永久保存。批量上传最多10个文件。',
      keywords: ['文件上传', '在线存储', '免费上传', '批量上传', '永久保存'],
      siteName: '工具箱',
      locale: 'zh_CN',
    },
    'zh-tw': {
      title: '檔案上傳 - 免費線上檔案儲存服務',
      description: '免費線上檔案上傳服務，支援任意檔案格式、任意大小檔案上傳，永久保存。批次上傳最多10個檔案。',
      keywords: ['檔案上傳', '線上儲存', '免費上傳', '批次上傳', '永久保存'],
      siteName: '工具箱',
      locale: 'zh_TW',
    },
  };

  const meta = metadataMap[locale as keyof typeof metadataMap] || metadataMap.en;

  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: `${baseUrl}${path}`,
      languages: {
        'en': `${baseUrl}${path}`,
        'zh': `${baseUrl}/zh${path}`,
        'zh-TW': `${baseUrl}/zh-tw${path}`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `${baseUrl}${locale === 'en' ? '' : `/${locale}`}${path}`,
      siteName: meta.siteName,
      locale: meta.locale,
      type: 'website',
      images: [
        {
          url: '/icons/icon-256.png',
          width: 256,
          height: 256,
          alt: 'File Upload Tool',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: ['/icons/icon-256.png'],
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
  };
}

export default function UploadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* 结构化数据 - JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'File Upload Tool',
            description: 'Free online file upload service, supports any file format, any file size, permanent storage',
            url: 'https://bhwa233-web.vercel.app/upload',
            applicationCategory: 'UtilityApplication',
            operatingSystem: 'Any',
            permissions: 'https://bhwa233-web.vercel.app/upload',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
            },
            featureList: [
              'Supports any file format upload',
              'Supports any file size',
              'Batch upload up to 10 files',
              'Drag and drop upload',
              'Real-time upload progress',
              'Permanent file storage',
              'Upload history',
              'One-click copy file link',
            ],
            browserRequirements: 'HTML5, JavaScript enabled',
            softwareVersion: '1.0',
            author: {
              '@type': 'Person',
              name: '233tools',
            },
            provider: {
              '@type': 'Organization',
              name: 'Toolbox',
              url: 'https://bhwa233-web.vercel.app',
            },
          }),
        }}
      />
      {children}
    </>
  );
}
