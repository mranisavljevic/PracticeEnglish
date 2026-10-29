import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useLocale } from '../i18n/LocaleProvider'
import type { TrackIds, TrackSource } from './events'
import { track, trackOncePerSession } from './track'

interface Analytics {
  trackStarted: (source: TrackSource, ids: TrackIds) => void
  resumeUsed: () => void
  languageChanged: (lang: string) => void
  playbackFailure: (ids: TrackIds) => void
  scanFailure: () => void
}

const noop = () => {}
// Without a provider (isolated component tests) every call does nothing.
const AnalyticsContext = createContext<Analytics>({
  trackStarted: noop,
  resumeUsed: noop,
  languageChanged: noop,
  playbackFailure: noop,
  scanFailure: noop,
})

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { lang } = useLocale()

  const value = useMemo<Analytics>(
    () => ({
      trackStarted: (source, ids) => track({ type: 'track_started', label: source, ...ids }, lang),
      resumeUsed: () => track({ type: 'resume_used' }, lang),
      languageChanged: (next) => track({ type: 'language_changed' }, next),
      playbackFailure: (ids) =>
        trackOncePerSession(
          `playback-failure|${ids.level}/${ids.bookType}/${ids.unit}/${ids.track}`,
          { type: 'error', label: 'playback-failure', ...ids },
          lang,
        ),
      scanFailure: () => trackOncePerSession('scan-failure|', { type: 'error', label: 'scan-failure' }, lang),
    }),
    [lang],
  )

  useEffect(() => {
    trackOncePerSession('visit', { type: 'visit' }, lang)
  }, [lang])

  // Only the fact that something failed is reported; the event payload is never read.
  useEffect(() => {
    const unexpected = () => trackOncePerSession('unexpected|', { type: 'error', label: 'unexpected' }, lang)
    window.addEventListener('error', unexpected)
    window.addEventListener('unhandledrejection', unexpected)
    return () => {
      window.removeEventListener('error', unexpected)
      window.removeEventListener('unhandledrejection', unexpected)
    }
  }, [lang])

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}

export function useAnalytics(): Analytics {
  return useContext(AnalyticsContext)
}
