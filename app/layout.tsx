import './global.css';
import Header from './Header';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from '../src/components/ui/toaster';
import { ClientProviders } from '../src/components/client-providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: '工具箱 - 在线生产力工具集合',
    template: '%s | 工具箱'
  },
  description: '集成云顶之弈攻略、摸鱼办、热榜资讯等多功能的在线工具箱，提升您的工作效率和娱乐体验',
  keywords: ['在线工具', '工具箱', '云顶之弈', 'TFT攻略', '摸鱼办', '热榜', '生产力工具', '装备合成'],
  authors: [{ name: 'lxw15337674' }],
  creator: 'lxw15337674',
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
    type: 'website',
    locale: 'zh_CN',
    url: 'https://bhwa233-web.vercel.app',
    siteName: '工具箱',
    title: '工具箱 - 在线生产力工具集合',
    description: '集成云顶之弈攻略、摸鱼办、热榜资讯等多功能的在线工具箱',
    images: [
      {
        url: '/icons/icon-256.png',
        width: 256,
        height: 256,
        alt: '工具箱 Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '工具箱 - 在线生产力工具集合',
    description: '集成云顶之弈攻略、摸鱼办、热榜资讯等多功能的在线工具箱',
    images: ['/icons/icon-256.png'],
  },
  verification: {
    google: 'fc9f0f35f747acd0',
  },
  alternates: {
    canonical: 'https://bhwa233-web.vercel.app',
  },
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="zh-CN">
      <body>
        <ClientProviders>
          <main className='min-h-screen h-full w-screen'>
            <Header />
            {children}
            <Toaster />
            <SpeedInsights />
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
