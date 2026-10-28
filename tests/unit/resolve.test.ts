import { describe, expect, it } from 'vitest'
import { resolve } from '../../src/scan/resolve'
import { testCatalog } from '../fixtures/testCatalog'

const book = testCatalog.books[0]!

describe('resolve', () => {
  it('finds a track in the first unit', () => {
    expect(resolve(book, '2')).toEqual({ unitId: 'unit-1', trackId: 't-2' })
  })

  it('finds a track in any unit of the book', () => {
    const wide = {
      ...book,
      units: [...book.units, { id: 'unit-3', number: '3', title: '', tracks: [{ id: 't-15', label: '15', file: 'x.mp3' }] }],
    }
    expect(resolve(wide, '15')).toEqual({ unitId: 'unit-3', trackId: 't-15' })
  })

  it('returns undefined for numbers not in the book', () => {
    expect(resolve(book, '99')).toBeUndefined()
  })

  it('returns undefined for empty or non-numeric input', () => {
    expect(resolve(book, '')).toBeUndefined()
    expect(resolve(book, 'abc')).toBeUndefined()
    expect(resolve(book, '1a')).toBeUndefined()
  })

  it('does not match tracks omitted from the catalog', () => {
    const withoutTwo = { ...book, units: [{ ...book.units[0]!, tracks: book.units[0]!.tracks.filter((t) => t.label !== '2') }] }
    expect(resolve(withoutTwo, '2')).toBeUndefined()
  })
})
