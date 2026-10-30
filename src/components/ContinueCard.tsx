import { Link } from 'react-router-dom'
import { useAnalytics } from '../analytics/AnalyticsProvider'
import { withSource } from '../analytics/source'
import { useCatalog } from '../content/CatalogProvider'
import type { Progress } from '../storage/progress'
import { useLocale } from '../i18n/LocaleProvider'

export function ContinueCard({ progress }: { progress: Progress }) {
  const { t } = useLocale()
  const { resumeUsed } = useAnalytics()
  const { getBook, getUnit, getTrack } = useCatalog()
  const book = getBook(progress.bookId)
  const unit = getUnit(progress.bookId, progress.unitId)
  const track = getTrack(progress.bookId, progress.unitId, progress.trackId)
  if (!book || !unit || !track) return null
  const unitText = unit.title
    ? t('unit.heading', { number: unit.number, title: unit.title })
    : t('unit.headingNoTitle', { number: unit.number })
  return (
    <Link
      to={`/b/${book.id}/u/${unit.id}/t/${track.id}`}
      state={withSource('resume')}
      onClick={resumeUsed}
      className="card card--continue"
    >
      <span className="card__body">
        <span className="card__title">{t('continue.title', { track: t('unit.track', { label: track.label }) })}</span>
        <span className="card__secondary">{t('continue.where', { book: book.title, unit: unitText })}</span>
      </span>
    </Link>
  )
}
