import { vi } from 'vitest'

type GtagCall = [string, string, Record<string, string>]

/** Turns analytics on (test measurement id, consent granted) and records every gtag('event', …) call. Call restoreEvents() in afterEach. */
export function captureEvents(ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148') {
  vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123')
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua)
  localStorage.setItem('pe.consent', 'granted')
  const gtag = vi.fn()
  window.gtag = gtag as unknown as Window['gtag']
  window.dataLayer = []
  return {
    gtag,
    /** The events sent so far, as `{ type, ...params }` (params use the GA names). */
    async events() {
      await new Promise((r) => setTimeout(r, 0))
      return (gtag.mock.calls as unknown[][])
        .filter((c): c is GtagCall => c[0] === 'event')
        .map(([, type, params]): { type: string } & Record<string, string> => ({ ...params, type }))
    },
  }
}

export function restoreEvents() {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  sessionStorage.clear()
  localStorage.clear()
  Reflect.deleteProperty(window, 'gtag')
  Reflect.deleteProperty(window, 'dataLayer')
  Reflect.deleteProperty(navigator, 'doNotTrack')
  Reflect.deleteProperty(navigator, 'globalPrivacyControl')
  document.head.querySelectorAll('script[src*="googletagmanager.com"]').forEach((s) => s.remove())
}

/** The GA parameters every event carries, for expected-event literals. */
export const common = (ui_lang = 'en', device_class = 'mobile') => ({ app: 'practice-english', ui_lang, device_class })

/** Content-id parameters under their GA names. */
export const gaIds = (ids: { level: string; bookType: string; unit: string; track: string }) => ({
  level: ids.level,
  book_type: ids.bookType,
  unit: ids.unit,
  track: ids.track,
})
