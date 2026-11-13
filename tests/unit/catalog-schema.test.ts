import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { validateCatalog } from '../../scripts/catalog-rules'
import catalog from '../../src/content/catalog.json'
import sample from '../fixtures/catalog.sample.json'

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

const valid = {
  version: 1,
  levels: [{ id: 'level-1', title: 'Level 1' }],
  books: [
    {
      id: 'b1',
      levelId: 'level-1',
      type: 'textbook',
      title: 'B',
      units: [
        {
          id: 'u1',
          number: '1',
          title: 'U',
          tracks: [
            { id: 't1', label: '1', file: 'a/one.mp3' },
            { id: 't2', label: '2', file: 'a/two.mp3' },
          ],
        },
      ],
    },
  ],
}

describe('catalog validation', () => {
  it('the bundled catalog.json is valid', () => {
    expect(validateCatalog(catalog)).toEqual([])
  })

  it('the e2e sample catalog is valid', () => {
    expect(validateCatalog(sample)).toEqual([])
  })

  it('schema file is the contract file', () => {
    expect(() =>
      JSON.parse(readFileSync('specs/001-audio-practice-site/contracts/catalog.schema.json', 'utf8')),
    ).not.toThrow()
  })

  it('accepts a minimal valid catalog', () => {
    expect(validateCatalog(valid)).toEqual([])
  })

  it('rejects a bad id pattern', () => {
    const c = clone(valid)
    c.books[0]!.id = 'Bad_ID'
    expect(validateCatalog(c).length).toBeGreaterThan(0)
  })

  it('rejects ".." in file paths', () => {
    const c = clone(valid)
    c.books[0]!.units[0]!.tracks[0]!.file = '../secret.mp3'
    expect(validateCatalog(c).length).toBeGreaterThan(0)
  })

  it('rejects duplicate labels within a unit', () => {
    const c = clone(valid)
    c.books[0]!.units[0]!.tracks[1]!.label = '1'
    expect(validateCatalog(c).join('\n')).toMatch(/label/)
  })

  it('rejects duplicate ids within a parent', () => {
    const c = clone(valid)
    c.books[0]!.units[0]!.tracks[1]!.id = 't1'
    expect(validateCatalog(c).join('\n')).toMatch(/duplicate id/i)
  })

  it('rejects a levelId that does not exist', () => {
    const c = clone(valid)
    c.books[0]!.levelId = 'level-9'
    expect(validateCatalog(c).join('\n')).toMatch(/levelId/)
  })
  describe('comingSoon', () => {
    const soon = { id: 'level-1-student-book', levelId: 'level-1', type: 'textbook', title: 'S' }

    it('accepts a catalogue without comingSoon (old catalogues)', () => {
      expect(validateCatalog(valid)).toEqual([])
    })

    it('accepts an optional comingSoon array', () => {
      const c = { ...clone(valid), comingSoon: [{ ...soon, titleTranslations: { es: 'E' } }] }
      expect(validateCatalog(c)).toEqual([])
    })

    it.each(['id', 'levelId', 'type', 'title'])('requires %s', (key) => {
      const item: Record<string, unknown> = { ...soon }
      delete item[key]
      expect(validateCatalog({ ...clone(valid), comingSoon: [item] }).length).toBeGreaterThan(0)
    })

    it('rejects extra properties such as units', () => {
      const c = { ...clone(valid), comingSoon: [{ ...soon, units: [] }] }
      expect(validateCatalog(c).length).toBeGreaterThan(0)
    })

    it('rejects a levelId that does not exist', () => {
      const c = { ...clone(valid), comingSoon: [{ ...soon, levelId: 'level-9' }] }
      expect(validateCatalog(c).join('\n')).toMatch(/levelId/)
    })

    it('rejects duplicate comingSoon ids', () => {
      const c = { ...clone(valid), comingSoon: [soon, soon] }
      expect(validateCatalog(c).join('\n')).toMatch(/duplicate id/i)
    })

    it('rejects a comingSoon id that collides with a book id', () => {
      const c = { ...clone(valid), comingSoon: [{ ...soon, id: 'b1' }] }
      expect(validateCatalog(c).join('\n')).toMatch(/b1/)
    })
  })
})
