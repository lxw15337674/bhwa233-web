'use client';
import './global.css';
import { ThemeProvider as NextThemeProvider } from "@/components/theme-provider"
import Header from './Header';
import { SidebarProvider } from '../src/components/ui/sidebar';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Toaster } from '../src/components/ui/toaster';



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>
        <SidebarProvider>
          <NextThemeProvider
            attribute="class"
            defaultTheme="dark"
          >
            <main className='min-h-screen h-full w-screen'>
              <Header />
              {children}
              <Toaster />
              <SpeedInsights />
            </main>
          </NextThemeProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
