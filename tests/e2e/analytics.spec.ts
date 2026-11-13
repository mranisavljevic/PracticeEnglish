import { test, expect, type Page } from '@playwright/test'

type Body = Record<string, unknown>

const GOOGLE = /(googletagmanager|google-analytics)\.com/

/** Fulfils gtag.js with an empty script (nothing leaves the machine) and counts every request to Google hosts. */
async function interceptGoogle(page: Page, { block = false } = {}) {
  const requests: string[] = []
  page.on('request', (r) => {
    if (GOOGLE.test(r.url())) requests.push(r.url())
  })
  await page.route(GOOGLE, (route) => (block ? route.abort() : route.fulfill({ status: 200, contentType: 'text/javascript', body: '' })))
  return requests
}

/** The events the app queued on `dataLayer`, in order, as `{ type, ...params }`. */
const dataLayerEvents = (page: Page) =>
  page.evaluate(() =>
    ((window as unknown as { dataLayer?: ArrayLike<unknown>[] }).dataLayer ?? [])
      .map((a) => Array.from(a))
      .filter((c) => c[0] === 'event')
      .map((c) => ({ type: c[1], ...(c[2] as object) })) as Body[],
  )

const grantConsent = (page: Page) => page.addInitScript(() => localStorage.setItem('pe.consent', 'granted'))

const common = (ui_lang = 'en') => ({ app: 'practice-english', ui_lang, device_class: 'desktop' })
const ids = (track: string) => ({ level: 'level-1', book_type: 'textbook', unit: 'unit-1', track })
const started = (source: string, track: string) => ({ type: 'track_started', ...common(), source, ...ids(track) })

async function play(page: Page) {
  const audio = page.locator('audio')
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await expect.poll(() => audio.evaluate((a: HTMLAudioElement) => !a.paused || a.ended)).toBe(true)
}

async function openTrack1(page: Page) {
  await page.goto('/')
  await page.getByRole('link', { name: /Sample Textbook/ }).click()
  await page.getByRole('link', { name: /Meeting People/ }).click()
  await page.getByRole('link', { name: 'Track 1', exact: true }).click()
}

test('a visit with consent queues one visit with the common params; reload adds none', async ({ page }) => {
  await interceptGoogle(page)
  await grantConsent(page)
  await page.goto('/')
  await expect.poll(() => dataLayerEvents(page)).toEqual([{ type: 'visit', ...common() }])
  await expect(page.locator('script[src*="googletagmanager.com/gtag/js?id=G-TEST123"]')).toHaveCount(1)
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.waitForTimeout(300)
  expect(await dataLayerEvents(page)).toEqual([])
})

test('a scripted journey records exactly the expected events and nothing else (SC-002)', async ({ page }) => {
  await interceptGoogle(page)
  await grantConsent(page)
  await page.route('**/sample/track-15.mp3', (route) => route.abort())
  const count = () => dataLayerEvents(page).then((e) => e.length)

  // visit, then pick a track from the lists
  await openTrack1(page)
  await play(page)
  await expect.poll(count).toBe(2)

  // replay, then Next
  await page.getByRole('button', { name: 'Replay' }).click()
  await expect.poll(count).toBe(3)
  await page.getByRole('link', { name: 'Next' }).click()
  await expect(page).toHaveURL(/track-2$/)
  await play(page)
  await expect.poll(count).toBe(4)

  // a track whose audio cannot load
  await page.getByRole('link', { name: /back/i }).click()
  await page.getByRole('link', { name: 'Track 15', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect.poll(count).toBe(5)

  // Continue card
  await page.getByRole('link', { name: /back/i }).click()
  await page.getByRole('link', { name: 'Track 2', exact: true }).click()
  await play(page)
  await expect.poll(count).toBe(6)
  await page.getByRole('link', { name: 'PracticeEnglish' }).click()
  await page.getByRole('link', { name: /continue/i }).click()
  await play(page)
  await expect.poll(count).toBe(8)

  // language change
  await page.getByRole('combobox').selectOption('es')
  await expect.poll(count).toBe(9)

  expect(await dataLayerEvents(page)).toEqual([
    { type: 'visit', ...common() },
    started('navigation', 'track-1'),
    started('repeat', 'track-1'),
    started('next', 'track-2'),
    { type: 'error', ...common(), error_type: 'playback-failure', ...ids('track-15') },
    started('navigation', 'track-2'),
    { type: 'resume_used', ...common() },
    started('resume', 'track-2'),
    { type: 'language_changed', ...common('es') },
  ])
})

test('accepting in the banner loads GA and queues the visit', async ({ page }) => {
  const requests = await interceptGoogle(page)
  await page.goto('/')
  await expect(page.getByRole('region', { name: /help improve/i })).toBeVisible()
  expect(requests).toEqual([])
  await page.getByRole('button', { name: 'Accept' }).click()
  await expect.poll(() => dataLayerEvents(page)).toEqual([{ type: 'visit', ...common() }])
  expect(requests.length).toBeGreaterThan(0)
  await expect(page.getByRole('region', { name: /help improve/i })).toHaveCount(0)
})

test('the app works unchanged when Google is blocked (SC-003)', async ({ page }) => {
  await interceptGoogle(page, { block: true })
  await grantConsent(page)
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await openTrack1(page)
  await play(page)
  await page.getByRole('link', { name: 'Next' }).click()
  await expect(page).toHaveURL(/track-2$/)
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test.describe('nothing reaches Google', () => {
  const cases: [string, (page: Page) => Promise<void>][] = [
    ['without a consent choice', async () => {}],
    ['after declining', async (page) => void (await page.addInitScript(() => localStorage.setItem('pe.consent', 'declined')))],
    [
      'with Do Not Track, even with stored consent',
      async (page) => {
        await grantConsent(page)
        await page.addInitScript(() => Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true }))
      },
    ],
    [
      'with Global Privacy Control, even with stored consent',
      async (page) => {
        await grantConsent(page)
        await page.addInitScript(() => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true }))
      },
    ],
  ]
  for (const [name, arrange] of cases) {
    test(name, async ({ page }) => {
      const requests = await interceptGoogle(page)
      await arrange(page)
      await openTrack1(page)
      await play(page)
      await page.getByRole('combobox').selectOption('es')
      await page.waitForTimeout(500)
      expect(requests).toEqual([])
      expect(await dataLayerEvents(page)).toEqual([])
    })
  }
})
