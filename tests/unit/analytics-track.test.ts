import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setConsent } from '../../src/analytics/consent'
import { track, trackOncePerSession } from '../../src/analytics/track'
import { restoreEvents } from '../helpers/analytics'

const queue = () => (window.dataLayer ?? []).map((a) => Array.from(a as ArrayLike<unknown>))
const events = () => queue().filter((c) => c[0] === 'event')
const scripts = () => document.head.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')

beforeEach(() => {
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
  localStorage.setItem('pe.consent', 'granted')
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148')
})
afterEach(restoreEvents)

describe('track', () => {
  it('loads GA on the first allowed call, then sends the mapped event', () => {
    expect(scripts()).toHaveLength(0)
    track({ type: 'visit' }, 'es')
    track({ type: 'resume_used' }, 'es')
    expect(scripts()).toHaveLength(1)
    expect(events()).toEqual([
      ['event', 'visit', { app: 'practice-english', ui_lang: 'es', device_class: 'mobile' }],
      ['event', 'resume_used', { app: 'practice-english', ui_lang: 'es', device_class: 'mobile' }],
    ])
  })

  it('sends labels and content ids under their GA names and nothing else', () => {
    track({ type: 'track_started', label: 'scan', level: 'level-1', bookType: 'textbook', unit: 'unit-1', track: 'track-2' }, 'en')
    expect(Object.keys(events()[0]![2] as object).sort()).toEqual([
      'app', 'book_type', 'device_class', 'level', 'source', 'track', 'ui_lang', 'unit',
    ])
  })

  it.each([
    ['id unset', () => vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')],
    ['consent unset', () => localStorage.clear()],
    ['consent declined', () => localStorage.setItem('pe.consent', 'declined')],
    ['Do Not Track', () => Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true })],
    ['Global Privacy Control', () => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true })],
  ])('is a no-op with %s and loads nothing from Google', (_name, arrange) => {
    arrange()
    track({ type: 'visit' }, 'en')
    expect(scripts()).toHaveLength(0)
    expect(window.dataLayer).toBeUndefined()
  })

  it('re-checks the gate on every call, so a privacy signal appearing mid-session stops events', () => {
    track({ type: 'visit' }, 'en')
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true })
    track({ type: 'resume_used' }, 'en')
    expect(events().map((e) => e[1])).toEqual(['visit'])
  })

  it('stops after the learner declines', () => {
    track({ type: 'visit' }, 'en')
    setConsent('declined')
    track({ type: 'resume_used' }, 'en')
    expect(events().map((e) => e[1])).toEqual(['visit'])
  })

  it('never throws and never awaits', () => {
    window.gtag = () => {
      throw new Error('boom')
    }
    expect(track({ type: 'visit' }, 'en')).toBeUndefined()
  })
})

describe('trackOncePerSession', () => {
  it('sends once per key and remembers it in sessionStorage', () => {
    trackOncePerSession('visit', { type: 'visit' }, 'en')
    trackOncePerSession('visit', { type: 'visit' }, 'en')
    expect(events()).toHaveLength(1)
    expect(sessionStorage.getItem('pe.visit')).toBe('1')
  })

  it('keeps a flag per distinct error key', () => {
    const e = { type: 'error', label: 'unexpected' } as const
    trackOncePerSession('unexpected|', e, 'en')
    trackOncePerSession('unexpected|', e, 'en')
    trackOncePerSession('scan-failure|', { type: 'error', label: 'scan-failure' }, 'en')
    expect(events()).toHaveLength(2)
    expect(JSON.parse(sessionStorage.getItem('pe.errs')!)).toEqual(['unexpected|', 'scan-failure|'])
  })

  it('does not send or set its flag while blocked, so the visit goes out after opt-in', () => {
    localStorage.clear()
    trackOncePerSession('visit', { type: 'visit' }, 'en')
    expect(events()).toEqual([])
    expect(sessionStorage.getItem('pe.visit')).toBeNull()
    setConsent('granted')
    trackOncePerSession('visit', { type: 'visit' }, 'en')
    expect(events()).toHaveLength(1)
    expect(sessionStorage.getItem('pe.visit')).toBe('1')
  })

  it('falls back to an in-memory set when sessionStorage throws', () => {
    setConsent('granted')
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    trackOncePerSession('memory-only', { type: 'visit' }, 'en')
    trackOncePerSession('memory-only', { type: 'visit' }, 'en')
    expect(events()).toHaveLength(1)
  })
})
