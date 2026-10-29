import { beforeEach, describe, expect, it, vi } from 'vitest'

const set = vi.fn(async () => {})
vi.mock('@netlify/blobs', () => ({ getStore: vi.fn(() => ({ set })) }))

import { getStore } from '@netlify/blobs'
import collect from '../../netlify/functions/collect'

beforeEach(() => {
  set.mockClear()
  vi.useRealTimers()
})

const post = (body: unknown, method = 'POST') =>
  new Request('https://example.test/api/e', { method, body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body) })

describe('collect', () => {
  it('stores one empty blob under the encoded key and answers 204', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-29T23:59:00Z'))
    const res = await collect(post({ type: 'visit', lang: 'es', device: 'mobile' }))
    expect(res.status).toBe(204)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(getStore).toHaveBeenCalledWith('analytics')
    expect(set).toHaveBeenCalledTimes(1)
    const [key, value] = set.mock.calls[0] as unknown as [string, string]
    expect(key).toMatch(/^2026-10-29\/visit~es~mobile~-~-~-~-~-\/[0-9a-f-]{36}$/)
    expect(value).toBe('')
  })

  it('accepts a text/plain beacon body with content ids', async () => {
    const res = await collect(
      post({ type: 'track_started', lang: 'en', device: 'desktop', label: 'scan', level: 'level-1', bookType: 'textbook', unit: 'unit-1', track: 'track-2' }),
    )
    expect(res.status).toBe(204)
    expect((set.mock.calls[0] as unknown as [string])[0]).toContain('track_started~en~desktop~scan~level-1~textbook~unit-1~track-2')
  })

  it.each([
    ['unknown field', { type: 'visit', lang: 'en', device: 'mobile', ua: 'x' }],
    ['missing ids', { type: 'error', lang: 'en', device: 'mobile', label: 'playback-failure' }],
    ['not JSON', 'not json'],
    ['over 1 KB', 'x'.repeat(2000)],
  ])('answers 400 and stores nothing for %s', async (_name, body) => {
    const res = await collect(post(body))
    expect(res.status).toBe(400)
    expect(set).not.toHaveBeenCalled()
  })

  it('answers 405 for non-POST and stores nothing', async () => {
    const res = await collect(post(null, 'GET'))
    expect(res.status).toBe(405)
    expect(set).not.toHaveBeenCalled()
  })

  it('never reads request headers', async () => {
    const read: string[] = []
    const headers = new Proxy({}, {
      get(_t, prop) {
        read.push(String(prop))
        return () => null
      },
    })
    const req = {
      method: 'POST',
      headers,
      text: async () => JSON.stringify({ type: 'visit', lang: 'en', device: 'mobile' }),
    } as unknown as Request
    const res = await collect(req)
    expect(res.status).toBe(204)
    expect(read).toEqual([])
  })
})
