import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync('src/styles/base.css', 'utf8')
const root = /:root\s*{([^}]*)}/.exec(css)?.[1] ?? ''
const token = (name: string) => new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`).exec(root)?.[1]?.toLowerCase() ?? ''

const luminance = (hex: string) => {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [hi = 0, lo = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('warm theme tokens', () => {
  it('no longer uses pure white for the page background and keeps the blue accent', () => {
    expect(token('bg')).not.toBe('#ffffff')
    expect(token('accent')).toBe('#1d4ed8')
  })

  it.each(['bg', 'surface'])('keeps text, accent and danger at 4.5:1 or better on --%s', (bg) => {
    for (const fg of ['fg', 'muted', 'accent', 'danger']) {
      expect(contrast(token(fg), token(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('coming-soon tile', () => {
  const rule = (sel: string) => new RegExp(`${sel.replace('.', '\\.')}\\s*{([^}]*)}`).exec(css)?.[1] ?? ''
  const color = (decl: string) => {
    const m = /(?:^|[;\s])color:\s*var\(--([a-z]+)\)/.exec(decl)
    return m ? token(m[1]!) : ''
  }

  it('defines .card--soon', () => {
    expect(css).toMatch(/\.card--soon/)
  })

  it('title and badge text stay at 4.5:1 on the tile background', () => {
    const bg = token('surface')
    const tileText = color(rule('.card--soon')) || token('fg')
    const badgeText = color(rule('.card--soon .badge')) || color(rule('.badge')) || token('fg')
    expect(contrast(tileText, bg), 'title').toBeGreaterThanOrEqual(4.5)
    expect(contrast(badgeText, bg), 'badge').toBeGreaterThanOrEqual(4.5)
  })
})
