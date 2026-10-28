import { describe, it, expect } from 'vitest'
import { createCatalogApi } from '../../src/content/catalog'
import { testCatalog } from '../fixtures/testCatalog'

const api = createCatalogApi(testCatalog)

describe('catalog lookups', () => {
  it('getBook / getUnit / getTrack resolve known ids', () => {
    expect(api.getBook('book-a')?.title).toBe('Book A Textbook')
    expect(api.getUnit('book-a', 'unit-2')?.title).toBe('Goodbye')
    expect(api.getTrack('book-a', 'unit-1', 't-2')?.file).toBe('sample/two.mp3')
  })

  it('returns undefined for unknown ids', () => {
    expect(api.getBook('nope')).toBeUndefined()
    expect(api.getUnit('book-a', 'nope')).toBeUndefined()
    expect(api.getUnit('nope', 'unit-1')).toBeUndefined()
    expect(api.getTrack('book-a', 'unit-1', 'nope')).toBeUndefined()
  })

  it('preserves label verbatim', () => {
    expect(api.getTrack('book-a', 'unit-1', 't-12a')?.label).toBe('12a')
  })

  it('getSiblings returns prev/next within a unit only', () => {
    expect(api.getSiblings('book-a', 'unit-1', 't-2')).toEqual({
      prev: expect.objectContaining({ id: 't-1' }),
      next: expect.objectContaining({ id: 't-12a' }),
    })
    expect(api.getSiblings('book-a', 'unit-1', 't-1').prev).toBeUndefined()
    expect(api.getSiblings('book-a', 'unit-1', 't-12a').next).toBeUndefined()
    expect(api.getSiblings('book-a', 'unit-2', 't-1')).toEqual({ prev: undefined, next: undefined })
  })

  it('booksByLevel preserves array order', () => {
    const groups = api.booksByLevel()
    expect(groups.map((g) => g.level.id)).toEqual(['level-1', 'level-2'])
    expect(groups[0]?.books.map((b) => b.id)).toEqual(['book-a', 'book-b'])
  })
})
