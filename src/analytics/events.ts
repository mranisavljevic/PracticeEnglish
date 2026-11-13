// Vocabulary and the privacy gate for usage events.

export const EVENT_TYPES = ['visit', 'track_started', 'resume_used', 'language_changed', 'error'] as const
export const DEVICE_CLASSES = ['mobile', 'desktop'] as const
export const TRACK_SOURCES = ['scan', 'navigation', 'resume', 'repeat', 'next'] as const
export const ERROR_TYPES = ['playback-failure', 'scan-failure', 'unexpected'] as const
export const BOOK_TYPES = ['textbook', 'workbook'] as const

export type EventType = (typeof EVENT_TYPES)[number]
export type DeviceClass = (typeof DEVICE_CLASSES)[number]
export type TrackSource = (typeof TRACK_SOURCES)[number]
export type ErrorType = (typeof ERROR_TYPES)[number]
export type BookType = (typeof BOOK_TYPES)[number]

export interface UsageEvent {
  type: EventType
  lang: string
  device: DeviceClass
  label?: TrackSource | ErrorType
  level?: string
  bookType?: BookType
  unit?: string
  track?: string
}

export type Consent = 'unset' | 'granted' | 'declined'

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

const MEASUREMENT_ID = /^G-[A-Z0-9]+$/

export function validMeasurementId(id: string | undefined): id is string {
  return id !== undefined && MEASUREMENT_ID.test(id)
}

/** True when the visitor has asked not to be tracked (Do Not Track on navigator or window, or Global Privacy Control). */
export function privacySignalPresent(nav: PrivacySignals, win?: { doNotTrack?: string | null }): boolean {
  return nav.doNotTrack === '1' || win?.doNotTrack === '1' || nav.globalPrivacyControl === true
}

/** False without a valid measurement id (dev, tests, previews), with a privacy signal, or without consent. */
export function trackingAllowed(
  env: { VITE_GA_MEASUREMENT_ID?: string },
  nav: PrivacySignals,
  win: { doNotTrack?: string | null } | undefined,
  consent: Consent,
): boolean {
  if (!validMeasurementId(env.VITE_GA_MEASUREMENT_ID)) return false
  if (privacySignalPresent(nav, win)) return false
  return consent === 'granted'
}
