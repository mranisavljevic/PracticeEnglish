import { vi } from 'vitest'

/** Points analytics at a fake endpoint and records every beacon body. Call restore() in afterEach. */
export function captureEvents(ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148') {
  vi.stubEnv('VITE_ANALYTICS_ENDPOINT', '/api/e')
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(ua)
  const sent: Record<string, unknown>[] = []
  const sendBeacon = vi.fn((_url: string, blob: Blob) => {
    void blob.text().then((t) => sent.push(JSON.parse(t)))
    return true
  })
  Object.defineProperty(navigator, 'sendBeacon', { value: sendBeacon, configurable: true, writable: true })
  return {
    sent,
    /** Beacon bodies are read asynchronously from their Blob; wait for them. */
    async events() {
      await new Promise((r) => setTimeout(r, 0))
      return sent
    },
  }
}

export function restoreEvents() {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  sessionStorage.clear()
  localStorage.clear()
  Reflect.deleteProperty(navigator, 'sendBeacon')
  Reflect.deleteProperty(navigator, 'doNotTrack')
  Reflect.deleteProperty(navigator, 'globalPrivacyControl')
}
