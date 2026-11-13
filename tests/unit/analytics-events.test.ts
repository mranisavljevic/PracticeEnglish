import { describe, it, expect } from 'vitest'
import { detectDevice, privacySignalPresent, trackingAllowed } from '../../src/analytics/events'

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

describe('privacySignalPresent', () => {
  it('is false without a signal', () => {
    expect(privacySignalPresent({})).toBe(false)
    expect(privacySignalPresent({ doNotTrack: '0', globalPrivacyControl: false }, { doNotTrack: null })).toBe(false)
  })

  it('is true for Do Not Track on navigator or window, and for Global Privacy Control', () => {
    expect(privacySignalPresent({ doNotTrack: '1' })).toBe(true)
    expect(privacySignalPresent({}, { doNotTrack: '1' })).toBe(true)
    expect(privacySignalPresent({ globalPrivacyControl: true })).toBe(true)
  })
})

describe('trackingAllowed', () => {
  const env = { VITE_GA_MEASUREMENT_ID: 'G-ABC123' }

  it('is true with a valid id, no privacy signal and granted consent', () => {
    expect(trackingAllowed(env, {}, undefined, 'granted')).toBe(true)
    expect(trackingAllowed(env, { doNotTrack: '0', globalPrivacyControl: false }, { doNotTrack: null }, 'granted')).toBe(true)
  })

  it.each([undefined, '', 'UA-12345-1', 'g-abc123', 'G-abc', 'G-', 'G-AB C'])('is false when the id is %j (dev, tests, previews)', (id) => {
    expect(trackingAllowed({ VITE_GA_MEASUREMENT_ID: id }, {}, undefined, 'granted')).toBe(false)
    expect(trackingAllowed({}, {}, undefined, 'granted')).toBe(false)
  })

  it.each(['unset', 'declined'] as const)('is false while consent is %s', (consent) => {
    expect(trackingAllowed(env, {}, undefined, consent)).toBe(false)
  })

  it('is false with a privacy signal even when consent is granted', () => {
    expect(trackingAllowed(env, { doNotTrack: '1' }, undefined, 'granted')).toBe(false)
    expect(trackingAllowed(env, {}, { doNotTrack: '1' }, 'granted')).toBe(false)
    expect(trackingAllowed(env, { globalPrivacyControl: true }, undefined, 'granted')).toBe(false)
  })
})
