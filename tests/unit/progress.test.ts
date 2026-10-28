import { describe, it, expect, afterEach, vi } from 'vitest'
import { saveProgress, loadProgress } from '../../src/storage/progress'
import { testCatalog } from '../fixtures/testCatalog'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

const ids = { bookId: 'book-a', unitId: 'unit-1', trackId: 't-2' }

describe('progress', () => {
  it('round-trips and stores only ids (no playback position)', () => {
    saveProgress(ids)
    expect(JSON.parse(localStorage.getItem('pe.progress')!)).toEqual({ v: 1, ...ids })
    expect(loadProgress(testCatalog)).toEqual(ids)
  })

  it('later save overwrites', () => {
    saveProgress(ids)
    saveProgress({ bookId: 'book-a', unitId: 'unit-2', trackId: 't-1' })
    expect(loadProgress(testCatalog)).toEqual({ bookId: 'book-a', unitId: 'unit-2', trackId: 't-1' })
  })

  it('returns null when nothing is stored', () => {
    expect(loadProgress(testCatalog)).toBeNull()
  })

  it.each([
    ['invalid JSON', '{nope'],
    ['wrong version', JSON.stringify({ v: 2, ...ids })],
    ['unknown book', JSON.stringify({ v: 1, ...ids, bookId: 'zzz' })],
    ['unknown unit', JSON.stringify({ v: 1, ...ids, unitId: 'zzz' })],
    ['unknown track', JSON.stringify({ v: 1, ...ids, trackId: 'zzz' })],
    ['not an object', '42'],
    ['missing fields', JSON.stringify({ v: 1, bookId: 'book-a' })],
  ])('ignores %s', (_n, raw) => {
    localStorage.setItem('pe.progress', raw)
    expect(loadProgress(testCatalog)).toBeNull()
  })

  it('does not throw when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => saveProgress(ids)).not.toThrow()
    expect(loadProgress(testCatalog)).toBeNull()
  })
})
