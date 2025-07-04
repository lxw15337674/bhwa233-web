import './global.css';
import Header from './Header';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from '../src/components/ui/toaster';
import { ClientProviders } from '../src/components/client-providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Toolbox - Online Productivity Tools Collection',
    template: '%s | Toolbox'
  },
  description: 'Integrated TFT guides, fishing tools, file upload and other multi-functional online toolbox. Features Chinese workplace tools and gaming guides to enhance your productivity and entertainment experience',
  keywords: ['online tools', 'toolbox', 'TFT guides', 'file upload', 'productivity tools', 'TFT equipment synthesis', '云顶之弈', '摸鱼办', 'Chinese tools'],
  authors: [{ name: '233tools' }],
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
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://bhwa233-web.vercel.app',
    siteName: 'Toolbox',
    title: 'Toolbox - Online Productivity Tools Collection',
    description: 'Integrated TFT guides, fishing tools, file upload and other multi-functional online toolbox with Chinese workplace tools',
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
    description: 'Integrated TFT guides, fishing tools, file upload and other multi-functional online toolbox with Chinese workplace tools',
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
    <html suppressHydrationWarning lang="en">
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
