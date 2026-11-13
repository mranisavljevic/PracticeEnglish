import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'

type Dict = Record<string, string>
const load = (c: string) => JSON.parse(readFileSync(`src/locales/${c}.json`, 'utf8')) as Dict
const frD = load('fr')
const enD = load('en')
const esD = load('es')

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

test.describe('French device', () => {
  test.use({ locale: 'fr-FR' })

  test('UI is French across the journey, consent, 404 and offline', async ({ page, context }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(frD['home.title']!)
    await expect(page.getByText('Sample Textbook: A Deliberately Long English Title', { exact: false })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('fr')

    await page.getByRole('link', { name: /Sample Textbook/ }).first().click()
    await expect(page).toHaveURL(/\/b\/sample-textbook$/)
    await page.goto('/b/sample-textbook/u/unit-1')
    await page.goto('/b/sample-textbook/u/unit-1/t/track-1')
    await expect(page.getByRole('button', { name: frD['player.play']! })).toBeVisible()

    const body = (await page.locator('body').innerText()).replace(/\s+/g, ' ')
    for (const k of ['home.title', 'player.play', 'nav.back']) {
      if (enD[k] !== frD[k]) expect(body).not.toContain(enD[k])
      if (esD[k] !== frD[k]) expect(body).not.toContain(esD[k])
    }

    await page.goto('/nope')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(frD['error.notFound']!)

    await page.goto('/b/sample-textbook/u/unit-1/t/track-1')
    await context.setOffline(true)
    await expect(page.getByText(frD['error.offline']!).first()).toBeVisible()
    await context.setOffline(false)
  })

  test('consent banner is French (analytics-enabled server)', async ({ page }) => {
    await page.goto('http://localhost:5175/')
    await expect(page.getByRole('heading', { name: frD['consent.title']! })).toBeVisible()
    await expect(page.getByRole('button', { name: frD['consent.accept']! })).toBeVisible()
  })

  test('choice persists across reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('combobox').selectOption('es')
    await page.getByRole('combobox').selectOption('fr')
    await page.reload()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(frD['home.title']!)
    expect(await page.evaluate(() => localStorage.getItem('pe.lang'))).toBe('fr')
  })

  test('selector lists Français, sets html lang, switches without reload', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('combobox').selectOption('en')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Choose your book')
    const opts = await page.getByRole('combobox').locator('option').allTextContents()
    expect(opts).toEqual(expect.arrayContaining(['English', 'Español', 'Français']))

    let navs = 0
    page.on('load', () => navs++)
    page.on('framenavigated', () => navs++)
    await page.getByRole('combobox').selectOption('fr')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(frD['home.title']!, { timeout: 1000 })
    expect(navs).toBe(0)
    expect(await page.evaluate(() => document.documentElement.lang)).toBe('fr')
  })
})

test.describe('French Canadian device', () => {
  test.use({ locale: 'fr-CA' })
  test('first load is French', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(frD['home.title']!)
  })
})
