import catalogJson from '@catalog'

export type TrackType = 'textbook' | 'workbook'

export interface Track {
  id: string
  label: string
  file: string
  durationSec?: number
}
export interface Unit {
  id: string
  number: string
  title: string
  titleTranslations?: Record<string, string>
  tracks: Track[]
}
export interface Book {
  id: string
  levelId: string
  type: TrackType
  title: string
  cover?: string
  titleTranslations?: Record<string, string>
  units: Unit[]
}
export interface Level {
  id: string
  title: string
}
export interface Catalog {
  version: 1
  levels: Level[]
  books: Book[]
}

export function createCatalogApi(catalog: Catalog) {
  const getBook = (bookId: string) => catalog.books.find((b) => b.id === bookId)
  const getUnit = (bookId: string, unitId: string) => getBook(bookId)?.units.find((u) => u.id === unitId)
  const getTrack = (bookId: string, unitId: string, trackId: string) =>
    getUnit(bookId, unitId)?.tracks.find((t) => t.id === trackId)
  const getSiblings = (bookId: string, unitId: string, trackId: string) => {
    const tracks = getUnit(bookId, unitId)?.tracks ?? []
    const i = tracks.findIndex((t) => t.id === trackId)
    if (i < 0) return { prev: undefined, next: undefined }
    return { prev: tracks[i - 1], next: tracks[i + 1] }
  }
  const booksByLevel = () =>
    catalog.levels
      .map((level) => ({ level, books: catalog.books.filter((b) => b.levelId === level.id) }))
      .filter((g) => g.books.length > 0)
  return { catalog, getBook, getUnit, getTrack, getSiblings, booksByLevel }
}

export const catalog = catalogJson as Catalog
export const { getBook, getUnit, getTrack, getSiblings, booksByLevel } = createCatalogApi(catalog)

export const AUDIO_BASE_URL: string =
  (import.meta.env.VITE_AUDIO_BASE_URL as string | undefined) ?? 'https://audio.practiceenglish.net'

export function audioUrl(track: Track): string {
  return `${AUDIO_BASE_URL}/${track.file}`
}
