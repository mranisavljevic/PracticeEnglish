import { test, expect } from '@playwright/test'

test('play a track, reload home, Continue opens the same track', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /continue/i })).toHaveCount(0)

  await page.goto('/b/sample-textbook/u/unit-1/t/track-2')
  await page.getByRole('button', { name: 'Play' }).click()
  await page.goto('/')
  const card = page.getByRole('link', { name: /continue/i })
  await expect(card).toBeVisible()
  await card.click()
  await expect(page).toHaveURL(/\/t\/track-2$/)
  const t = await page.locator('audio').evaluate((a: HTMLAudioElement) => a.currentTime)
  expect(t).toBe(0)
})

test('stale progress shows no card and no error', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('pe.progress', JSON.stringify({ v: 1, bookId: 'x', unitId: 'y', trackId: 'z' })),
  )
  await page.goto('/')
  await expect(page.getByRole('link', { name: /continue/i })).toHaveCount(0)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

test('blocked storage: app still works', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked')
      },
    })
  })
  await page.goto('/')
  await page.getByRole('link', { name: /Sample Textbook/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
