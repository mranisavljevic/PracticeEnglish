import { test, expect } from '@playwright/test'

test('Home → book → unit → track → player in ≤4 taps; Back returns one level', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /Sample Textbook/ }).click()
  await page.getByRole('link', { name: /Meeting People/ }).click()
  await page.getByRole('link', { name: /Track 12a/ }).click()
  await expect(page).toHaveURL(/\/b\/sample-textbook\/u\/unit-1\/t\/track-12a$/)
  const play = page.getByRole('button', { name: 'Play' })
  await expect(play).toBeVisible()
  const audio = page.locator('audio')
  await expect(audio).toHaveAttribute('src', 'http://localhost:5174/sample/track-12a.mp3')

  await page.getByRole('link', { name: /back/i }).click()
  await expect(page).toHaveURL(/\/b\/sample-textbook\/u\/unit-1$/)
})

test('direct link opens the player without autoplay', async ({ page }) => {
  await page.goto('/b/sample-textbook/u/unit-1/t/track-1')
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
  const paused = await page.locator('audio').evaluate((a: HTMLAudioElement) => a.paused)
  expect(paused).toBe(true)
})

test('audio is served with range support', async ({ request }) => {
  const res = await request.get('http://localhost:5174/sample/track-1.mp3', { headers: { Range: 'bytes=0-99' } })
  expect(res.status()).toBe(206)
})
