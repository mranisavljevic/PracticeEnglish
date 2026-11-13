import { describe, expect, it } from 'vitest'
import { resolve } from '../../src/scan/resolve'
import catalogJson from '../../src/content/catalog.json'
import type { Catalog } from '../../src/content/catalog'
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

describe('resolve against the Volume 4 Student Book', () => {
  const vol4 = (catalogJson as unknown as Catalog).books.find((b) => b.id === 'level-4-student-book')!

  it('resolves a track number to its unit', () => {
    expect(resolve(vol4, '7')).toEqual({ unitId: 'unit-2', trackId: 'track-7' })
    expect(resolve(vol4, '84')).toEqual({ unitId: 'unit-14', trackId: 'track-84' })
  })

  it('does not resolve the omitted intro track 1', () => {
    expect(resolve(vol4, '1')).toBeUndefined()
  })

  it('resolves nothing, without throwing, for the missing chapter 6 tracks 28-34', () => {
    for (let n = 28; n <= 34; n++) expect(resolve(vol4, String(n))).toBeUndefined()
  })
})
