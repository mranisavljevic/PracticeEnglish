import { readFileSync, statSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const files = ['Regular', 'SemiBold', 'Bold'].map((w) => `public/fonts/Commissioner-${w}.woff2`)
const css = readFileSync('src/styles/base.css', 'utf8')
const html = readFileSync('index.html', 'utf8')

describe('Commissioner typeface', () => {
  it('ships three woff2 files and the licence, within the size budget', () => {
    for (const f of [...files, 'public/fonts/OFL.txt']) expect(statSync(f).size).toBeGreaterThan(0)
    const total = files.reduce((sum, f) => sum + statSync(f).size, 0)
    expect(total).toBeLessThanOrEqual(100 * 1024)
  })

  it('declares three same-origin @font-face rules for 400/600/700 with swap', () => {
    const rules = css.match(/@font-face\s*{[^}]*}/g) ?? []
    expect(rules).toHaveLength(3)
    const weights = rules.map((r) => /font-weight:\s*(\d+)/.exec(r)?.[1]).sort()
    expect(weights).toEqual(['400', '600', '700'])
    for (const r of rules) {
      expect(r).toMatch(/font-display:\s*swap/)
      expect(r).toMatch(/url\(['"]?\/fonts\/Commissioner-[A-Za-z]+\.woff2['"]?\)/)
      expect(r).not.toMatch(/https?:/)
    }
  })

  it('uses Commissioner for body text and inherits it in form controls', () => {
    expect(css).toMatch(/font-family:\s*'Commissioner',\s*system-ui/)
    expect(css).toMatch(/button,\s*input,\s*select,\s*textarea\s*{\s*font:\s*inherit;?\s*}/)
  })

  it('preloads the Regular and Bold files with crossorigin', () => {
    const links = html.match(/<link[^>]*rel="preload"[^>]*>/g) ?? []
    expect(links).toHaveLength(2)
    for (const [i, w] of ['Regular', 'Bold'].entries()) {
      expect(links[i]).toContain(`/fonts/Commissioner-${w}.woff2`)
      expect(links[i]).toContain('as="font"')
      expect(links[i]).toContain('type="font/woff2"')
      expect(links[i]).toContain('crossorigin')
    }
  })
})
