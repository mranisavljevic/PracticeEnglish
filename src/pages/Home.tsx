import { BookCard } from '../components/BookCard'
import { useCatalog } from '../content/CatalogProvider'
import { useLocale } from '../i18n/LocaleProvider'

export function Home() {
  const { t } = useLocale()
  const { booksByLevel } = useCatalog()
  return (
    <>
      <h1 tabIndex={-1}>{t('home.title')}</h1>
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
