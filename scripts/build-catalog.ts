// Generates src/content/catalog.json from audio-source/ and the unit table in docs/UNITS-DRAFT.md.
// Track ranges filled in for a level/book split its tracks into units; with no ranges the book gets
// a single "All tracks" unit. Tracks not covered by any range go to an "Other tracks" unit.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { validateCatalog } from './catalog-rules'

interface UnitRow {
  number: string
  title: string
  sb: number[]
  wb: number[]
}

export function parseRanges(text: string): number[] {
  const out: number[] = []
  for (const part of text.split(/[,;]/)) {
    const p = part.trim()
    if (!p) continue
    const m = /^(\d+)\s*[-–]\s*(\d+)$/.exec(p)
    if (m) for (let n = Number(m[1]); n <= Number(m[2]); n++) out.push(n)
    else if (/^\d+$/.test(p)) out.push(Number(p))
    else throw new Error(`cannot parse track range "${p}"`)
  }
  return out
}

function parseUnits(md: string): Map<number, UnitRow[]> {
  const levels = new Map<number, UnitRow[]>()
  let level = 0
  for (const line of md.split('\n')) {
    const h = /^## Level (\d+)/.exec(line)
    if (h) {
      level = Number(h[1])
      levels.set(level, [])
      continue
    }
    if (!level || !line.startsWith('|')) continue
    const cells = line.split('|').slice(1, -1).map((c) => c.trim())
    if (!/^\d/.test(cells[0] ?? '')) continue
    levels.get(level)!.push({
      number: cells[0]!.match(/^\d+/)![0],
      title: cells[1]!,
      sb: parseRanges(cells[3] ?? ''),
      wb: parseRanges(cells[4] ?? ''),
    })
  }
  return levels
}


const KINDS = [
  { key: 'sb' as const, dir: 'sb', id: 'student-book', type: 'textbook' as const, en: 'Student Book', es: 'Libro del estudiante' },
  { key: 'wb' as const, dir: 'wb', id: 'workbook', type: 'workbook' as const, en: 'Workbook', es: 'Cuaderno de ejercicios' },
]

// Tracks deliberately left out of the site (e.g. a spoken title/credits page), keyed `level/book`.
const OMITTED: Record<string, number[]> = { '2/sb': [1], '2/wb': [1] }

// Levels kept out of the catalogue until their unit track ranges are known (MVP ships Level 2 only).
const HIDDEN_LEVELS = new Set([1, 3, 4])

const units = parseUnits(readFileSync('docs/UNITS-DRAFT.md', 'utf8'))
const levels: { id: string; title: string }[] = []
const books: unknown[] = []

for (const lvl of [1, 2, 3, 4]) {
  if (HIDDEN_LEVELS.has(lvl)) continue
  levels.push({ id: `level-${lvl}`, title: `Level ${lvl}` })
  for (const k of KINDS) {
    const dir = `audio-source/level-${lvl}/${k.dir}`
    if (!existsSync(dir)) continue
    const tracks = readdirSync(dir)
      .filter((f) => f.endsWith('.mp3'))
      .map((f) => Number(f.replace('.mp3', '')))
      .sort((a, b) => a - b)
    const track = (n: number) => ({
      id: `track-${n}`,
      label: String(n),
      file: `level-${lvl}/${k.dir}/${String(n).padStart(3, '0')}.mp3`,
    })
    const rows = (units.get(lvl) ?? []).filter((u) => u[k.key].length > 0)
    const bookUnits: unknown[] = []
    if (rows.length === 0) {
      bookUnits.push({ id: 'all-tracks', number: '1', title: 'All tracks', tracks: tracks.map(track) })
    } else {
      const assigned = new Set<number>()
      for (const u of rows) {
        const present = u[k.key].filter((n) => tracks.includes(n))
        present.forEach((n) => assigned.add(n))
        bookUnits.push({ id: `unit-${u.number}`, number: u.number, title: u.title, tracks: present.map(track) })
      }
      const omitted = OMITTED[`${lvl}/${k.dir}`] ?? []
      const rest = tracks.filter((n) => !assigned.has(n) && !omitted.includes(n))
      if (rest.length) bookUnits.push({ id: 'other-tracks', number: '99', title: 'Other tracks', tracks: rest.map(track) })
    }
    books.push({
      id: `level-${lvl}-${k.id}`,
      levelId: `level-${lvl}`,
      type: k.type,
      title: `English in Action ${lvl}: ${k.en}`,
      titleTranslations: { es: `English in Action ${lvl}: ${k.es}` },
      units: bookUnits,
    })
  }
}

const catalog = { version: 1, levels, books }
const errors = validateCatalog(catalog)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
writeFileSync('src/content/catalog.json', JSON.stringify(catalog, null, 2) + '\n')
console.log(`wrote src/content/catalog.json: ${books.length} books, ${books.flatMap((b) => (b as { units: { tracks: unknown[] }[] }).units).reduce((n, u) => n + u.tracks.length, 0)} tracks`)
