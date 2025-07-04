'use client'

import { useState, useEffect } from 'react'
import { Locale, locales, defaultLocale, setLocale } from '../lib/i18n'

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)

  useEffect(() => {
    // 从 cookie 中读取语言设置
    const cookies = document.cookie.split(';')
    const localeCookie = cookies.find(cookie => cookie.trim().startsWith('locale='))
    if (localeCookie) {
      const value = localeCookie.split('=')[1] as Locale
      if (locales.includes(value)) {
        setLocaleState(value)
      }
    }
  }, [])

  const changeLocale = (newLocale: Locale) => {
    setLocale(newLocale)
    setLocaleState(newLocale)
    // 刷新页面以应用新语言
    window.location.reload()
  }

  return { locale, changeLocale }
}

export function LanguageSwitcher() {
  const { locale, changeLocale } = useLocale()

  return (
    <select 
      value={locale} 
      onChange={(e) => changeLocale(e.target.value as Locale)}
      className="border rounded px-2 py-1"
    >
      <option value="en">English</option>
      <option value="zh">简体中文</option>
      <option value="zh-tw">繁體中文</option>
    </select>
  )
}
