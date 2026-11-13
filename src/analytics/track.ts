import { getConsent } from './consent'
import { detectDevice, trackingAllowed, type UsageEvent } from './events'
import { ensureGa, sendEvent } from './ga'

type Event = Omit<UsageEvent, 'lang' | 'device'>

const VISIT_KEY = 'pe.visit'
const ERRORS_KEY = 'pe.errs'

const memory = new Set<string>()

/** The measurement id when tracking is allowed right now. Re-checked on every call so a changed signal or choice takes effect at once. */
function allowedId(): string | undefined {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
  if (!id || typeof navigator === 'undefined') return undefined
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  const win = window as Window & { doNotTrack?: string | null }
  return trackingAllowed({ VITE_GA_MEASUREMENT_ID: id }, nav, win, getConsent()) ? id : undefined
}

/** Fire and forget: never awaited, never throws, does nothing unless tracking is allowed. */
export function track(event: Event, lang: string): void {
  try {
    const id = allowedId()
    if (!id) return
    ensureGa(id)
    sendEvent({ ...event, lang, device: detectDevice(navigator.userAgent) })
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
    if (!allowedId() || !firstTime(key)) return
    track(event, lang)
  } catch {
    // analytics must never affect the app
  }
}
