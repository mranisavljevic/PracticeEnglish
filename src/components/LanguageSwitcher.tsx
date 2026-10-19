import { getLocales } from '../i18n'
import { useLocale } from '../i18n/LocaleProvider'

const locales = getLocales()

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLocale()
  return (
    <label className="lang-switcher">
      <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label={t('lang.label')} lang={lang}>
        {locales.map((l) => (
          <option key={l.code} value={l.code} lang={l.code}>
            {l.nativeName}
          </option>
        ))}
      </select>
    </label>
  )
}
