import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createTranslator, type TFunction } from '.'

interface LocaleContextValue {
  lang: string
  setLang: (lang: string) => void
  t: TFunction
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState('en')
  const t = useMemo(() => createTranslator(lang), [lang])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider')
  return ctx
}
