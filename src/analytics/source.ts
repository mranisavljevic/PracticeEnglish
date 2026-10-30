import type { Location, NavigateFunction } from 'react-router-dom'
import { TRACK_SOURCES } from '../../netlify/functions/lib/schema'
import type { TrackSource } from './events'

export type { TrackSource }

export function withSource(source: TrackSource): { source: TrackSource } {
  return { source }
}

/** The arrival source carried in router state; anything missing or unknown counts as plain navigation. */
export function readSource(state: unknown): TrackSource {
  const source = (state as { source?: unknown } | null)?.source
  return TRACK_SOURCES.includes(source as TrackSource) ? (source as TrackSource) : 'navigation'
}

/** True when router state carries an explicit, valid source. */
export function hasSource(state: unknown): boolean {
  const source = (state as { source?: unknown } | null)?.source
  return TRACK_SOURCES.includes(source as TrackSource)
}

/** Drops the state from the current history entry so a reload or back/forward does not replay it. */
export function clearSource(navigate: NavigateFunction, location: Location): void {
  navigate(location, { replace: true, state: null })
}
