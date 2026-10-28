import { useLocale } from '../i18n/LocaleProvider'

export function Credit() {
  const { t } = useLocale()
  return (
    <>
      <p>{t('credit.source')}</p>
      <p>{t('credit.noEndorsement')}</p>
    </>
  )
}
