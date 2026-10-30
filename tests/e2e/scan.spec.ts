import { test, expect } from '@playwright/test'

test('scan a badge from the Book page, open the track, back returns to the unit list', async ({ page }) => {
  await page.goto('/b/sample-textbook')
  await page.getByRole('button', { name: 'Scan audio icon' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Track 15', { exact: true })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Open' }).click()
  await expect(page).toHaveURL(/\/b\/sample-textbook\/u\/unit-1\/t\/track-15$/)
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goBack()
  await expect(page).toHaveURL(/\/b\/sample-textbook\/u\/unit-1$/)
})

test('scan from inside a unit: back returns to that unit’s track list', async ({ page }) => {
  await page.goto('/b/sample-textbook/u/unit-1')
  await page.getByRole('button', { name: 'Scan audio icon' }).click()
  await expect(page.getByText('Track 15', { exact: true })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'Open' }).click()
  await expect(page).toHaveURL(/\/u\/unit-1\/t\/track-15$/)
  await page.goBack()
  await expect(page).toHaveURL(/\/b\/sample-textbook\/u\/unit-1$/)
})

test.describe('desktop (no touch)', () => {
  test.use({ isMobile: false, hasTouch: false, viewport: { width: 1200, height: 800 } })

  test('no scan button appears and manual browsing still works', async ({ page }) => {
    await page.goto('/b/sample-textbook')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Scan audio icon' })).toHaveCount(0)
    await page.getByRole('link', { name: /Meeting People/ }).click()
    await page.getByRole('link', { name: /Track 15/ }).click()
    await expect(page).toHaveURL(/\/t\/track-15$/)
  })
})

test('controls are at least 44px tall and nothing scrolls sideways at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  await page.goto('/b/sample-textbook')
  const scan = page.getByRole('button', { name: 'Scan audio icon' })
  await expect(scan).toBeVisible()
  expect((await scan.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  await scan.click()
  await expect(page.getByText('Track 15', { exact: true })).toBeVisible({ timeout: 10_000 })
  for (const name of ['Open', 'Cancel']) {
    expect((await page.getByRole('button', { name }).boundingBox())!.height).toBeGreaterThanOrEqual(44)
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

async function expectScannerLayout(page: import('@playwright/test').Page) {
  await page.locator('.scan-button').click()
  const viewport = page.locator('.scan__viewport')
  await expect(viewport).toBeVisible()
  const h = (await page.locator('.scan__header').boundingBox())!
  const v = (await viewport.boundingBox())!
  const p = (await page.locator('.scan__panel').boundingBox())!
  const vh = page.viewportSize()!.height
  expect(h.y + h.height).toBeLessThanOrEqual(v.y + 0.5)
  expect(v.y + v.height).toBeLessThanOrEqual(p.y + 0.5)
  const buttons = page.locator('.scan__actions > *')
  for (let i = 0; i < (await buttons.count()); i++) {
    const b = (await buttons.nth(i).boundingBox())!
    expect(b.y).toBeGreaterThanOrEqual(0)
    expect(b.y + b.height).toBeLessThanOrEqual(vh - 16)
  }
  return v
}

test('scanner at 360x640: buttons clear the bottom, viewport is 15% smaller, reticle inside it', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/b/sample-textbook')
  const v = await expectScannerLayout(page)
  expect(v.height).toBeLessThanOrEqual(640 * 0.85)
  const r = (await page.locator('.scan__reticle').boundingBox())!
  expect(r.x).toBeGreaterThanOrEqual(v.x - 0.5)
  expect(r.y).toBeGreaterThanOrEqual(v.y - 0.5)
  expect(r.x + r.width).toBeLessThanOrEqual(v.x + v.width + 0.5)
  expect(r.y + r.height).toBeLessThanOrEqual(v.y + v.height + 0.5)
})

test('scanner in landscape keeps every zone visible', async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 360 })
  await page.goto('/b/sample-textbook')
  await expectScannerLayout(page)
})

test.describe('Spanish device', () => {
  test.use({ locale: 'es-MX' })

  test('scanner at 360x640 keeps every zone visible', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 640 })
    await page.goto('/b/sample-textbook')
    await expectScannerLayout(page)
  })
})
