import { test, expect, type Page } from '@playwright/test'

type Body = Record<string, unknown>

/** Intercepts the collector (nothing leaves the machine) and records each event body. */
async function captureCollector(page: Page, { block = false } = {}) {
  const events: Body[] = []
  await page.route('**/api/e', async (route) => {
    const body = route.request().postData()
    if (body) events.push(JSON.parse(body))
    if (block) await route.abort()
    else await route.fulfill({ status: 204 })
  })
  return events
}

const ids = (track: string) => ({ level: 'level-1', bookType: 'textbook', unit: 'unit-1', track })
const started = (label: string, track: string) => ({
  type: 'track_started',
  lang: 'en',
  device: 'desktop',
  label,
  ...ids(track),
})

async function play(page: Page) {
  const audio = page.locator('audio')
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => !a.paused || a.ended)).toBe(true)
}

test('a scripted journey records exactly the expected events and nothing else (SC-002)', async ({ page }) => {
  const events = await captureCollector(page)
  await page.route('**/sample/track-15.mp3', (route) => route.abort())

  // visit, then pick a track from the lists
  await page.goto('/')
  await page.getByRole('link', { name: /Sample Textbook/ }).click()
  await page.getByRole('link', { name: /Meeting People/ }).click()
  await page.getByRole('link', { name: 'Track 1', exact: true }).click()
  await play(page)
  await expect.poll(() => events.length).toBe(2)

  // replay, then Next
  await page.getByRole('button', { name: 'Replay' }).click()
  await expect.poll(() => events.length).toBe(3)
  await page.getByRole('link', { name: 'Next' }).click()
  await expect(page).toHaveURL(/track-2$/)
  await play(page)
  await expect.poll(() => events.length).toBe(4)

  // a track whose audio cannot load
  await page.getByRole('link', { name: /back/i }).click()
  await page.getByRole('link', { name: 'Track 15', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect.poll(() => events.length).toBe(5)

  // Continue card
  await page.getByRole('link', { name: /back/i }).click()
  await page.getByRole('link', { name: 'Track 2', exact: true }).click()
  await play(page)
  await expect.poll(() => events.length).toBe(6)
  await page.getByRole('link', { name: 'PracticeEnglish' }).click()
  await page.getByRole('link', { name: /continue/i }).click()
  await play(page)
  await expect.poll(() => events.length).toBe(8)

  // language change
  await page.getByRole('combobox').selectOption('es')
  await expect.poll(() => events.length).toBe(9)

  expect(events).toEqual([
    { type: 'visit', lang: 'en', device: 'desktop' },
    started('navigation', 'track-1'),
    started('repeat', 'track-1'),
    started('next', 'track-2'),
    { type: 'error', lang: 'en', device: 'desktop', label: 'playback-failure', ...ids('track-15') },
    started('navigation', 'track-2'),
    { type: 'resume_used', lang: 'en', device: 'desktop' },
    started('resume', 'track-2'),
    { type: 'language_changed', lang: 'es', device: 'desktop' },
  ])
})

test('reloading does not add a visit', async ({ page }) => {
  const events = await captureCollector(page)
  await page.goto('/')
  await expect.poll(() => events.length).toBe(1)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.waitForTimeout(300)
  expect(events).toEqual([{ type: 'visit', lang: 'en', device: 'desktop' }])
})

test('the app works unchanged when the collector is blocked (SC-005)', async ({ page }) => {
  await captureCollector(page, { block: true })
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await page.getByRole('link', { name: /Sample Textbook/ }).click()
  await page.getByRole('link', { name: /Meeting People/ }).click()
  await page.getByRole('link', { name: 'Track 1', exact: true }).click()
  await play(page)
  await page.getByRole('link', { name: 'Next' }).click()
  await expect(page).toHaveURL(/track-2$/)
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('Do Not Track sends nothing at all', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true }))
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('/api/e')) requests.push(r.url())
  })
  await captureCollector(page)
  await page.goto('/')
  await page.getByRole('link', { name: /Sample Textbook/ }).click()
  await page.getByRole('link', { name: /Meeting People/ }).click()
  await page.getByRole('link', { name: 'Track 1', exact: true }).click()
  await play(page)
  await page.getByRole('combobox').selectOption('es')
  await page.waitForTimeout(500)
  expect(requests).toEqual([])
})
