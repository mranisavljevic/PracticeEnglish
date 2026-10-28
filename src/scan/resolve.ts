import type { Book } from '../content/catalog'

export interface TrackMatch {
  unitId: string
  trackId: string
}

/** Finds the track whose printed number matches `number`; track numbers are unique per book. */
export function resolve(book: Book, number: string): TrackMatch | undefined {
  if (!/^\d+$/.test(number)) return undefined
  for (const unit of book.units) {
    const track = unit.tracks.find((t) => t.label === number)
    if (track) return { unitId: unit.id, trackId: track.id }
  }
  return undefined
}
