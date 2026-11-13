import { test, expect } from '@playwright/test'

test('Volume 4: home → book → unit → play in ≤3 taps; Continue returns to it', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /English in Action 4: Student Book/ }).click()
  await page.getByRole('link', { name: /Unit 1: Education/ }).click()
  await page.getByRole('link', { name: /Track 2/ }).click()
  await expect(page).toHaveURL(/\/b\/level-4-student-book\/u\/unit-1\/t\/track-2$/)
  await page.getByRole('button', { name: 'Play', exact: true }).click()

  await page.goto('/')
  const card = page.getByRole('link', { name: /continue/i })
  await expect(card).toBeVisible()
  await card.click()
  await expect(page).toHaveURL(/\/b\/level-4-student-book\/u\/unit-1\/t\/track-2$/)
})
