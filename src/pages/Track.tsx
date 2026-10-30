import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { clearSource, hasSource, readSource } from '../analytics/source'
import { Breadcrumb } from '../components/Breadcrumb'
import { Player } from '../components/Player'
import { audioUrl } from '../content/catalog'
import { useCatalog } from '../content/CatalogProvider'
import { useLocale } from '../i18n/LocaleProvider'
import { saveProgress } from '../storage/progress'
import { NotFound } from './NotFound'

export function Track() {
  const { bookId = '', unitId = '', trackId = '' } = useParams()
  const { t } = useLocale()
  const { getBook, getUnit, getTrack, getSiblings } = useCatalog()
  const book = getBook(bookId)
  const unit = getUnit(bookId, unitId)
  const track = getTrack(bookId, unitId, trackId)
  const known = Boolean(book && unit && track)
  const location = useLocation()
  const navigate = useNavigate()

  // The arrival source rides in history state; this page stays mounted across Next/Previous, so keep it per arrival.
  const [arrival, setArrival] = useState(() => ({
    key: location.key,
    path: location.pathname,
    source: readSource(location.state),
  }))
  if (hasSource(location.state) && arrival.key !== location.key) {
    setArrival({ key: location.key, path: location.pathname, source: readSource(location.state) })
  } else if (arrival.path !== location.pathname) {
    setArrival({ key: location.key, path: location.pathname, source: 'navigation' })
  }
  // Once read, drop it from the history entry so a reload or back/forward is plain navigation.
  useEffect(() => {
    if (hasSource(location.state)) clearSource(navigate, location)
  }, [location, navigate])

  // Visiting a track page (including a direct link) records it as the place to continue from.
  useEffect(() => {
    if (known) saveProgress({ bookId, unitId, trackId })
  }, [known, bookId, unitId, trackId])

  if (!book || !unit || !track) return <NotFound />
  const unitPath = `/b/${book.id}/u/${unit.id}`
  const { prev, next } = getSiblings(bookId, unitId, trackId)
  const trackPath = (id: string) => `${unitPath}/t/${id}`
  return (
    <>
      <Breadcrumb backTo={unitPath} trail={[book.title, unit.title || unit.number]} />
      <h1 tabIndex={-1}>{t('player.track', { label: track.label })}</h1>
      <Player
        key={track.id}
        src={audioUrl(track)}
        chooseAnotherTo={unitPath}
        prevTo={prev && trackPath(prev.id)}
        nextTo={next && trackPath(next.id)}
        source={arrival.source}
        ids={{ level: book.levelId, bookType: book.type, unit: unit.id, track: track.id }}
        onPlay={() => saveProgress({ bookId, unitId, trackId })}
      />
    </>
  )
}
