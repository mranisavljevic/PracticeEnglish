import { describe, it, expect } from 'vitest'
import { detectDevice, trackingAllowed } from '../../src/analytics/events'

describe('detectDevice', () => {
  it.each([
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
    'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148',
    'Mozilla/5.0 (iPod touch; CPU iPhone OS 15_0 like Mac OS X)',
  ])('mobile: %s', (ua) => {
    expect(detectDevice(ua)).toBe('mobile')
  })

  it.each([
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36',
    'SomethingUnrecognised/1.0',
    '',
    undefined,
  ])('desktop: %j', (ua) => {
    expect(detectDevice(ua)).toBe('desktop')
  })
})

describe('trackingAllowed', () => {
  const env = { VITE_ANALYTICS_ENDPOINT: '/api/e' }

  it('is true with an endpoint and no privacy signal', () => {
    expect(trackingAllowed(env, {})).toBe(true)
    expect(trackingAllowed(env, { doNotTrack: '0', globalPrivacyControl: false }, { doNotTrack: null })).toBe(true)
  })

  it.each([undefined, ''])('is false when the endpoint is %j (dev, tests and previews)', (endpoint) => {
    expect(trackingAllowed({ VITE_ANALYTICS_ENDPOINT: endpoint }, {})).toBe(false)
    expect(trackingAllowed({}, {})).toBe(false)
  })

  it('is false when Do Not Track is on, on navigator or window', () => {
    expect(trackingAllowed(env, { doNotTrack: '1' })).toBe(false)
    expect(trackingAllowed(env, {}, { doNotTrack: '1' })).toBe(false)
  })

  it('is false when Global Privacy Control is on', () => {
    expect(trackingAllowed(env, { globalPrivacyControl: true })).toBe(false)
  })
})
