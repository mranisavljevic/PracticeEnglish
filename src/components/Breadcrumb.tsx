import { Link } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleProvider'

interface Props {
  backTo: string
  /** Printed (English) titles of the ancestors, outermost first. */
  trail: string[]
}

export function Breadcrumb({ backTo, trail }: Props) {
  const { t } = useLocale()
  return (
    <nav className="breadcrumb" aria-label={t('nav.back')}>
      <Link to={backTo} className="breadcrumb__back">
        <span aria-hidden="true">← </span>
        {t('nav.back')}
      </Link>
      {trail.length > 0 && (
        <ol className="breadcrumb__trail">
          {trail.map((title, i) => (
            <li key={i}>{title}</li>
          ))}
        </ol>
      )}
    </nav>
  )
}
