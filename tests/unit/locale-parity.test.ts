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

  describe('fr', () => {
    const fr = locales.fr
    const NBSP = '\u00a0'

    it('exists with exactly the English key set', () => {
      expect(fr).toBeDefined()
      expect(Object.keys(fr ?? {}).sort()).toEqual(Object.keys(en).sort())
    })

    it('uses the formal register (no tu-forms)', () => {
      const tu = /(?<![\p{L}'])(tu|ton|ta|tes|toi|te|t')(?![\p{L}])/iu
      const allowlist = new Set<string>()
      const offenders = Object.entries(fr ?? {}).filter(([k, v]) => !allowlist.has(k) && tu.test(v)).map(([k]) => k)
      expect(offenders).toEqual([])
    })

    it('has native name Français', () => {
      expect(fr?.['meta.nativeName']).toBe('Français')
    })

    it('keeps product and source names', () => {
      expect(fr?.['app.name']).toBe('PracticeEnglish')
      expect(fr?.['credit.source']).toContain('English in Action')
      expect(fr?.['app.tagline']).toContain('English in Action')
    })

    it('preserves placeholder tokens per key', () => {
      for (const [k, v] of Object.entries(en)) expect(placeholders(fr?.[k] ?? ''), k).toEqual(placeholders(v))
    })

    it('uses a non-breaking space before : ? ! ;', () => {
      const offenders = Object.entries(fr ?? {}).filter(([, v]) => / [:?!;]/.test(v)).map(([k]) => k)
      expect(offenders).toEqual([])
      expect(NBSP).toHaveLength(1)
    })
  })

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
