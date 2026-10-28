import { describe, expect, it } from 'vitest'
import { initialReading, reduceReading, type ReadingState } from '../../src/scan/stability'

const feed = (readings: Array<{ number: string; confidence: number } | null>, from: ReadingState = initialReading) =>
  readings.reduce(reduceReading, from)

describe('reduceReading', () => {
  it('shows nothing after a single reading', () => {
    expect(feed([{ number: '15', confidence: 90 }]).shown).toBeNull()
  })

  it('shows a number read in two consecutive frames', () => {
    expect(feed([{ number: '15', confidence: 90 }, { number: '15', confidence: 80 }]).shown).toBe('15')
  })

  it('ignores readings below the confidence floor', () => {
    const state = feed([{ number: '15', confidence: 60 }, { number: '15', confidence: 65 }])
    expect(state.shown).toBeNull()
  })

  it('does not change state on low-confidence or empty readings', () => {
    const shown = feed([{ number: '15', confidence: 90 }, { number: '15', confidence: 90 }])
    expect(feed([{ number: '99', confidence: 10 }, null], shown)).toEqual(shown)
  })

  it('does not accept two different numbers as stable', () => {
    expect(feed([{ number: '15', confidence: 90 }, { number: '16', confidence: 90 }]).shown).toBeNull()
  })

  it('replaces the displayed number once a different one is stable', () => {
    const state = feed([
      { number: '15', confidence: 90 },
      { number: '15', confidence: 90 },
      { number: '16', confidence: 90 },
      { number: '16', confidence: 90 },
    ])
    expect(state.shown).toBe('16')
  })

  it('keeps the displayed number while a different one is only seen once', () => {
    const state = feed([
      { number: '15', confidence: 90 },
      { number: '15', confidence: 90 },
      { number: '16', confidence: 90 },
    ])
    expect(state.shown).toBe('15')
  })
})
