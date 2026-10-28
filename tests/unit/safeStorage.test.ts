import { describe, it, expect, afterEach, vi } from 'vitest'
import { safeStorage } from '../../src/storage/safeStorage'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('safeStorage', () => {
  it('gets, sets and removes', () => {
    expect(safeStorage.getItem('k')).toBeNull()
    safeStorage.setItem('k', 'v')
    expect(safeStorage.getItem('k')).toBe('v')
    safeStorage.removeItem('k')
    expect(safeStorage.getItem('k')).toBeNull()
  })

  it('swallows write errors', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    expect(() => safeStorage.setItem('k', 'v')).not.toThrow()
  })

  it('returns null when access throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(safeStorage.getItem('k')).toBeNull()
  })

  it('swallows remove errors', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => safeStorage.removeItem('k')).not.toThrow()
  })
})
