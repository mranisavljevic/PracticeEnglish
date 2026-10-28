import { Link, useParams } from 'react-router-dom'
import { Breadcrumb } from '../components/Breadcrumb'
import { useCatalog } from '../content/CatalogProvider'
import { useLocale } from '../i18n/LocaleProvider'
import { NotFound } from './NotFound'

export function Unit() {
  const { bookId = '', unitId = '' } = useParams()
  const { t, lang } = useLocale()
  const { getBook, getUnit } = useCatalog()
  const book = getBook(bookId)
  const unit = getUnit(bookId, unitId)
  if (!book || !unit) return <NotFound />
  const heading = unit.title
    ? t('unit.heading', { number: unit.number, title: unit.title })
    : t('unit.headingNoTitle', { number: unit.number })
  const translated = lang !== 'en' ? unit.titleTranslations?.[lang] : undefined
  return (
    <>
      <Breadcrumb backTo={`/b/${book.id}`} trail={[book.title]} />
      <h1 tabIndex={-1}>{heading}</h1>
      {translated && <p className="secondary">{translated}</p>}
      <h2>{t('unit.tracks')}</h2>
      <ul className="tracks">
        {unit.tracks.map((track) => (
          <li key={track.id}>
            <Link
              to={`/b/${book.id}/u/${unit.id}/t/${track.id}`}
              className="track-link"
              aria-label={t('unit.track', { label: track.label })}
            >
              {track.label}
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
