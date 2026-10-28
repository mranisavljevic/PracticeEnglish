import { useState } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import { useCameraAvailable } from '../scan/camera'
import { ScanOverlay } from './ScanOverlay'

interface Props {
  bookId: string
  currentUnitId?: string
}

export function ScanButton({ bookId, currentUnitId }: Props) {
  const { t } = useLocale()
  const available = useCameraAvailable()
  const [open, setOpen] = useState(false)
  if (!available) return null
  return (
    <>
      <button type="button" className="scan-button" onClick={() => setOpen(true)}>
        {t('scan.button')}
      </button>
      {open && <ScanOverlay bookId={bookId} currentUnitId={currentUnitId} onClose={() => setOpen(false)} />}
    </>
  )
}
