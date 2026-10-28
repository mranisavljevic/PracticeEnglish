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
