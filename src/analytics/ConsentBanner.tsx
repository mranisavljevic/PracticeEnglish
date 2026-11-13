import { useSyncExternalStore } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import { promptVisible, reopenPrompt, settingsAvailable, setConsent, subscribe } from './consent'

export function ConsentBanner() {
  const { t } = useLocale()
  const visible = useSyncExternalStore(subscribe, promptVisible)
  if (!visible) return null
  return (
    <section className="consent" role="region" aria-labelledby="consent-title">
      <h2 id="consent-title" className="consent__title">
        {t('consent.title')}
      </h2>
      <p className="consent__body">
        {t('consent.body')} <a href="#privacy-note">{t('consent.more')}</a>
      </p>
      <div className="consent__actions">
        <button type="button" className="consent__button consent__button--primary" onClick={() => setConsent('granted')}>
          {t('consent.accept')}
        </button>
        <button type="button" className="consent__button" onClick={() => setConsent('declined')}>
          {t('consent.decline')}
        </button>
      </div>
    </section>
  )
}

/** Footer control that reopens the choice; absent when a privacy signal or the build setting leaves nothing to choose. */
export function PrivacySettingsButton() {
  const { t } = useLocale()
  const available = useSyncExternalStore(subscribe, settingsAvailable)
  if (!available) return null
  return (
    <button type="button" className="consent__settings" onClick={reopenPrompt}>
      {t('consent.settings')}
    </button>
  )
}
