import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { encodeKey } from '../../netlify/functions/lib/schema'

const keys = new Map<string, string[]>()
const list = vi.fn(async ({ prefix }: { prefix: string }) => ({
  blobs: (keys.get(prefix.replace(/\/$/, '')) ?? []).map((key) => ({ key, etag: 'x' })),
}))
vi.mock('@netlify/blobs', () => ({ getStore: vi.fn(() => ({ list })) }))

import report from '../../netlify/functions/report'

const TOKEN = 'secret-token'
const ev = (date: string, event: Parameters<typeof encodeKey>[0], n = 1) =>
  Array.from({ length: n }, (_, i) => encodeKey(event, date, `uuid-${date}-${event.type}-${event.label ?? ''}-${event.track ?? ''}-${i}`))

beforeEach(() => {
  vi.stubEnv('ANALYTICS_REPORT_TOKEN', TOKEN)
  keys.clear()
  list.mockClear()
})
afterEach(() => vi.unstubAllEnvs())

const get = (query: string, token: string | null = TOKEN) =>
  report(new Request(`https://example.test/api/report?${query}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }))

describe('report', () => {
  it('answers 401 without the correct token', async () => {
    expect((await get('from=2026-10-01&to=2026-10-02', null)).status).toBe(401)
    expect((await get('from=2026-10-01&to=2026-10-02', 'wrong')).status).toBe(401)
    expect((await get('from=2026-10-01&to=2026-10-02', 'secret-token-longer')).status).toBe(401)
  })

  it('answers 401 when no token is configured, even for an empty bearer', async () => {
    vi.stubEnv('ANALYTICS_REPORT_TOKEN', '')
    expect((await get('from=2026-10-01&to=2026-10-02', '')).status).toBe(401)
  })

  it('answers 405 for non-GET', async () => {
    const res = await report(new Request('https://example.test/api/report', { method: 'POST' }))
    expect(res.status).toBe(405)
  })

  it.each([
    ['to before from', 'from=2026-10-05&to=2026-10-01'],
    ['bad date', 'from=2026-13-01&to=2026-10-01'],
    ['non-date', 'from=yesterday&to=today'],
    ['missing dates', ''],
    ['range over 366 days', 'from=2025-01-01&to=2026-10-01'],
  ])('answers 400 for %s', async (_name, query) => {
    expect((await get(query)).status).toBe(400)
  })

  it('aggregates keys within the range into the report shape', async () => {
    const m = { lang: 'en', device: 'mobile' } as const
    const d = { lang: 'es', device: 'desktop' } as const
    const ids = { level: 'level-1', bookType: 'textbook', unit: 'unit-1' } as const
    keys.set('2026-10-01', [
      ...ev('2026-10-01', { type: 'visit', ...m }, 2),
      ...ev('2026-10-01', { type: 'visit', ...d }),
      ...ev('2026-10-01', { type: 'track_started', ...m, label: 'scan', ...ids, track: 'track-1' }, 2),
      ...ev('2026-10-01', { type: 'resume_used', ...m }),
    ])
    keys.set('2026-10-02', [
      ...ev('2026-10-02', { type: 'track_started', ...d, label: 'navigation', ...ids, track: 'track-1' }),
      ...ev('2026-10-02', { type: 'track_started', ...d, label: 'repeat', ...ids, track: 'track-2' }),
      ...ev('2026-10-02', { type: 'language_changed', ...d }),
      ...ev('2026-10-02', { type: 'error', ...m, label: 'scan-failure' }),
      'junk-key-that-is-ignored',
    ])
    keys.set('2026-10-03', ev('2026-10-03', { type: 'visit', ...m }, 5))

    const res = await get('from=2026-10-01&to=2026-10-02')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    const body = await res.json()

    expect(body).toEqual({
      from: '2026-10-01',
      to: '2026-10-02',
      visits: {
        total: 3,
        byLang: { en: 2, es: 1 },
        byDevice: { mobile: 2, desktop: 1 },
        byLangDevice: { 'en/mobile': 2, 'es/desktop': 1 },
      },
      trackStarts: {
        total: 4,
        bySource: { scan: 2, navigation: 1, repeat: 1 },
        byTrack: [
          { level: 'level-1', bookType: 'textbook', unit: 'unit-1', track: 'track-1', count: 3 },
          { level: 'level-1', bookType: 'textbook', unit: 'unit-1', track: 'track-2', count: 1 },
        ],
      },
      resumeUsed: 1,
      languageChanges: { total: 1, byLang: { es: 1 } },
      errors: { total: 1, byType: { 'scan-failure': 1 } },
    })
    expect(list).toHaveBeenCalledTimes(2)
  })
})
