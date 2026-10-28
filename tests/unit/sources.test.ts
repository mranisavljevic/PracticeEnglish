import { describe, it, expect } from 'vitest'
import { checkSources } from '../../scripts/catalog-rules'

const catalog = {
  books: [{ id: 'b', units: [{ id: 'u', tracks: [{ id: 't', file: 'lvl1/a.mp3' }, { id: 's', file: 'sample/x.mp3' }] }] }],
}

describe('source verification gate', () => {
  it('passes when every non-sample file has a SOURCES.md row', () => {
    const md = '| path | url | date |\n|---|---|---|\n| lvl1/a.mp3 | https://example.com/p | 2026-10-18 |\n'
    expect(checkSources(catalog, md)).toEqual([])
  })
  it('fails when a file has no row', () => {
    expect(checkSources(catalog, '').join('\n')).toMatch(/lvl1\/a\.mp3/)
  })
  it('ignores sample/ fixtures', () => {
    expect(checkSources({ books: [{ id: 'b', units: [{ id: 'u', tracks: [{ id: 's', file: 'sample/x.mp3' }] }] }] }, '')).toEqual([])
  })
})
