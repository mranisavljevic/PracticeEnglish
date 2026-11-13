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
    expect(isSupported('fr')).toBe(true)
    expect(isSupported('de')).toBe(false)
  })

  it('saved pe.lang wins if registered', () => {
    localStorage.setItem('pe.lang', 'en')
    setNavigator(['es-MX'])
    expect(detectLanguage()).toBe('en')
  })

  it('uses first supported primary subtag of navigator.languages', () => {
    setNavigator(['de-DE', 'fr-FR', 'es-MX'])
    expect(detectLanguage()).toBe('fr')
  })

  it.each(['fr', 'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH'])('detects %s as fr with no saved value', (tag) => {
    setNavigator([tag])
    expect(detectLanguage()).toBe('fr')
  })

  it('saved es wins over a French browser', () => {
    localStorage.setItem('pe.lang', 'es')
    setNavigator(['fr-CA'])
    expect(detectLanguage()).toBe('es')
  })

  it('saved fr wins over a Spanish browser', () => {
    localStorage.setItem('pe.lang', 'fr')
    setNavigator(['es-MX'])
    expect(detectLanguage()).toBe('fr')
  })

  it('falls back to en when unsupported', () => {
    setNavigator(['de-DE', 'it'])
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
