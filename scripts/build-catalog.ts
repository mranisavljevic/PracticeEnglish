// Generates src/content/catalog.json from audio-source/ and the unit table in docs/UNITS-DRAFT.md.
// See catalog-generate.ts for the live-vs-"coming soon" rule.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { buildCatalog } from './catalog-generate'
import { validateCatalog } from './catalog-rules'

// Tracks deliberately left out of the site (e.g. a spoken title/credits page), keyed `level/book`.
const OMITTED: Record<string, number[]> = { '2/sb': [1], '2/wb': [1], '4/sb': [1] }

const catalog = buildCatalog({
  unitsMd: readFileSync('docs/UNITS-DRAFT.md', 'utf8'),
  omitted: OMITTED,
  tracksFor: (lvl, dir) => {
    const path = `audio-source/level-${lvl}/${dir}`
    if (!existsSync(path)) return undefined
    return readdirSync(path)
      .filter((f) => f.endsWith('.mp3'))
      .map((f) => Number(f.replace('.mp3', '')))
      .sort((a, b) => a - b)
  },
})

const errors = validateCatalog(catalog)
if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}
writeFileSync('src/content/catalog.json', JSON.stringify(catalog, null, 2) + '\n')
const trackCount = catalog.books.flatMap((b) => b.units).reduce((n, u) => n + u.tracks.length, 0)
console.log(`wrote src/content/catalog.json: ${catalog.books.length} books, ${catalog.comingSoon.length} coming soon, ${trackCount} tracks`)
