import type { Metadata } from 'next';
import {
  generateLocalizedMetadata,
  generateToolBreadcrumbs,
  generateSoftwareAppSchema,
  generateCombinedSchema,
  generateBreadcrumbSchema,
  type LocalizedMetaMap,
  type SupportedLocale,
} from '@/lib/seo';
import { StructuredData } from '@/components/structured-data';

type Props = {
  params: Promise<{ locale: string }>;
};

const uploadMetaMap: LocalizedMetaMap = {
  en: {
    title: 'File Upload - Free Online File Storage Service',
    description: 'Free online file upload service, supports any file format, up to 50MB file size, permanent storage. Batch upload up to 10 files.',
    keywords: ['file upload', 'online storage', 'free upload', 'batch upload', 'permanent storage'],
  },
  zh: {
    title: '文件上传 - 免费在线文件存储服务',
    description: '免费在线文件上传服务，支持任意文件格式、最大50MB文件上传，永久保存。批量上传最多10个文件。',
    keywords: ['文件上传', '在线存储', '免费上传', '批量上传', '永久保存'],
  },
  'zh-tw': {
    title: '檔案上傳 - 免費線上檔案儲存服務',
    description: '免費線上檔案上傳服務，支援任意檔案格式、最大50MB檔案上傳，永久保存。批次上傳最多10個檔案。',
    keywords: ['檔案上傳', '線上儲存', '免費上傳', '批次上傳', '永久保存'],
  },
};

const toolNames: Record<SupportedLocale, string> = {
  en: 'File Upload',
  zh: '文件上传',
  'zh-tw': '檔案上傳',
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateLocalizedMetadata(uploadMetaMap, '/upload', locale as SupportedLocale);
}

export default async function UploadLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = (locale as SupportedLocale) || 'en';

  const breadcrumbs = generateToolBreadcrumbs(safeLocale, toolNames[safeLocale], '/upload');

  const appSchema = generateSoftwareAppSchema({
    name: toolNames[safeLocale],
    description: uploadMetaMap[safeLocale].description,
    url: `https://tools.bhwa233.com/${locale}/upload`,
    applicationCategory: 'UtilityApplication',
    datePublished: '2024-01-01',
    dateModified: '2024-12-01',
    featureList: [
      'Supports any file format upload',
      'Supports up to 50MB file size',
      'Batch upload up to 10 files',
      'Drag and drop upload',
      'Real-time upload progress',
      'Permanent file storage',
      'Upload history',
      'One-click copy file link',
    ],
  });

  const combinedSchema = generateCombinedSchema([
    generateBreadcrumbSchema(breadcrumbs),
    appSchema,
  ]);

  return (
    <>
      <StructuredData data={combinedSchema} id="upload-structured-data" />
      {children}
    </>
  );
}
