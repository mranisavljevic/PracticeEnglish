import { useEffect, useRef } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { ConsentBanner, PrivacySettingsButton } from '../analytics/ConsentBanner'
import { Credit } from './Credit'
import { OfflineNotice } from './OfflineNotice'
import { LanguageSwitcher } from './LanguageSwitcher'
import { useLocale } from '../i18n/LocaleProvider'

export function Layout() {
  const { t } = useLocale()
  const { pathname } = useLocation()
  const first = useRef(true)

  // Route-change focus management: move focus to the page <h1> after navigation.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    document.querySelector<HTMLElement>('main h1')?.focus()
  }, [pathname])

  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/" className="layout__brand">
          {t('app.name')}
        </Link>
        <LanguageSwitcher />
      </header>
      <OfflineNotice />
      <main className="layout__main">
        <Outlet />
      </main>
      <footer className="layout__footer">
        <Credit />
        <p id="privacy-note">{t('analytics.privacy')}</p>
        <PrivacySettingsButton />
      </footer>
      <ConsentBanner />
    </div>
  )
}
