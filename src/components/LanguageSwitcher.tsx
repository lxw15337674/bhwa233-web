'use client'

import { usePathname, useRouter } from 'next/navigation'
import { locales, type Locale } from '../lib/i18n'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select'
import { Globe } from 'lucide-react'

const languageNames: Record<Locale, string> = {
  en: 'English',
  zh: '简体中文',
  'zh-tw': '繁體中文',
}

export function LanguageSwitcher() {
  const pathname = usePathname()
  const router = useRouter()

  // 从路径中提取当前语言
  const currentLocale = locales.find(locale => 
    pathname.startsWith(`/${locale}`)
  ) || 'en'

  const handleLanguageChange = (newLocale: string) => {
    // 替换路径中的语言部分
    const segments = pathname.split('/')
    segments[1] = newLocale
    const newPath = segments.join('/')
    
    // 设置 cookie
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000`
    
    // 导航到新路径
    router.push(newPath)
  }

  return (
    <Select value={currentLocale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[160px] gap-2">
        <Globe className="w-4 h-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {locales.map((locale) => (
          <SelectItem key={locale} value={locale}>
            {languageNames[locale]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

