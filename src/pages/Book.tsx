import { Link, useParams } from 'react-router-dom'
import { Breadcrumb } from '../components/Breadcrumb'
import { ScanButton } from '../components/ScanButton'
import { useCatalog } from '../content/CatalogProvider'
import { useLocale } from '../i18n/LocaleProvider'
import { NotFound } from './NotFound'

export function Book() {
  const { bookId = '' } = useParams()
  const { t, lang } = useLocale()
  const { getBook } = useCatalog()
  const book = getBook(bookId)
  if (!book) return <NotFound />
  const translated = lang !== 'en' ? book.titleTranslations?.[lang] : undefined
  return (
    <>
      <Breadcrumb backTo="/" trail={[]} />
      <h1 tabIndex={-1}>{book.title}</h1>
      {translated && <p className="secondary">{translated}</p>}
      <ScanButton bookId={book.id} />
      <h2>{t('book.units')}</h2>
      {book.units.length === 0 ? (
        <p>{t('book.noUnits')}</p>
      ) : (
        <ul className="list">
          {book.units.map((unit) => {
            const text = unit.title
              ? t('unit.heading', { number: unit.number, title: unit.title })
              : t('unit.headingNoTitle', { number: unit.number })
            const tr = lang !== 'en' ? unit.titleTranslations?.[lang] : undefined
            return (
              <li key={unit.id}>
                <Link to={`/b/${book.id}/u/${unit.id}`} className="card">
                  <span className="card__body">
                    <span className="card__title">{text}</span>
                    {tr && <span className="card__secondary">{tr}</span>}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
