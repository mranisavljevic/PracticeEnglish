import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dir = 'src/locales'
const files = readdirSync(dir).filter((f) => f.endsWith('.json'))
const locales: Record<string, Record<string, string>> = Object.fromEntries(
  files.map((f) => [f.replace('.json', ''), JSON.parse(readFileSync(join(dir, f), 'utf8'))]),
)
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()

describe('locale parity', () => {
  const en = locales.en!
  for (const [code, dict] of Object.entries(locales)) {
    it(`${code} has every English key and matching placeholders`, () => {
      const missing = Object.keys(en).filter((k) => !(k in dict))
      expect(missing).toEqual([])
      for (const [k, v] of Object.entries(en)) expect(placeholders(dict[k] ?? ''), `${code}:${k}`).toEqual(placeholders(v))
    })
    it(`${code} has a non-empty meta.nativeName`, () => {
      expect(dict['meta.nativeName']?.trim()).toBeTruthy()
    })
  }

  it('components contain no literal user-facing JSX text', () => {
    const offenders: string[] = []
    for (const sub of ['src/pages', 'src/components']) {
      for (const f of readdirSync(sub).filter((n) => n.endsWith('.tsx'))) {
        const src = readFileSync(join(sub, f), 'utf8')
        for (const m of src.matchAll(/>\s*([^<>{}\n]*[A-Za-z][^<>{}\n]*)\s*</g)) {
          // ignore generics / arrows / comparison noise: require it to look like prose between tags
          if (/=>|[;()=]/.test(m[1]!)) continue
          offenders.push(`${sub}/${f}: "${m[1]!.trim()}"`)
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
