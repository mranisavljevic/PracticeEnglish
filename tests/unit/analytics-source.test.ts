import { describe, expect, it, vi } from 'vitest'
import type { Location } from 'react-router-dom'
import { clearSource, hasSource, readSource, withSource } from '../../src/analytics/source'

describe('readSource', () => {
  it.each(['scan', 'navigation', 'resume', 'repeat', 'next'] as const)('returns %s', (source) => {
    expect(readSource({ source })).toBe(source)
  })

  it.each([undefined, null, {}, { source: 'teleport' }, { source: 7 }, 'scan', []])('falls back to navigation for %j', (state) => {
    expect(readSource(state)).toBe('navigation')
  })
})

describe('withSource / hasSource', () => {
  it('round-trips', () => {
    expect(readSource(withSource('next'))).toBe('next')
    expect(hasSource(withSource('scan'))).toBe(true)
    expect(hasSource(null)).toBe(false)
    expect(hasSource({ source: 'x' })).toBe(false)
  })
})

describe('clearSource', () => {
  it('replaces the current entry with the same location and no state', () => {
    const navigate = vi.fn()
    const location = { pathname: '/b/a/u/1/t/2', search: '', hash: '', state: { source: 'scan' }, key: 'k' } as Location
    clearSource(navigate, location)
    expect(navigate).toHaveBeenCalledWith(location, { replace: true, state: null })
  })
})
