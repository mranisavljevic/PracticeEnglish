import { afterEach, describe, expect, it } from 'vitest'
import { ensureGa, sendEvent } from '../../src/analytics/ga'
import { restoreEvents } from '../helpers/analytics'

afterEach(restoreEvents)

const scripts = () => document.head.querySelectorAll('script[src*="googletagmanager.com/gtag/js"]')
const queue = () => (window.dataLayer ?? []).map((a) => Array.from(a as ArrayLike<unknown>))

describe('ensureGa', () => {
  it('defines dataLayer and gtag, configures the stream privately and appends the script once', () => {
    ensureGa('G-TEST123')
    ensureGa('G-TEST123')
    expect(typeof window.gtag).toBe('function')
    expect(scripts()).toHaveLength(1)
    const script = scripts()[0] as HTMLScriptElement
    expect(script.src).toBe('https://www.googletagmanager.com/gtag/js?id=G-TEST123')
    expect(script.async).toBe(true)
    const configs = queue().filter((c) => c[0] === 'config')
    expect(configs).toEqual([
      [
        'config',
        'G-TEST123',
        { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, cookie_expires: 5184000 },
      ],
    ])
  })

  it('does nothing for an invalid id', () => {
    ensureGa('not-an-id')
    expect(scripts()).toHaveLength(0)
    expect(window.gtag).toBeUndefined()
  })
})

describe('sendEvent', () => {
  const base = { lang: 'es', device: 'desktop' } as const
  const common = { app: 'practice-english', ui_lang: 'es', device_class: 'desktop' }

  it('maps each event type to its GA name and params', () => {
    ensureGa('G-TEST123')
    const ids = { level: 'level-1', bookType: 'workbook', unit: 'unit-2', track: 'track-3' } as const
    sendEvent({ type: 'visit', ...base })
    sendEvent({ type: 'track_started', label: 'scan', ...ids, ...base })
    sendEvent({ type: 'resume_used', ...base })
    sendEvent({ type: 'language_changed', ...base })
    sendEvent({ type: 'error', label: 'playback-failure', ...ids, ...base })
    sendEvent({ type: 'error', label: 'scan-failure', ...base })
    const ids2 = { level: 'level-1', book_type: 'workbook', unit: 'unit-2', track: 'track-3' }
    expect(queue().filter((c) => c[0] === 'event')).toEqual([
      ['event', 'visit', common],
      ['event', 'track_started', { ...common, source: 'scan', ...ids2 }],
      ['event', 'resume_used', common],
      ['event', 'language_changed', common],
      ['event', 'error', { ...common, error_type: 'playback-failure', ...ids2 }],
      ['event', 'error', { ...common, error_type: 'scan-failure' }],
    ])
  })

  it('never sends user_id, free text or a user-agent', () => {
    ensureGa('G-TEST123')
    sendEvent({ type: 'visit', ...base })
    const keys = queue().flatMap((c) => (c[0] === 'event' ? Object.keys(c[2] as object) : []))
    expect(keys).not.toEqual(expect.arrayContaining(['user_id']))
    expect(keys.every((k) => ['app', 'ui_lang', 'device_class'].includes(k))).toBe(true)
  })

  it('never throws, even when gtag does', () => {
    window.gtag = () => {
      throw new Error('boom')
    }
    expect(() => sendEvent({ type: 'visit', ...base })).not.toThrow()
    Reflect.deleteProperty(window, 'gtag')
    expect(() => sendEvent({ type: 'visit', ...base })).not.toThrow()
  })
})
