import { existsSync, readFileSync } from 'node:fs'
import { validateCatalog } from './catalog-rules'

const catalog = JSON.parse(readFileSync('src/content/catalog.json', 'utf8'))
const errors = validateCatalog(catalog)

if (errors.length === 0) {
  const haveSource = existsSync('audio-source')
  if (!haveSource) console.warn('warning: audio-source/ not found; skipping file existence checks for real audio')
  for (const book of catalog.books) {
    for (const unit of book.units) {
      for (const track of unit.tracks) {
        const file: string = track.file
        const path = file.startsWith('sample/') ? `tests/fixtures/audio/${file}` : `audio-source/${file}`
        if (!file.startsWith('sample/') && !haveSource) continue
        if (!existsSync(path)) errors.push(`missing audio file for ${book.id}/${unit.id}/${track.id}: ${path}`)
      }
    }
  }
}

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exit(1)
}
console.log('catalog OK')
