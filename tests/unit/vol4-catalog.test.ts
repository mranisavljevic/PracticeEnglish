import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import catalogJson from '../../src/content/catalog.json'
import type { Catalog } from '../../src/content/catalog'

const catalog = catalogJson as unknown as Catalog
const book = catalog.books.find((b) => b.id === 'level-4-student-book')

const RANGES: Record<string, [number, number]> = {
  '1': [2, 6],
  '2': [7, 11],
  '3': [12, 17],
  '4': [18, 23],
  '5': [24, 27],
  '7': [35, 41],
  '8': [42, 48],
  '9': [49, 55],
  '10': [56, 65],
  '11': [66, 69],
  '12': [70, 74],
  '13': [75, 77],
  '14': [78, 84],
}

describe('Volume 4 Student Book', () => {
  it('is a live textbook with the Spanish title', () => {
    expect(book).toBeDefined()
    expect(book!.type).toBe('textbook')
    expect(book!.title).toBe('English in Action 4: Student Book')
    expect(book!.titleTranslations?.es).toBe('English in Action 4: Libro del estudiante')
  })

  it('has units 1-5 and 7-14 (unit 6 absent: tracks 28-34 are missing at the source)', () => {
    expect(book!.units.map((u) => u.number)).toEqual(Object.keys(RANGES))
  })

  it('maps each unit to its track range', () => {
    for (const u of book!.units) {
      const [from, to] = RANGES[u.number]!
      expect(u.tracks.map((t) => Number(t.label))).toEqual(Array.from({ length: to - from + 1 }, (_, i) => from + i))
    }
  })

  it('has 76 tracks, each in exactly one unit, and never track 1', () => {
    const labels = book!.units.flatMap((u) => u.tracks.map((t) => t.label))
    expect(labels).toHaveLength(76)
    expect(new Set(labels).size).toBe(76)
    expect(labels).not.toContain('1')
    expect(book!.units.some((u) => u.id === 'other-tracks')).toBe(false)
  })

  it('points every track at an existing level-4/sb file', () => {
    for (const t of book!.units.flatMap((u) => u.tracks)) {
      expect(t.file).toMatch(/^level-4\/sb\/0\d\d\.mp3$/)
      expect(existsSync(`audio-source/${t.file}`), t.file).toBe(true)
    }
  })
})
