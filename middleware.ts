import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['en', 'zh', 'zh-tw'] as const
const defaultLocale = 'en'

function getLocale(request: NextRequest): string {
  // 1. 检查 URL 路径中是否已有语言
  const pathname = request.nextUrl.pathname
  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  if (pathnameLocale) return pathnameLocale

  // 2. 检查 cookie
  const localeCookie = request.cookies.get('locale')?.value
  if (localeCookie && locales.includes(localeCookie as any)) {
    return localeCookie
  }

  // 3. 检查 Accept-Language header
  const acceptLanguage = request.headers.get('accept-language')
  if (acceptLanguage) {
    // 简单解析 Accept-Language (格式: zh-CN,zh;q=0.9,en;q=0.8)
    const languages = acceptLanguage.split(',').map(lang => {
      const [code] = lang.trim().split(';')
      return code.toLowerCase()
    })

    // 匹配完整的 locale
    for (const lang of languages) {
      if (locales.includes(lang as any)) {
        return lang
      }
    }

    // 匹配语言前缀 (zh-CN -> zh, zh-TW -> zh-tw)
    for (const lang of languages) {
      const prefix = lang.split('-')[0]
      if (prefix === 'zh') {
        // 检查是否是繁体中文
        if (lang.includes('tw') || lang.includes('hk') || lang.includes('mo')) {
          return 'zh-tw'
        }
        return 'zh'
      }
      if (prefix === 'en') {
        return 'en'
      }
    }
  }

  // 4. 返回默认语言
  return defaultLocale
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // 检查路径是否已包含语言前缀
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) {
    return NextResponse.next()
  }

  // 特殊路径不处理 (静态资源、API等)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // 文件 (如 .ico, .png, .js 等)
  ) {
    return NextResponse.next()
  }

  // 获取用户语言并重定向
  const locale = getLocale(request)
  const newUrl = new URL(`/${locale}${pathname}`, request.url)
  
  // 保留查询参数
  newUrl.search = request.nextUrl.search

  const response = NextResponse.redirect(newUrl)
  
  // 设置 cookie 保存用户语言偏好
  response.cookies.set('locale', locale, {
    maxAge: 60 * 60 * 24 * 365, // 1年
    path: '/',
  })

  return response
}

export const config = {
  matcher: [
    // 匹配所有路径，除了:
    // - api路由
    // - _next/static (静态文件)
    // - _next/image (图片优化)
    // - favicon.ico, sitemap.xml等
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}
