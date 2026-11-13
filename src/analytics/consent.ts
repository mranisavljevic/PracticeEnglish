import { privacySignalPresent, validMeasurementId, type Consent } from './events'

const KEY = 'pe.consent'

const listeners = new Set<() => void>()
let memory: Consent = 'unset'
let reopened = false

function promptEnabled(): boolean {
  return import.meta.env.VITE_CONSENT_PROMPT !== 'off'
}

function signal(): boolean {
  if (typeof navigator === 'undefined') return false
  return privacySignalPresent(navigator as Navigator & { globalPrivacyControl?: boolean }, window as Window & { doNotTrack?: string | null })
}

function notify() {
  listeners.forEach((l) => l())
}

/** `granted` whenever the owner has turned the prompt off. Falls back to memory when localStorage is blocked. */
export function getConsent(): Consent {
  if (!promptEnabled()) return 'granted'
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'granted' || stored === 'declined') return stored
    return 'unset'
  } catch {
    return memory
  }
}

function deleteGaCookies() {
  try {
    const parts = location.hostname.split('.')
    const domains = ['', ...parts.map((_, i) => `; domain=${parts.slice(i).join('.')}`)]
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0]?.trim()
      if (!name?.startsWith('_ga')) continue
      for (const domain of domains) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`
    }
  } catch {
    // best effort
  }
}

export function setConsent(value: 'granted' | 'declined'): void {
  memory = value
  reopened = false
  try {
    localStorage.setItem(KEY, value)
  } catch {
    // memory fallback already set
  }
  if (value === 'declined') deleteGaCookies()
  notify()
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Shows the choice again (footer "Privacy settings"). */
export function reopenPrompt(): void {
  reopened = true
  notify()
}

/** The banner shows only when analytics is configured, the prompt is on, and nothing overrides the choice. */
export function promptVisible(): boolean {
  if (!promptEnabled() || signal() || !validMeasurementId(import.meta.env.VITE_GA_MEASUREMENT_ID)) return false
  return reopened || getConsent() === 'unset'
}

/** Whether the footer should offer to reopen the choice. */
export function settingsAvailable(): boolean {
  return promptEnabled() && !signal() && validMeasurementId(import.meta.env.VITE_GA_MEASUREMENT_ID)
}
