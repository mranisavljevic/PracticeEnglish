import { describe, it, expect } from 'vitest'
import { createCatalogApi } from '../../src/content/catalog'
import { testCatalog } from '../fixtures/testCatalog'

const api = createCatalogApi(testCatalog)

const withSoon = createCatalogApi({
  ...testCatalog,
  levels: [...testCatalog.levels, { id: 'level-3', title: 'Level 3' }, { id: 'level-4', title: 'Level 4' }],
  comingSoon: [
    { id: 'level-1-workbook', levelId: 'level-1', type: 'workbook', title: 'W1' },
    { id: 'level-3-student-book', levelId: 'level-3', type: 'textbook', title: 'S3' },
  ],
})

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

  it('getBook never returns a placeholder; getComingSoon does', () => {
    expect(withSoon.getBook('level-3-student-book')).toBeUndefined()
    expect(withSoon.getComingSoon('level-3-student-book')?.title).toBe('S3')
    expect(withSoon.getComingSoon('book-a')).toBeUndefined()
    expect(api.getComingSoon('anything')).toBeUndefined()
  })

  it('booksByLevel includes placeholders and keeps levels with either, in level order', () => {
    const groups = withSoon.booksByLevel()
    expect(groups.map((g) => g.level.id)).toEqual(['level-1', 'level-2', 'level-3'])
    expect(groups[0]?.comingSoon.map((b) => b.id)).toEqual(['level-1-workbook'])
    expect(groups[2]?.books).toEqual([])
    expect(groups[2]?.comingSoon.map((b) => b.id)).toEqual(['level-3-student-book'])
  })
})
