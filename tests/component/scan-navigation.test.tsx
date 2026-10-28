import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/renderApp'
import { testCatalog } from '../fixtures/testCatalog'
import { findBadges, pickBadge } from '../../src/scan/badges'
import { readNumber } from '../../src/scan/ocr'

vi.mock('../../src/scan/badges', () => ({ findBadges: vi.fn(() => []), pickBadge: vi.fn() }))
vi.mock('../../src/scan/ocr', () => ({
  initOcr: vi.fn(async () => {}),
  readNumber: vi.fn(),
  terminateOcr: vi.fn(async () => {}),
}))
vi.mock('../../src/scan/camera', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/scan/camera')>()),
  grabFrame: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
  useCameraAvailable: () => true,
}))

const crop = { data: new Uint8ClampedArray(4), width: 1, height: 1 }
const badge = { kind: 'badge', candidate: { box: { x: 0, y: 0, w: 1, h: 1 }, distance: 0, relWidth: 0.3, crop } }

function scanning(number: string) {
  vi.mocked(findBadges).mockReturnValue([])
  vi.mocked(pickBadge).mockReturnValue(badge as never)
  vi.mocked(readNumber).mockResolvedValue({ number, confidence: 90 })
}

async function scanAndOpen(user: ReturnType<typeof userEvent.setup>, number: string) {
  scanning(number)
  await user.click(screen.getByRole('button', { name: 'Scan audio icon' }))
  await user.click(await screen.findByRole('button', { name: 'Open' }, { timeout: 3000 }))
}

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  const track = { stop: vi.fn() }
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })) },
  })
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as never
  HTMLMediaElement.prototype.pause = vi.fn() as never
})
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('scan navigation from the Book page', () => {
  it('opens the track and goes back to the track’s unit list', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/b/book-a')
    await scanAndOpen(user, '2')
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-1/t/t-2')
    expect(await screen.findByRole('heading', { name: 'Track 2' })).toBeInTheDocument()
    await router.navigate(-1)
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-1')
    await router.navigate(-1)
    expect(router.state.location.pathname).toBe('/b/book-a')
  })

  it('saves progress so Home offers Continue for the scanned track', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/b/book-a')
    await scanAndOpen(user, '2')
    await screen.findByRole('heading', { name: 'Track 2' })
    await router.navigate('/')
    expect(await screen.findByText(/continue: track 2/i)).toBeInTheDocument()
  })
})

describe('scan navigation from a unit page', () => {
  it('opens a same-unit track with a single push and back returns to the unit list', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/b/book-a/u/unit-1')
    await scanAndOpen(user, '2')
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-1/t/t-2')
    await router.navigate(-1)
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-1')
    await router.navigate(-1)
    // a single push: back again leaves the app's history entirely (initial entry)
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-1')
  })

  it('opens a track in another unit via that unit’s list', async () => {
    const user = userEvent.setup()
    const book = testCatalog.books[0]!
    const catalog = {
      ...testCatalog,
      books: [
        {
          ...book,
          units: [
            book.units[0]!,
            { id: 'unit-2', number: '2', title: 'Goodbye', tracks: [{ id: 't-3', label: '3', file: 'sample/three.mp3' }] },
          ],
        },
      ],
    }
    const { router } = renderApp('/b/book-a/u/unit-1', catalog)
    await router.navigate('/b/book-a/u/unit-2')
    await scanAndOpen(user, '2')
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-1/t/t-2')
    await router.navigate(-1)
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-1')
    await router.navigate(-1)
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-2')
  })
})
