import { describe, expect, it } from 'vitest'
import { pickBadge, type BadgeCandidate } from '../../src/scan/badges'

function candidate(distance: number, relWidth = 0.2): BadgeCandidate {
  return {
    box: { x: 0, y: 0, w: 100, h: 50 },
    distance,
    relWidth,
    crop: { data: new Uint8ClampedArray(4), width: 1, height: 1 },
  }
}

describe('pickBadge', () => {
  it('returns none for no candidates', () => {
    expect(pickBadge([])).toEqual({ kind: 'none' })
  })

  it('picks the candidate nearest the centre', () => {
    const near = candidate(0.05)
    const far = candidate(0.2)
    expect(pickBadge([far, near])).toEqual({ kind: 'badge', candidate: near })
  })

  it('reports ambiguous when the runner-up is within 1.15x the best distance', () => {
    expect(pickBadge([candidate(0.1), candidate(0.114)])).toEqual({ kind: 'ambiguous' })
  })

  it('does not report ambiguous just beyond 1.15x', () => {
    expect(pickBadge([candidate(0.1), candidate(0.12)]).kind).toBe('badge')
  })

  it('returns none when the winner is beyond the max radius', () => {
    expect(pickBadge([candidate(0.6)])).toEqual({ kind: 'none' })
  })

  it('returns tooSmall for a candidate narrower than the minimum width', () => {
    expect(pickBadge([candidate(0.05, 0.02)])).toEqual({ kind: 'tooSmall' })
  })
})
