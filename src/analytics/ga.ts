import { validMeasurementId, type UsageEvent } from './events'

const SCRIPT = 'https://www.googletagmanager.com/gtag/js?id='

/** Defines the gtag queue, configures the stream and appends gtag.js once. Nothing loads before this is called. */
export function ensureGa(id: string): void {
  try {
    if (!validMeasurementId(id)) return
    const src = `${SCRIPT}${id}`
    if (document.querySelector(`script[src="${src}"]`)) return
    window.dataLayer = window.dataLayer ?? []
    if (!window.gtag) {
      window.gtag = function () {
        // gtag.js only understands `arguments` objects in the queue
        // eslint-disable-next-line prefer-rest-params
        window.dataLayer?.push(arguments)
      }
    }
    window.gtag('js', new Date())
    window.gtag('config', id, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: 5184000,
    })
    const script = document.createElement('script')
    script.async = true
    script.src = src
    document.head.appendChild(script)
  } catch {
    // analytics must never affect the app
  }
}

/** Maps a usage event to its GA event name and parameters (contracts/ga-event-contract.md). Never throws. */
export function sendEvent(event: UsageEvent): void {
  try {
    const params: Record<string, string> = { app: 'practice-english', ui_lang: event.lang, device_class: event.device }
    if (event.type === 'track_started' && event.label) params.source = event.label
    if (event.type === 'error' && event.label) params.error_type = event.label
    if (event.level) params.level = event.level
    if (event.bookType) params.book_type = event.bookType
    if (event.unit) params.unit = event.unit
    if (event.track) params.track = event.track
    window.gtag?.('event', event.type, params)
  } catch {
    // analytics must never affect the app
  }
}
