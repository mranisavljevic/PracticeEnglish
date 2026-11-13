import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getConsent, promptVisible, reopenPrompt, setConsent, settingsAvailable, subscribe } from '../../src/analytics/consent'

beforeEach(() => {
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
  localStorage.clear()
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  localStorage.clear()
  Reflect.deleteProperty(navigator, 'doNotTrack')
  Reflect.deleteProperty(navigator, 'globalPrivacyControl')
  document.cookie.split(';').forEach((c) => {
    document.cookie = `${c.split('=')[0]!.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  })
})

describe('getConsent', () => {
  it('is unset when nothing is stored, and ignores junk values', () => {
    expect(getConsent()).toBe('unset')
    localStorage.setItem('pe.consent', 'maybe')
    expect(getConsent()).toBe('unset')
  })

  it('reads granted and declined', () => {
    localStorage.setItem('pe.consent', 'granted')
    expect(getConsent()).toBe('granted')
    localStorage.setItem('pe.consent', 'declined')
    expect(getConsent()).toBe('declined')
  })

  it('is granted when the prompt is switched off', () => {
    vi.stubEnv('VITE_CONSENT_PROMPT', 'off')
    expect(getConsent()).toBe('granted')
    localStorage.setItem('pe.consent', 'declined')
    expect(getConsent()).toBe('granted')
  })

  it('falls back to memory when localStorage is blocked, without throwing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => setConsent('granted')).not.toThrow()
    expect(getConsent()).toBe('granted')
    expect(() => setConsent('declined')).not.toThrow()
    expect(getConsent()).toBe('declined')
  })
})

describe('setConsent', () => {
  it('persists the choice and notifies subscribers until they unsubscribe', () => {
    const listener = vi.fn()
    const off = subscribe(listener)
    setConsent('granted')
    expect(localStorage.getItem('pe.consent')).toBe('granted')
    expect(listener).toHaveBeenCalledTimes(1)
    off()
    setConsent('declined')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(getConsent()).toBe('declined')
  })

  it('declining deletes _ga cookies and leaves others alone', () => {
    document.cookie = '_ga=GA1.1.123; path=/'
    document.cookie = '_ga_TEST123=GS1; path=/'
    document.cookie = 'keep=1; path=/'
    setConsent('declined')
    expect(document.cookie).not.toContain('_ga')
    expect(document.cookie).toContain('keep=1')
  })
})

describe('promptVisible', () => {
  it('is true only when unset, the prompt is on, an id is configured and there is no privacy signal', () => {
    expect(promptVisible()).toBe(true)
    setConsent('granted')
    expect(promptVisible()).toBe(false)
    localStorage.clear()
    vi.stubEnv('VITE_CONSENT_PROMPT', 'off')
    expect(promptVisible()).toBe(false)
    vi.unstubAllEnvs()
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')
    expect(promptVisible()).toBe(false)
  })

  it.each([
    ['Do Not Track', () => Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true })],
    ['Global Privacy Control', () => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true })],
  ])('is false with %s', (_n, arrange) => {
    arrange()
    expect(promptVisible()).toBe(false)
    expect(settingsAvailable()).toBe(false)
  })

  it('reopenPrompt shows it again after a choice until the next choice', () => {
    setConsent('granted')
    reopenPrompt()
    expect(promptVisible()).toBe(true)
    setConsent('declined')
    expect(promptVisible()).toBe(false)
  })
})
