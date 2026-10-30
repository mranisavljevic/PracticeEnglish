import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { track, trackOncePerSession } from '../../src/analytics/track'

let beacon: ReturnType<typeof vi.fn>
let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubEnv('VITE_ANALYTICS_ENDPOINT', '/api/e')
  beacon = vi.fn(() => true)
  fetchMock = vi.fn(() => Promise.resolve(new Response(null, { status: 204 })))
  Object.defineProperty(navigator, 'sendBeacon', { value: beacon, configurable: true, writable: true })
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  sessionStorage.clear()
  Reflect.deleteProperty(navigator, 'doNotTrack')
  Reflect.deleteProperty(navigator, 'globalPrivacyControl')
})

async function bodyOf(call: unknown[]) {
  const blob = call[1] as Blob
  return { url: call[0], type: blob.type, json: JSON.parse(await blob.text()) }
}

describe('track', () => {
  it('sends the event, language and device class as a text/plain beacon', async () => {
    track({ type: 'visit' }, 'es')
    expect(beacon).toHaveBeenCalledTimes(1)
    const { url, type, json } = await bodyOf(beacon.mock.calls[0]!)
    expect(url).toBe('/api/e')
    expect(type).toBe('text/plain')
    expect(json).toEqual({ type: 'visit', lang: 'es', device: 'mobile' })
  })

  it('sends labels and content ids and nothing else (no UA, no timestamp)', async () => {
    track(
      { type: 'track_started', label: 'scan', level: 'level-1', bookType: 'textbook', unit: 'unit-1', track: 'track-2' },
      'en',
    )
    const { json } = await bodyOf(beacon.mock.calls[0]!)
    expect(Object.keys(json).sort()).toEqual(['bookType', 'device', 'label', 'lang', 'level', 'track', 'type', 'unit'])
  })

  it.each([
    ['endpoint unset', () => vi.stubEnv('VITE_ANALYTICS_ENDPOINT', '')],
    ['Do Not Track', () => Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true })],
    ['Global Privacy Control', () => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true })],
  ])('is a no-op with %s', (_name, arrange) => {
    arrange()
    track({ type: 'visit' }, 'en')
    expect(beacon).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to fetch keepalive when sendBeacon is missing', () => {
    Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true, writable: true })
    track({ type: 'visit' }, 'en')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/e')
    expect(init).toMatchObject({ method: 'POST', keepalive: true })
    expect(JSON.parse(init.body)).toEqual({ type: 'visit', lang: 'en', device: 'mobile' })
  })

  it('falls back to fetch keepalive when sendBeacon returns false', () => {
    beacon.mockReturnValue(false)
    track({ type: 'visit' }, 'en')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('never throws when sending throws', () => {
    beacon.mockImplementation(() => {
      throw new Error('boom')
    })
    fetchMock.mockImplementation(() => {
      throw new Error('boom')
    })
    expect(() => track({ type: 'visit' }, 'en')).not.toThrow()
    fetchMock.mockImplementation(() => Promise.reject(new Error('offline')))
    expect(() => track({ type: 'visit' }, 'en')).not.toThrow()
  })

  it('returns synchronously and never awaits the send', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    Object.defineProperty(navigator, 'sendBeacon', { value: undefined, configurable: true, writable: true })
    const result = track({ type: 'visit' }, 'en')
    expect(result).toBeUndefined()
  })
})

describe('trackOncePerSession', () => {
  it('sends once per key and remembers it in sessionStorage', () => {
    trackOncePerSession('visit', { type: 'visit' }, 'en')
    trackOncePerSession('visit', { type: 'visit' }, 'en')
    expect(beacon).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('pe.visit')).toBe('1')
  })

  it('keeps a flag per distinct error key', () => {
    const e = { type: 'error', label: 'unexpected' } as const
    trackOncePerSession('unexpected|', e, 'en')
    trackOncePerSession('unexpected|', e, 'en')
    trackOncePerSession('scan-failure|', { type: 'error', label: 'scan-failure' }, 'en')
    expect(beacon).toHaveBeenCalledTimes(2)
    expect(JSON.parse(sessionStorage.getItem('pe.errs')!)).toEqual(['unexpected|', 'scan-failure|'])
  })

  it('does not send or remember anything while tracking is not allowed', () => {
    vi.stubEnv('VITE_ANALYTICS_ENDPOINT', '')
    trackOncePerSession('visit', { type: 'visit' }, 'en')
    expect(beacon).not.toHaveBeenCalled()
    expect(sessionStorage.getItem('pe.visit')).toBeNull()
  })

  it('falls back to an in-memory set when sessionStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    trackOncePerSession('memory-only', { type: 'visit' }, 'en')
    trackOncePerSession('memory-only', { type: 'visit' }, 'en')
    expect(beacon).toHaveBeenCalledTimes(1)
  })
})
