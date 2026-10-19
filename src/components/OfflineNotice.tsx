import { useSyncExternalStore } from 'react'
import { useLocale } from '../i18n/LocaleProvider'

function subscribe(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

export function OfflineNotice() {
  const { t } = useLocale()
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
  if (online) return null
  return (
    <p role="status" className="offline-notice">
      {t('error.offline')}
    </p>
  )
}
