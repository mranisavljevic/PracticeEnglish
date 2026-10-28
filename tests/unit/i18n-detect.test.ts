import { describe, it, expect, afterEach, vi } from 'vitest'
import { detectLanguage, isSupported } from '../../src/i18n'

function setNavigator(langs: string[]) {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(langs)
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('language selection', () => {
  it('isSupported checks registered locales', () => {
    expect(isSupported('es')).toBe(true)
    expect(isSupported('fr')).toBe(false)
  })

  it('saved pe.lang wins if registered', () => {
    localStorage.setItem('pe.lang', 'en')
    setNavigator(['es-MX'])
    expect(detectLanguage()).toBe('en')
  })

  it('uses first supported primary subtag of navigator.languages', () => {
    setNavigator(['fr-FR', 'es-MX', 'en-US'])
    expect(detectLanguage()).toBe('es')
  })

  it('falls back to en when unsupported', () => {
    setNavigator(['fr-FR', 'de'])
    expect(detectLanguage()).toBe('en')
  })

  it('ignores an invalid saved value', () => {
    localStorage.setItem('pe.lang', 'klingon')
    setNavigator(['es'])
    expect(detectLanguage()).toBe('es')
  })

  it('still detects when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    setNavigator(['es-AR'])
    expect(detectLanguage()).toBe('es')
  })
})
