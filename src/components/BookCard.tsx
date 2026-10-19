import { Link } from 'react-router-dom'
import type { Book } from '../content/catalog'
import { useLocale } from '../i18n/LocaleProvider'

export function BookCard({ book }: { book: Book }) {
  const { t, lang } = useLocale()
  const translated = lang !== 'en' ? book.titleTranslations?.[lang] : undefined
  return (
    <Link to={`/b/${book.id}`} className="card">
      {book.cover && <img className="card__cover" src={book.cover} alt="" loading="lazy" />}
      <span className="card__body">
        <span className="badge">{t(`book.type.${book.type}`)}</span>
        <span className="card__title">{book.title}</span>
        {translated && <span className="card__secondary">{translated}</span>}
      </span>
    </Link>
  )
}
