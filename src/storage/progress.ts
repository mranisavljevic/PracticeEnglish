import type { Catalog } from '../content/catalog'
import { createCatalogApi } from '../content/catalog'
import { safeStorage } from './safeStorage'

export const PROGRESS_KEY = 'pe.progress'

export interface Progress {
  bookId: string
  unitId: string
  trackId: string
}

/** Stores only which track was last opened; never a playback position. */
export function saveProgress(p: Progress): void {
  safeStorage.setItem(PROGRESS_KEY, JSON.stringify({ v: 1, bookId: p.bookId, unitId: p.unitId, trackId: p.trackId }))
}

/** Returns saved progress only if it is well-formed and still exists in the catalogue. */
export function loadProgress(catalog: Catalog): Progress | null {
  const raw = safeStorage.getItem(PROGRESS_KEY)
  if (!raw) return null
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const d = data as Record<string, unknown>
  if (d.v !== 1) return null
  const { bookId, unitId, trackId } = d
  if (typeof bookId !== 'string' || typeof unitId !== 'string' || typeof trackId !== 'string') return null
  if (!createCatalogApi(catalog).getTrack(bookId, unitId, trackId)) return null
  return { bookId, unitId, trackId }
}
