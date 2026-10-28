import { ContinueCard } from '../components/ContinueCard'
import { BookCard } from '../components/BookCard'
import { useCatalog } from '../content/CatalogProvider'
import { useLocale } from '../i18n/LocaleProvider'
import { loadProgress } from '../storage/progress'

export function Home() {
  const { t } = useLocale()
  const { catalog, booksByLevel } = useCatalog()
  const progress = loadProgress(catalog)
  return (
    <>
      <h1 tabIndex={-1}>{t('home.title')}</h1>
      {progress && <ContinueCard progress={progress} />}
      <p>{t('home.intro')}</p>
      {booksByLevel().map(({ level, books }) => (
        <section key={level.id}>
          <h2>{level.title}</h2>
          <ul className="list">
            {books.map((book) => (
              <li key={book.id}>
                <BookCard book={book} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  )
}
