'use client'

import Link from 'next/link'
import { Categories } from '../RouterConfig'
import { StructuredData, websiteStructuredData } from '@/components/structured-data'
import { useTranslation } from '@/components/TranslationProvider'

export default function HomePage() {
  const { t, locale } = useTranslation()

  // 根据语言过滤菜单项（隐藏非中文用户的摸鱼办）
  const filteredCategories = Categories.map(category => ({
    ...category,
    items: category.items.filter(item => {
      // 如果是摸鱼办且不是中文，则过滤掉
      if (item.url === '/fishingTime' && !locale.startsWith('zh')) {
        return false
      }
      return true
    })
  })).filter(category => category.items.length > 0) // 移除空分类

  return (
    <>
      <StructuredData data={websiteStructuredData} />
      <div className="container px-4 py-4 mx-auto max-w-7xl">
        <header>
          <h1 className="text-2xl font-bold mb-4">{t('home.title')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('home.description')}
          </p>
        </header>

        <section>
          <h2 className="text-lg font-semibold mb-4">{t('home.appNavigation')}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredCategories.flatMap(category => category.items).map((app) => (
              <Link
                key={app.url}
                href={`/${locale}${app.url}`}
                className="flex flex-col items-center justify-center p-2 rounded-lg border hover:bg-accent transition-colors"
                title={app.description || t('home.useToolTitle', { name: app.name })}
              >
                {app.icon && <app.icon className="w-8 h-8 mb-4" aria-hidden="true" />}
                <span className="text-center">{app.name}</span>
                {app.description && (
                  <span className="text-xs text-muted-foreground mt-1 text-center">
                    {app.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
