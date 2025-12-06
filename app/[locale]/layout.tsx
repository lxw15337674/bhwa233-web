import { TranslationProvider } from '../../src/components/TranslationProvider'
import { getTranslations, locales, type Locale } from '../../src/lib/i18n'
import { notFound } from 'next/navigation'
import Header from '../Header'

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
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
