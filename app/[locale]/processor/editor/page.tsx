import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import EditorClientPage from './EditorClientPage';

interface Props {
    params: Promise<{ locale: string }>;
}

const locales = ['en', 'zh', 'zh-tw'];
const baseUrl = 'https://233tools.vercel.app';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { locale } = await params;

    if (!locales.includes(locale)) {
        notFound();
    }

    const titles = {
        en: 'Image Editor - Advanced Photo Editing Tool | 233Tools',
        zh: '图片编辑器 - 高级照片编辑工具 | 233工具',
        'zh-tw': '圖片編輯器 - 高級照片編輯工具 | 233工具',
    };

    const descriptions = {
        en: 'Professional online image editor with filters, adjustments, annotations, and watermarks. Edit photos directly in your browser with no uploads required.',
        zh: '专业的在线图片编辑器，支持滤镜、调整、标注和水印。在浏览器中直接编辑照片，无需上传。',
        'zh-tw': '專業的線上圖片編輯器，支援濾鏡、調整、標註和浮水印。在瀏覽器中直接編輯照片，無需上傳。',
    };

    const canonicalUrl =
        locale === 'en'
            ? `${baseUrl}/processor/editor`
            : `${baseUrl}/${locale}/processor/editor`;

    return {
        title: titles[locale as keyof typeof titles],
        description: descriptions[locale as keyof typeof descriptions],
        alternates: {
            canonical: canonicalUrl,
            languages: {
                en: `${baseUrl}/processor/editor`,
                zh: `${baseUrl}/zh/processor/editor`,
                'zh-tw': `${baseUrl}/zh-tw/processor/editor`,
                'x-default': `${baseUrl}/processor/editor`,
            },
        },
        openGraph: {
            title: titles[locale as keyof typeof titles],
            description: descriptions[locale as keyof typeof descriptions],
            url: canonicalUrl,
            type: 'website',
            locale: locale === 'zh' ? 'zh_CN' : locale === 'zh-tw' ? 'zh_TW' : 'en_US',
            alternateLocale: ['zh_CN', 'zh_TW', 'en_US'].filter(
                (l) => l !== (locale === 'zh' ? 'zh_CN' : locale === 'zh-tw' ? 'zh_TW' : 'en_US')
            ),
        },
        twitter: {
            card: 'summary_large_image',
            title: titles[locale as keyof typeof titles],
            description: descriptions[locale as keyof typeof descriptions],
        },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
            },
        },
    };
}

export default async function EditorPage({ params }: Props) {
    const { locale } = await params;

    if (!locales.includes(locale)) {
        notFound();
    }

    return <EditorClientPage />;
}
