import { SpeedInsights } from '@vercel/speed-insights/next';
import { ClientProviders } from '../src/components/client-providers';
import { GlobalStructuredData } from '../src/components/structured-data';
import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next"
import Script from 'next/script'
import { Toaster } from '../src/components/ui/toaster';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://tools.bhwa233.com'),
  title: {
    default: 'Toolbox - Online Productivity Tools Collection | 工具箱',
    template: '%s | Toolbox'
  },
  description: 'Integrated file upload, media processing, audio converter, image editor and other multi-functional online toolbox. Features tools to enhance your productivity and entertainment experience. 集成文件上传、媒体处理、音频转换、图片编辑等多功能在线工具箱。',
  keywords: [
    'online tools', 'toolbox', 'file upload', 'media processing', 'productivity tools',
    'audio converter', 'image editor', 'batch processing', 'format converter',
    '在线工具', '工具箱', '文件上传', '媒体处理', '音频转换', '图片编辑',
    '摸鱼办', 'Chinese tools', '生产力工具'
  ],
  authors: [{ name: '233tools', url: 'https://tools.bhwa233.com' }],
  creator: '233tools',
  publisher: 'Toolbox',
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
  other: {
    // 预加载 FFmpeg 资源（优化性能）
    'preload-ffmpeg-core': 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
    'preload-ffmpeg-wasm': 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['zh_CN', 'zh_TW'],
    url: 'https://tools.bhwa233.com',
    siteName: 'Toolbox | 工具箱',
    title: 'Toolbox - Online Productivity Tools Collection | 工具箱',
    description: 'Integrated file upload, media processing and other multi-functional online toolbox with tools to enhance productivity. 集成多功能在线工具箱，提升生产力。',
    images: [
      {
        url: '/icons/icon-256.png',
        width: 256,
        height: 256,
        alt: 'Toolbox Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toolbox - Online Productivity Tools Collection',
    description: 'Integrated file upload, media processing and other multi-functional online toolbox with productivity tools',
    images: ['/icons/icon-256.png'],
  },
  verification: {
    google: 'fc9f0f35f747acd0',
  },
  alternates: {
    canonical: 'https://tools.bhwa233.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
  }) {
  return (
    <html suppressHydrationWarning lang="en">
      <head>
        <GlobalStructuredData />
        {/* 预加载 FFmpeg 资源以提升性能 */}
        <link
          rel="preload"
          href="https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js"
          as="fetch"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm"
          as="fetch"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-LDWSSHPH6W"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-LDWSSHPH6W');
          `}
        </Script>
        <ClientProviders>
          <main className='min-h-screen h-full w-screen'>
            {children}
            <SpeedInsights />
            <Analytics />
          </main>
        </ClientProviders>
        <Toaster />
      </body>
    </html>
  );
}
