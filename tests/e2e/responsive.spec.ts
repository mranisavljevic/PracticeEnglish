import { test, expect, type Page } from '@playwright/test'

const routes = [
  '/',
  '/b/sample-textbook',
  '/b/sample-textbook/u/unit-1',
  '/b/sample-textbook/u/unit-1/t/track-12a',
  '/nope',
]

for (const vp of [
  { width: 360, height: 740 },
  { width: 1280, height: 800 },
]) {
  test(`no horizontal scroll at ${vp.width}px on every route`, async ({ page }) => {
    await page.setViewportSize(vp)
    for (const r of routes) {
      await page.goto(r)
      const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
      expect(fits, r).toBe(true)
    }
  })
}

async function tabTo(page: Page, name: RegExp) {
  // Safari only tabs to links with Option held.
  const key = page.context().browser()?.browserType().name() === 'webkit' ? 'Alt+Tab' : 'Tab'
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press(key)
    const label = await page.evaluate(
      () => (document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent ?? '').trim(),
    )
    if (name.test(label)) return
  }
  throw new Error(`could not tab to ${name}`)
}

const h1Focused = (page: Page) => page.evaluate(() => document.activeElement === document.querySelector('main h1'))

test('journey is keyboard operable and focus lands on the h1 after each step', async ({ page }) => {
  await page.goto('/')
  await tabTo(page, /Sample Textbook/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/b\/sample-textbook$/)
  await expect.poll(() => h1Focused(page)).toBe(true)

  await tabTo(page, /Meeting People/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/u\/unit-1$/)
  await expect.poll(() => h1Focused(page)).toBe(true)

  await tabTo(page, /Track 2/)
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/t\/track-2$/)
  await expect.poll(() => h1Focused(page)).toBe(true)

  await tabTo(page, /^Play$/)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button', { name: /^(Pause|Play)$/ })).toBeVisible()

  await page.keyboard.press('Alt+ArrowLeft')
})

test('Back control moves focus to the h1', async ({ page }) => {
  await page.goto('/b/sample-textbook/u/unit-1')
  await page.getByRole('link', { name: /back/i }).click()
  await expect(page).toHaveURL(/\/b\/sample-textbook$/)
  await expect.poll(() => h1Focused(page)).toBe(true)
})

test('player buttons are at least 44px tall', async ({ page }) => {
  await page.goto('/b/sample-textbook/u/unit-1/t/track-1')
  for (const b of await page.locator('.player button, .player a').all()) {
    const box = await b.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
})
