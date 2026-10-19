import { test, expect } from '@playwright/test'

test.describe('Spanish device', () => {
  test.use({ locale: 'es-MX' })

  test('UI is Spanish, switch to English persists across reload, English titles stay visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Elige tu libro')
    await expect(page.getByText('Sample Textbook: A Deliberately Long English Title', { exact: false })).toBeVisible()

    await page.getByRole('combobox').selectOption('en')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose your book')
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose your book')
  })
})
