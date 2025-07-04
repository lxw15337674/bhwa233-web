import { getVersionConfig } from '@/api/tft';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '云顶之弈攻略大全 - TFT装备合成表·羁绊搭配·阵容推荐 | 一图流攻略',
  description: '最全面的云顶之弈攻略工具，包含最新装备合成表、羁绊搭配指南、英雄技能详解、阵容推荐、奥恩神器、金鳞龙装备。助您快速上分，成为云顶高手！',
  keywords: [
    '云顶之弈', 'TFT攻略', '装备合成表', '羁绊搭配', '阵容推荐',
    '英雄技能', '云顶攻略', '自走棋', 'LOL云顶', '棋子搭配',
    '装备公式', '羁绊公式', '云顶之弈助手', 'TFT工具', '一图流',
    '奥恩神器', '金鳞龙装备', '辅助装备', '转职纹章', '云顶之弈合成表',
    'TFT装备表', '云顶之弈羁绊', 'TFT阵容', '云顶之弈棋子', 'TFT攻略网站'
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
    title: '云顶之弈攻略大全 - 最新装备合成与羁绊搭配指南',
    description: '云顶之弈一图流攻略，装备合成表、羁绊搭配、阵容推荐应有尽有，助您快速上分！',
    url: 'https://bhwa233-web.vercel.app/zh/tft',
    siteName: '工具箱',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/icons/icon-256.png',
        width: 256,
        height: 256,
        alt: '云顶之弈攻略 - TFT装备合成表',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '云顶之弈攻略大全 - TFT装备合成表·羁绊搭配指南',
    description: '云顶之弈一图流攻略，装备合成表、羁绊搭配、阵容推荐应有尽有',
    images: ['/icons/icon-256.png'],
  },
  alternates: {
    canonical: 'https://bhwa233-web.vercel.app/zh/tft',
    languages: {
      'zh-CN': 'https://bhwa233-web.vercel.app/zh/tft',
    },
  },
  other: {
    'google-site-verification': 'fc9f0f35f747acd0',
  },
};

export default async function TftRedirectPage() {
  const versionData = await getVersionConfig();
  const latestVersion = versionData[0]; // 假设第一个是最新版本

  redirect(`/tft/${latestVersion.idSeason}`);
}
