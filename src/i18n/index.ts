import { safeStorage } from '../storage/safeStorage'

export type Dictionary = Record<string, string>
export type Dictionaries = Record<string, Dictionary>
export type TParams = Record<string, string | number>
export type TFunction = (key: string, params?: TParams) => string

export interface LocaleInfo {
  code: string
  nativeName: string
}

const modules = import.meta.glob('../locales/*.json', { eager: true, import: 'default' }) as Record<
  string,
  Dictionary
>

export const dictionaries: Dictionaries = Object.fromEntries(
  Object.entries(modules).map(([path, dict]) => [path.replace(/^.*\/([^/]+)\.json$/, '$1'), dict]),
)

export function getLocales(dicts: Dictionaries = dictionaries): LocaleInfo[] {
  return Object.entries(dicts).map(([code, dict]) => ({ code, nativeName: dict['meta.nativeName'] ?? code }))
}

export function createTranslator(lang: string, dicts: Dictionaries = dictionaries): TFunction {
  return (key, params) => {
    let text = dicts[lang]?.[key] ?? dicts.en?.[key]
    if (text === undefined) {
      if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`)
      return key
    }
    if (params) {
      for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value))
    }
    return text
  }
}

export const LANG_KEY = 'pe.lang'

export function isSupported(code: string, dicts: Dictionaries = dictionaries): boolean {
  return Object.prototype.hasOwnProperty.call(dicts, code)
}

/** Saved choice → first supported browser language → English. */
export function detectLanguage(dicts: Dictionaries = dictionaries): string {
  const saved = safeStorage.getItem(LANG_KEY)
  if (saved && isSupported(saved, dicts)) return saved
  const preferred = typeof navigator !== 'undefined' ? (navigator.languages ?? [navigator.language]) : []
  for (const tag of preferred) {
    const primary = tag?.toLowerCase().split('-')[0]
    if (primary && isSupported(primary, dicts)) return primary
  }
  return 'en'
}
