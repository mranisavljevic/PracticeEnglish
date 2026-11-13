import type { ComingSoonBook } from '../content/catalog'
import { useLocale } from '../i18n/LocaleProvider'

/** A greyed, non-interactive tile for a book that is not available yet. */
export function ComingSoonCard({ book }: { book: ComingSoonBook }) {
  const { t, lang } = useLocale()
  const translated = lang !== 'en' ? book.titleTranslations?.[lang] : undefined
  return (
    <div className="card card--soon">
      <span className="card__body">
        <span className="badge">{t('book.comingSoon')}</span>
        <span className="card__title">{book.title}</span>
        {translated && <span className="card__secondary">{translated}</span>}
      </span>
    </div>
  )
}
