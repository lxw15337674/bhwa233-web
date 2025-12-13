import { TranslationProvider } from '../../src/components/TranslationProvider'
import { getTranslations, locales, type Locale } from '../../src/lib/i18n'
import { notFound } from 'next/navigation'
import Header from '../Header'
import { Metadata } from 'next'

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations(locale)
  const baseUrl = 'https://tools.bhwa233.com'

  const languageNames = {
    en: 'English',
    zh: '简体中文',
    'zh-tw': '繁體中文'
  }

  return {
    title: {
      default: t.home?.title || 'Toolbox - Online Productivity Tools',
      template: `%s | ${t.home?.title?.split(' - ')[0] || 'Toolbox'}`
    },
    description: t.home?.description || 'Integrated file upload, media processing and other multi-functional online toolbox',
    alternates: {
      canonical: locale === 'en' ? baseUrl : `${baseUrl}/${locale}`,
      languages: {
        'en': baseUrl,
        'zh': `${baseUrl}/zh`,
        'zh-tw': `${baseUrl}/zh-tw`,
        'x-default': baseUrl
      }
    },
    openGraph: {
      locale: locale === 'zh-tw' ? 'zh_TW' : locale === 'zh' ? 'zh_CN' : 'en_US',
      alternateLocale: locales.filter(l => l !== locale).map(l =>
        l === 'zh-tw' ? 'zh_TW' : l === 'zh' ? 'zh_CN' : 'en_US'
      )
    },
    other: {
      'language': languageNames[locale as keyof typeof languageNames]
    }
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // 验证语言是否有效
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const translations = await getTranslations(locale as Locale)

  return (
    <TranslationProvider locale={locale as Locale} translations={translations}>
      <Header />
      {children}
    </TranslationProvider>
  )
}
