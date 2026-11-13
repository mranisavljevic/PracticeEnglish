import { describe, expect, it } from 'vitest'
import { createCatalogApi, type Catalog } from '../../src/content/catalog'
import catalogJson from '../../src/content/catalog.json'

const catalog = catalogJson as unknown as Catalog
const api = createCatalogApi(catalog)
const EXPECTED = [
  'level-1-student-book',
  'level-1-workbook',
  'level-3-student-book',
  'level-3-workbook',
  'level-4-workbook',
]

describe('bundled coming-soon placeholders', () => {
  it('are exactly the five unreleased books', () => {
    expect((catalog.comingSoon ?? []).map((b) => b.id).sort()).toEqual(EXPECTED)
  })

  it.each(EXPECTED)('%s is a placeholder, not a book', (id) => {
    expect(api.getBook(id)).toBeUndefined()
    expect(api.getComingSoon(id)?.id).toBe(id)
    expect(catalog.books.map((b) => b.id)).not.toContain(id)
    expect(api.getComingSoon(id)).not.toHaveProperty('units')
    expect(api.getComingSoon(id)?.titleTranslations?.es).toBeTruthy()
  })

  it('every placeholder level exists and is shown on Home', () => {
    const shown = api.booksByLevel().map((g) => g.level.id)
    for (const b of catalog.comingSoon ?? []) expect(shown).toContain(b.levelId)
  })
})
