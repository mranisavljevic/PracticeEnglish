import { Link } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleProvider'

export function NotFound() {
  const { t } = useLocale()
  return (
    <section>
      <h1 tabIndex={-1}>{t('error.notFound')}</h1>
      <p>
        <Link to="/" className="button">
          {t('nav.home')}
        </Link>
      </p>
    </section>
  )
}
