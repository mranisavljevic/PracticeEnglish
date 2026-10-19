import { createContext, useContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createTranslator, detectLanguage, isSupported, LANG_KEY, type TFunction } from '.'
import { safeStorage } from '../storage/safeStorage'

interface LocaleContextValue {
  lang: string
  setLang: (lang: string) => void
  t: TFunction
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(detectLanguage)
  const setLang = useCallback((next: string) => {
    if (!isSupported(next)) return
    setLangState(next)
    safeStorage.setItem(LANG_KEY, next)
  }, [])
  const t = useMemo(() => createTranslator(lang), [lang])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used inside LocaleProvider')
  return ctx
}
