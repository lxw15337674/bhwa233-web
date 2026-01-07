import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './src/lib/i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always use a locale prefix
  localePrefix: 'always'
});

export const config = {
  matcher: [
    // 匹配所有路径，除了:
    // - api路由
    // - _next/static (静态文件)
    // - _next/image (图片优化)
    // - favicon.ico, sitemap.xml, manifest.webmanifest等
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}
