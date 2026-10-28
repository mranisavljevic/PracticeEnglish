import { describe, expect, it } from 'vitest'
import { findBadges } from '../../src/scan/badges'
import { hasFile, loadPng } from '../helpers/png'

const dir = 'tests/fixtures/badges'

describe('findBadges', () => {
  for (const name of ['textbook-15', 'workbook-15', 'workbook-13', 'workbook-14']) {
    it(`finds the badge in ${name} and crops the numeral`, () => {
      const frame = loadPng(`${dir}/${name}.png`)
      const found = findBadges(frame)
      expect(found.length).toBeGreaterThanOrEqual(1)
      const best = found[0]!
      // the numeral crop is a wide strip prepared for OCR (about 48 px tall)
      expect(best.crop.height).toBeGreaterThanOrEqual(40)
      expect(best.crop.width).toBeGreaterThan(best.crop.height / 2)
      // the crop is dark text on a light background
      let sum = 0
      for (let i = 0; i < best.crop.data.length; i += 4) sum += best.crop.data[i]!
      expect(sum / (best.crop.data.length / 4)).toBeGreaterThan(128)
    })
  }

  it('finds no badge in plain text', () => {
    expect(findBadges(loadPng(`${dir}/text-only.png`))).toHaveLength(0)
  })

  it('finds every badge when several are in view', () => {
    expect(findBadges(loadPng(`${dir}/multi.png`)).length).toBeGreaterThanOrEqual(3)
  })

  const fullPage = 'tests/fixtures/private/wb_page_sample.png'
  it.skipIf(!hasFile(fullPage))('finds badges on a full page photo without flooding candidates', () => {
    const found = findBadges(loadPng(fullPage))
    expect(found.length).toBeGreaterThanOrEqual(3)
    expect(found.length).toBeLessThan(15)
  })
})
