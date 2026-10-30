import { useEffect, useRef, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCatalog } from '../content/CatalogProvider'
import { useLocale } from '../i18n/LocaleProvider'
import { useScanner } from '../scan/useScanner'

interface Props {
  bookId: string
  currentUnitId?: string
  onClose: () => void
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function ScanOverlay({ bookId, currentUnitId, onClose }: Props) {
  const { t } = useLocale()
  const { getBook } = useCatalog()
  const navigate = useNavigate()
  const book = getBook(bookId)
  const dialogRef = useRef<HTMLDivElement>(null)
  const { state, videoRef } = useScanner(book ?? { id: bookId, levelId: '', type: 'textbook', title: '', units: [] })

  // Move focus into the dialog and put it back where it was when the dialog closes.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    dialogRef.current?.focus()
    return () => {
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const trapTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const items = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
    const first = items[0]
    const last = items[items.length - 1]
    if (!first || !last) return
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const open = () => {
    if (state.status !== 'detected') return
    const unitPath = `/b/${bookId}/u/${state.match.unitId}`
    // Going through the unit first makes back (link or browser) land on that unit's track list.
    if (state.match.unitId !== currentUnitId) navigate(unitPath)
    navigate(`${unitPath}/t/${state.match.trackId}`)
    onClose()
  }

  let status: string | null = null
  if (state.status === 'starting') status = t('scan.loading')
  else if (state.status === 'scanning' && state.hint) status = t(`scan.${state.hint}`)
  else if (state.status === 'notFound') status = t('scan.notFound', { number: state.number })
  else if (state.status === 'error') status = t(`scan.error.${state.kind}`)

  return (
    <div
      ref={dialogRef}
      className="scan"
      role="dialog"
      aria-modal="true"
      aria-labelledby="scan-title"
      tabIndex={-1}
      onKeyDown={trapTab}
    >
      <header className="scan__header">
        <h2 id="scan-title" className="scan__title">
          {t('scan.title')}
        </h2>
        {state.status !== 'error' && <p className="scan__instructions">{t('scan.instructions')}</p>}
      </header>
      <div className="scan__viewport" hidden={state.status === 'error'}>
        <video ref={videoRef} className="scan__video" playsInline muted autoPlay />
        <div className="scan__reticle" aria-hidden="true" />
      </div>
      <div className="scan__panel">
        <div className="scan__status" aria-live="polite">
          {state.status === 'detected' && <p className="scan__number">{t('scan.detected', { number: state.number })}</p>}
          {status && <p>{status}</p>}
        </div>
        <div className="scan__actions">
          {state.status === 'detected' && (
            <button type="button" className="scan__open" onClick={open}>
              {t('scan.open')}
            </button>
          )}
          {state.status === 'error' ? (
            <button type="button" className="secondary" onClick={onClose}>
              {t('scan.chooseManually')}
            </button>
          ) : (
            <button type="button" className="secondary" onClick={onClose}>
              {t('scan.cancel')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
