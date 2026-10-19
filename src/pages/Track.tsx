import { useParams } from 'react-router-dom'
import { Breadcrumb } from '../components/Breadcrumb'
import { Player } from '../components/Player'
import { audioUrl } from '../content/catalog'
import { useCatalog } from '../content/CatalogProvider'
import { useLocale } from '../i18n/LocaleProvider'
import { NotFound } from './NotFound'

export function Track() {
  const { bookId = '', unitId = '', trackId = '' } = useParams()
  const { t } = useLocale()
  const { getBook, getUnit, getTrack } = useCatalog()
  const book = getBook(bookId)
  const unit = getUnit(bookId, unitId)
  const track = getTrack(bookId, unitId, trackId)
  if (!book || !unit || !track) return <NotFound />
  const unitPath = `/b/${book.id}/u/${unit.id}`
  return (
    <>
      <Breadcrumb backTo={unitPath} trail={[book.title, unit.title || unit.number]} />
      <h1 tabIndex={-1}>{t('player.track', { label: track.label })}</h1>
      <Player key={track.id} src={audioUrl(track)} chooseAnotherTo={unitPath} />
    </>
  )
}
