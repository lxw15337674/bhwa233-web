import { getVersionConfig } from '@/api/tft';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '云顶之弈攻略 - TFT装备合成与羁绊搭配指南',
  description: '最新云顶之弈攻略助手，提供装备合成表、羁绊搭配推荐、英雄技能详解，助您轻松上分',
  keywords: ['云顶之弈', 'TFT攻略', '装备合成', '羁绊搭配', '英雄技能', '云顶攻略', '自走棋', 'LOL云顶'],
  openGraph: {
    title: '云顶之弈攻略 - TFT装备合成与羁绊搭配指南',
    description: '最新云顶之弈攻略助手，装备合成表、羁绊搭配推荐',
    url: 'https://bhwa233-web.vercel.app/tft',
    type: 'website',
  },
};

export default async function TftRedirectPage() {
  const versionData = await getVersionConfig();
  const latestVersion = versionData[0]; // 假设第一个是最新版本

  redirect(`/tft/${latestVersion.idSeason}`);
}
