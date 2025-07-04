'use client'

import { createContext, useContext, ReactNode } from 'react'
import { Locale } from '../lib/i18n'

interface TranslationContextType {
  locale: Locale
  translations: any
  t: (key: string, params?: Record<string, any>) => string
}

const TranslationContext = createContext<TranslationContextType | null>(null)

export function TranslationProvider({ 
  children, 
  locale, 
  translations 
}: { 
  children: ReactNode
  locale: Locale
  translations: any 
}) {
  const t = (key: string, params?: Record<string, any>): string => {
    const keys = key.split('.')
    let value = translations

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return key // 如果找不到翻译，返回原key
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    // 简单的插值处理
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match
      })
    }

    return value
  }

  return (
    <TranslationContext.Provider value={{ locale, translations, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider')
  }
  return context
}
