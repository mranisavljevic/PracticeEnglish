import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/renderApp'
import { captureEvents, restoreEvents } from '../helpers/analytics'
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

let cap: ReturnType<typeof captureEvents>

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  const track = { stop: vi.fn() }
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })) },
  })
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as never
  HTMLMediaElement.prototype.pause = vi.fn() as never
  HTMLMediaElement.prototype.load = vi.fn()
  cap = captureEvents()
  sessionStorage.setItem('pe.visit', '1')
})
afterEach(restoreEvents)

const labels = async () => (await cap.events()).filter((e) => e.type === 'track_started').map((e) => e.label)

async function playOnce(container: HTMLElement) {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Play' }))
  act(() => void fireEvent(container.querySelector('audio')!, new Event('playing')))
  return user
}

describe('source hand-off', () => {
  it('Open in the scan overlay arrives as scan, with the catalog ids', async () => {
    vi.mocked(findBadges).mockReturnValue([])
    vi.mocked(pickBadge).mockReturnValue(badge as never)
    vi.mocked(readNumber).mockResolvedValue({ number: '2', confidence: 90 })
    const { container } = renderApp('/b/book-a')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Scan audio icon' }))
    await user.click(await screen.findByRole('button', { name: 'Open' }, { timeout: 3000 }))
    await playOnce(container)
    expect(await cap.events()).toEqual([
      { type: 'track_started', lang: 'en', device: 'mobile', label: 'scan', level: 'level-1', bookType: 'textbook', unit: 'unit-1', track: 't-2' },
    ])
  })

  it('the Continue card arrives as resume and records resume_used', async () => {
    localStorage.setItem('pe.progress', JSON.stringify({ v: 1, bookId: 'book-a', unitId: 'unit-1', trackId: 't-12a' }))
    const { container } = renderApp('/')
    const user = userEvent.setup()
    await user.click(screen.getByRole('link', { name: /continue/i }))
    await playOnce(container)
    expect((await cap.events()).map((e) => [e.type, e.label])).toEqual([
      ['resume_used', undefined],
      ['track_started', 'resume'],
    ])
  })

  it('a list pick arrives as navigation', async () => {
    const { container } = renderApp('/b/book-a/u/unit-1')
    const user = userEvent.setup()
    await user.click(screen.getByRole('link', { name: /Track 2/ }))
    await playOnce(container)
    expect(await labels()).toEqual(['navigation'])
  })

  it('Next arrives as next on the new track page, which stays mounted', async () => {
    const { container } = renderApp('/b/book-a/u/unit-1/t/t-1')
    const user = await playOnce(container)
    await user.click(screen.getByRole('link', { name: 'Next' }))
    await playOnce(container)
    expect(await labels()).toEqual(['navigation', 'next'])
  })

  it('direct links and Previous count as navigation', async () => {
    const { container } = renderApp('/b/book-a/u/unit-1/t/t-2')
    const user = userEvent.setup()
    await user.click(screen.getByRole('link', { name: 'Previous' }))
    await playOnce(container)
    expect(await labels()).toEqual(['navigation'])
  })

  it('clears the source from the history entry, so a reload or back/forward reads navigation', async () => {
    localStorage.setItem('pe.progress', JSON.stringify({ v: 1, bookId: 'book-a', unitId: 'unit-1', trackId: 't-12a' }))
    const { router } = renderApp('/')
    await userEvent.setup().click(screen.getByRole('link', { name: /continue/i }))
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-1/t/t-12a')
    expect(router.state.location.state).toBeNull()
  })
})
