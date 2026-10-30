import { describe, it, expect } from 'vitest'
import { decodeKey, encodeKey, validateEvent } from '../../netlify/functions/lib/schema'

const visit = { type: 'visit', lang: 'es', device: 'mobile' }
const started = {
  type: 'track_started',
  lang: 'en',
  device: 'desktop',
  label: 'scan',
  level: 'level-1',
  bookType: 'textbook',
  unit: 'unit-1',
  track: 'track-2',
}
const scanFailure = { type: 'error', lang: 'en', device: 'mobile', label: 'scan-failure' }

describe('validateEvent', () => {
  it.each([
    visit,
    started,
    scanFailure,
    { type: 'resume_used', lang: 'en', device: 'mobile' },
    { type: 'language_changed', lang: 'es', device: 'desktop' },
    { ...scanFailure, label: 'playback-failure', level: 'level-1', bookType: 'workbook', unit: 'unit-3', track: 't-12a' },
  ])('accepts %j', (event) => {
    expect(validateEvent(event)).toEqual(event)
  })

  it.each([
    ['unknown field', { ...visit, ua: 'Mozilla' }],
    ['non-object', 'visit'],
    ['null', null],
    ['unknown type', { ...visit, type: 'click' }],
    ['unknown device', { ...visit, device: 'tablet' }],
    ['bad lang', { ...visit, lang: 'EN' }],
    ['missing lang', { type: 'visit', device: 'mobile' }],
    ['label on a visit', { ...visit, label: 'scan' }],
    ['ids on a visit', { ...visit, level: 'level-1' }],
    ['track_started without label', { ...started, label: undefined }],
    ['track_started with an error label', { ...started, label: 'scan-failure' }],
    ['track_started without ids', { type: 'track_started', lang: 'en', device: 'mobile', label: 'scan' }],
    ['playback-failure without ids', { ...scanFailure, label: 'playback-failure' }],
    ['scan-failure with ids', { ...scanFailure, level: 'level-1', bookType: 'textbook', unit: 'u', track: 't' }],
    ['error with a track label', { ...scanFailure, label: 'scan' }],
    ['id with upper case', { ...started, track: 'Track-2' }],
    ['id with a slash', { ...started, unit: 'unit/1' }],
    ['id with a tilde', { ...started, unit: 'unit~1' }],
    ['id of just a dash', { ...started, unit: '-' }],
    ['id over 40 chars', { ...started, track: 'a'.repeat(41) }],
    ['unknown book type', { ...started, bookType: 'reader' }],
    ['body over 1 KB', { ...started, track: 'a'.repeat(40), pad: 'x'.repeat(1100) }],
  ])('rejects %s', (_name, event) => {
    expect(validateEvent(event)).toBeNull()
  })

  it('rejects a valid event padded past 1 KB', () => {
    const big = { ...visit, lang: 'en' }
    expect(JSON.stringify(big).length).toBeLessThan(1024)
    expect(validateEvent(big)).not.toBeNull()
    expect(validateEvent({ ...big, extra: 'x'.repeat(1024) })).toBeNull()
  })
})

describe('encodeKey / decodeKey', () => {
  const uuid = '3f2b8c1e-0000-4000-8000-000000000000'

  it('encodes day, dimensions (- for unused slots) and uuid', () => {
    expect(encodeKey(visit as never, '2026-10-29', uuid)).toBe(`2026-10-29/visit~es~mobile~-~-~-~-~-/${uuid}`)
    expect(encodeKey(started as never, '2026-10-29', uuid)).toBe(
      `2026-10-29/track_started~en~desktop~scan~level-1~textbook~unit-1~track-2/${uuid}`,
    )
  })

  it.each([visit, started, scanFailure])('round-trips %j', (event) => {
    const key = encodeKey(event as never, '2026-10-29', uuid)
    expect(decodeKey(key)).toEqual({ date: '2026-10-29', event, uuid })
  })

  it.each(['', 'garbage', '2026-10-29/visit~es/abc', '2026-10-29/nope~es~mobile~-~-~-~-~-/u', '29-10-2026/visit~es~mobile~-~-~-~-~-/u'])(
    'returns null for %j',
    (key) => {
      expect(decodeKey(key)).toBeNull()
    },
  )
})
