import { detectDevice, trackingAllowed, type UsageEvent } from './events'

type Event = Omit<UsageEvent, 'lang' | 'device'>

const VISIT_KEY = 'pe.visit'
const ERRORS_KEY = 'pe.errs'

const memory = new Set<string>()

function endpoint(): string | undefined {
  const url = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined
  if (!url || typeof navigator === 'undefined') return undefined
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  const win = window as Window & { doNotTrack?: string | null }
  return trackingAllowed({ VITE_ANALYTICS_ENDPOINT: url }, nav, win) ? url : undefined
}

function send(url: string, body: string) {
  try {
    if (navigator.sendBeacon?.(url, new Blob([body], { type: 'text/plain' }))) return
  } catch {
    // fall through to fetch
  }
  void fetch(url, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {})
}

/** Fire and forget: never awaited, never throws, does nothing unless tracking is allowed. */
export function track(event: Event, lang: string): void {
  try {
    const url = endpoint()
    if (!url) return
    const device = detectDevice(navigator.userAgent)
    const { type, ...rest } = event
    send(url, JSON.stringify({ type, lang, device, ...rest }))
  } catch {
    // analytics must never affect the app
  }
}

/** True the first time a key is seen in this tab session. Falls back to memory when sessionStorage is blocked. */
function firstTime(key: string): boolean {
  try {
    if (key === 'visit') {
      if (sessionStorage.getItem(VISIT_KEY)) return false
      sessionStorage.setItem(VISIT_KEY, '1')
      return true
    }
    const seen: unknown = JSON.parse(sessionStorage.getItem(ERRORS_KEY) ?? '[]')
    const list = Array.isArray(seen) ? (seen as string[]) : []
    if (list.includes(key)) return false
    sessionStorage.setItem(ERRORS_KEY, JSON.stringify([...list, key]))
    return true
  } catch {
    if (memory.has(key)) return false
    memory.add(key)
    return true
  }
}

/** `track` once per tab session for `key` ('visit', or `type|trackKey` for errors). */
export function trackOncePerSession(key: string, event: Event, lang: string): void {
  try {
    if (!endpoint() || !firstTime(key)) return
    track(event, lang)
  } catch {
    // analytics must never affect the app
  }
}
