import { describe, expect, it } from 'vitest'
import { buildCatalog } from '../../scripts/catalog-generate'
import { validateCatalog } from '../../scripts/catalog-rules'

const table = (level: number, sb: string[], wb: string[] = []) =>
  `## Level ${level}\n\n| Unit | Title | SB page | SB tracks | WB tracks |\n|---|---|---|---|---|\n` +
  sb.map((r, i) => `| ${i + 1} | T${i + 1} | 1 | ${r} | ${wb[i] ?? ''} |`).join('\n') +
  '\n\n'

const md = (l3: string[]) => [1, 2, 3, 4].map((l) => table(l, l === 3 ? l3 : l === 2 ? ['2-3'] : [''])).join('')

const files = (lvl: number, dir: string): number[] | undefined =>
  dir === 'sb' || lvl === 2 ? [1, 2, 3, 4, 5] : undefined

describe('buildCatalog live-vs-placeholder rule', () => {
  it('a book with ranges is live, others become comingSoon', () => {
    const c = buildCatalog({ unitsMd: md(['2-3', '4-5']), tracksFor: files, omitted: {} })
    expect(c.books.map((b) => b.id)).toContain('level-3-student-book')
    const soon = c.comingSoon.map((b) => b.id)
    expect(soon).toContain('level-1-student-book')
    expect(soon).not.toContain('level-3-student-book')
    expect(c.levels.map((l) => l.id)).toEqual(['level-1', 'level-2', 'level-3', 'level-4'])
    expect(validateCatalog(c)).toEqual([])
  })

  it('placeholders carry no units or cover and have es titles', () => {
    const c = buildCatalog({ unitsMd: md(['2-3']), tracksFor: files, omitted: {} })
    const p = c.comingSoon.find((b) => b.id === 'level-1-student-book')!
    expect(p).toEqual({
      id: 'level-1-student-book',
      levelId: 'level-1',
      type: 'textbook',
      title: 'English in Action 1: Student Book',
      titleTranslations: { es: 'English in Action 1: Libro del estudiante' },
    })
  })

  it('clearing the column moves the book back to comingSoon', () => {
    const c = buildCatalog({ unitsMd: md(['']), tracksFor: files, omitted: {} })
    expect(c.books.map((b) => b.id)).not.toContain('level-3-student-book')
    expect(c.comingSoon.map((b) => b.id)).toContain('level-3-student-book')
  })

  it('omits empty units and omitted tracks', () => {
    const c = buildCatalog({ unitsMd: md(['2-3', '8-9', '4-5']), tracksFor: files, omitted: { '3/sb': [1] } })
    const b = c.books.find((x) => x.id === 'level-3-student-book')!
    expect(b.units.map((u) => u.id)).toEqual(['unit-1', 'unit-3'])
  })

  it('does not treat a missing audio directory as a live book', () => {
    const c = buildCatalog({ unitsMd: md(['2-3']), tracksFor: () => undefined, omitted: {} })
    expect(c.books).toEqual([])
    expect(c.comingSoon).toHaveLength(8)
  })

  it('filling only a Workbook column releases just that workbook', () => {
    const unitsMd = [1, 2, 3, 4].map((l) => table(l, l === 4 ? [''] : l === 2 ? ['2-3'] : [''], l === 4 ? ['2-3'] : [])).join('')
    const c = buildCatalog({ unitsMd, tracksFor: () => [1, 2, 3, 4, 5], omitted: {} })
    expect(c.books.map((b) => b.id)).toContain('level-4-workbook')
    expect(c.comingSoon.map((b) => b.id)).toContain('level-4-student-book')
    expect(c.comingSoon.map((b) => b.id)).not.toContain('level-4-workbook')
  })
})
