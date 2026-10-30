import { createHash, timingSafeEqual } from 'node:crypto'
import { getStore } from '@netlify/blobs'
import { decodeKey, type UsageEvent } from './lib/schema'

const DAY = /^\d{4}-\d{2}-\d{2}$/
const MAX_DAYS = 366
const MS_PER_DAY = 86_400_000
const headers = { 'Cache-Control': 'no-store' }

const fail = (status: number) => new Response(null, { status, headers })

function authorized(req: Request): boolean {
  const token = process.env.ANALYTICS_REPORT_TOKEN
  const given = /^Bearer (.+)$/.exec(req.headers.get('authorization') ?? '')?.[1]
  if (!token || !given) return false
  // Hash both sides so the comparison is constant-time regardless of length.
  const digest = (v: string) => createHash('sha256').update(v).digest()
  return timingSafeEqual(digest(given), digest(token))
}

function parseDay(value: string | null): number | null {
  if (!value || !DAY.test(value)) return null
  const ms = Date.parse(`${value}T00:00:00Z`)
  return Number.isNaN(ms) || new Date(ms).toISOString().slice(0, 10) !== value ? null : ms
}

const bump = (counts: Record<string, number>, key: string) => {
  counts[key] = (counts[key] ?? 0) + 1
}

export default async function report(req: Request): Promise<Response> {
  if (req.method !== 'GET') return fail(405)
  if (!authorized(req)) return fail(401)

  const params = new URL(req.url).searchParams
  const from = parseDay(params.get('from'))
  const to = parseDay(params.get('to'))
  if (from === null || to === null || to < from || (to - from) / MS_PER_DAY + 1 > MAX_DAYS) return fail(400)

  const store = getStore('analytics')
  const days: string[] = []
  for (let ms = from; ms <= to; ms += MS_PER_DAY) days.push(new Date(ms).toISOString().slice(0, 10))
  const listings = await Promise.all(days.map((day) => store.list({ prefix: `${day}/` })))

  const events: UsageEvent[] = []
  for (const { blobs } of listings) {
    for (const { key } of blobs) {
      const decoded = decodeKey(key)
      if (decoded) events.push(decoded.event)
    }
  }

  const visits = { total: 0, byLang: {}, byDevice: {}, byLangDevice: {} }
  const trackStarts = { total: 0, bySource: {}, byTrack: [] as { level: string; bookType: string; unit: string; track: string; count: number }[] }
  const languageChanges = { total: 0, byLang: {} }
  const errors = { total: 0, byType: {} }
  let resumeUsed = 0
  const perTrack = new Map<string, (typeof trackStarts.byTrack)[number]>()

  for (const e of events) {
    if (e.type === 'visit') {
      visits.total++
      bump(visits.byLang, e.lang)
      bump(visits.byDevice, e.device)
      bump(visits.byLangDevice, `${e.lang}/${e.device}`)
    } else if (e.type === 'track_started') {
      trackStarts.total++
      bump(trackStarts.bySource, e.label!)
      const { level, bookType, unit, track } = e
      const id = `${level}/${bookType}/${unit}/${track}`
      const row = perTrack.get(id) ?? { level: level!, bookType: bookType!, unit: unit!, track: track!, count: 0 }
      row.count++
      perTrack.set(id, row)
    } else if (e.type === 'resume_used') {
      resumeUsed++
    } else if (e.type === 'language_changed') {
      languageChanges.total++
      bump(languageChanges.byLang, e.lang)
    } else {
      errors.total++
      bump(errors.byType, e.label!)
    }
  }
  trackStarts.byTrack = [...perTrack.values()].sort((a, b) => b.count - a.count)

  const body = {
    from: params.get('from'),
    to: params.get('to'),
    visits,
    trackStarts,
    resumeUsed,
    languageChanges,
    errors,
  }
  return new Response(JSON.stringify(body), { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } })
}
