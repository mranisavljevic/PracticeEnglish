import type { DeviceClass, ErrorType, EventType, TrackSource, UsageEvent } from '../../netlify/functions/lib/schema'

export type { DeviceClass, ErrorType, EventType, TrackSource, UsageEvent }

/** Content ids a track-level event carries. */
export interface TrackIds {
  level: string
  bookType: 'textbook' | 'workbook'
  unit: string
  track: string
}

/** Only the class is kept; the user-agent string itself never leaves this function. */
export function detectDevice(userAgent: string | undefined): DeviceClass {
  return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent ?? '') ? 'mobile' : 'desktop'
}

interface PrivacySignals {
  doNotTrack?: string | null
  globalPrivacyControl?: boolean
}

/** False without a configured endpoint (dev, tests, previews) or when the visitor has asked not to be tracked. */
export function trackingAllowed(
  env: { VITE_ANALYTICS_ENDPOINT?: string },
  nav: PrivacySignals,
  win?: { doNotTrack?: string | null },
): boolean {
  if (!env.VITE_ANALYTICS_ENDPOINT) return false
  if (nav.doNotTrack === '1' || win?.doNotTrack === '1') return false
  if (nav.globalPrivacyControl === true) return false
  return true
}
