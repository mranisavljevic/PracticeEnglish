// Pure catalogue generation from the unit table in docs/UNITS-DRAFT.md plus the audio files found on disk.
// A book is live iff its range column is non-empty (and its audio folder exists); otherwise it is emitted
// into the top-level `comingSoon` array. Units with no existing tracks are dropped. Tracks not covered by
// any range go to an "Other tracks" unit unless listed in `omitted`.

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

export function parseUnits(md: string): Map<number, UnitRow[]> {
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

export interface GeneratedCatalog {
  version: 1
  levels: { id: string; title: string }[]
  books: {
    id: string
    levelId: string
    type: 'textbook' | 'workbook'
    title: string
    titleTranslations: Record<string, string>
    units: { id: string; number: string; title: string; tracks: { id: string; label: string; file: string }[] }[]
  }[]
  comingSoon: {
    id: string
    levelId: string
    type: 'textbook' | 'workbook'
    title: string
    titleTranslations: Record<string, string>
  }[]
}

export interface BuildOptions {
  unitsMd: string
  /** Sorted track numbers present for a level/book folder, or undefined if the folder does not exist. */
  tracksFor: (level: number, dir: string) => number[] | undefined
  /** Tracks deliberately left out of the site, keyed `level/dir`. */
  omitted: Record<string, number[]>
  levels?: number[]
}

export function buildCatalog({ unitsMd, tracksFor, omitted, levels: lvls = [1, 2, 3, 4] }: BuildOptions): GeneratedCatalog {
  const units = parseUnits(unitsMd)
  const out: GeneratedCatalog = { version: 1, levels: [], books: [], comingSoon: [] }

  for (const lvl of lvls) {
    out.levels.push({ id: `level-${lvl}`, title: `Level ${lvl}` })
    for (const k of KINDS) {
      const meta = {
        id: `level-${lvl}-${k.id}`,
        levelId: `level-${lvl}`,
        type: k.type,
        title: `English in Action ${lvl}: ${k.en}`,
        titleTranslations: { es: `English in Action ${lvl}: ${k.es}` },
      }
      const rows = (units.get(lvl) ?? []).filter((u) => u[k.key].length > 0)
      const tracks = tracksFor(lvl, k.dir)
      if (rows.length === 0 || !tracks) {
        out.comingSoon.push(meta)
        continue
      }
      const track = (n: number) => ({
        id: `track-${n}`,
        label: String(n),
        file: `level-${lvl}/${k.dir}/${String(n).padStart(3, '0')}.mp3`,
      })
      const bookUnits: GeneratedCatalog['books'][number]['units'] = []
      const assigned = new Set<number>()
      for (const u of rows) {
        const present = u[k.key].filter((n) => tracks.includes(n))
        present.forEach((n) => assigned.add(n))
        if (present.length === 0) continue
        bookUnits.push({ id: `unit-${u.number}`, number: u.number, title: u.title, tracks: present.map(track) })
      }
      const skip = omitted[`${lvl}/${k.dir}`] ?? []
      const rest = tracks.filter((n) => !assigned.has(n) && !skip.includes(n))
      if (rest.length) bookUnits.push({ id: 'other-tracks', number: '99', title: 'Other tracks', tracks: rest.map(track) })
      out.books.push({ ...meta, units: bookUnits })
    }
  }
  return out
}
