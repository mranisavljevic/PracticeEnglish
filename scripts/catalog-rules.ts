import Ajv2020 from 'ajv/dist/2020.js'
import { readFileSync } from 'node:fs'

const schema = JSON.parse(readFileSync('specs/001-audio-practice-site/contracts/catalog.schema.json', 'utf8'))
const ajv = new Ajv2020({ allErrors: true, strict: false })
const validateSchema = ajv.compile(schema)

interface Identified {
  id: string
}

function dupes(items: Identified[], where: string, errors: string[]) {
  const seen = new Set<string>()
  for (const it of items) {
    if (seen.has(it.id)) errors.push(`duplicate id "${it.id}" in ${where}`)
    seen.add(it.id)
  }
}

/** Schema + x-additional-rules (excluding audio file existence). Returns error strings. */
export function validateCatalog(data: unknown): string[] {
  if (!validateSchema(data)) {
    return (validateSchema.errors ?? []).map((e) => `schema: ${e.instancePath || '/'} ${e.message}`)
  }
  const errors: string[] = []
  const c = data as {
    levels: Identified[]
    books: { id: string; levelId: string; units: { id: string; tracks: { id: string; label: string }[] }[] }[]
  }
  dupes(c.levels, 'levels', errors)
  dupes(c.books, 'books', errors)
  const levelIds = new Set(c.levels.map((l) => l.id))
  for (const b of c.books) {
    if (!levelIds.has(b.levelId)) errors.push(`book "${b.id}": levelId "${b.levelId}" does not exist`)
    dupes(b.units, `book "${b.id}"`, errors)
    for (const u of b.units) {
      dupes(u.tracks, `unit "${b.id}/${u.id}"`, errors)
      const labels = new Set<string>()
      for (const t of u.tracks) {
        if (labels.has(t.label)) errors.push(`unit "${b.id}/${u.id}": duplicate track label "${t.label}"`)
        labels.add(t.label)
      }
    }
  }
  return errors
}
