import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AnalyticsProvider } from '../../src/analytics/AnalyticsProvider'
import type { TrackIds } from '../../src/analytics/events'
import { Player } from '../../src/components/Player'
import { ScanOverlay } from '../../src/components/ScanOverlay'
import { CatalogProvider } from '../../src/content/CatalogProvider'
import { LocaleProvider } from '../../src/i18n/LocaleProvider'
import { findBadges, pickBadge } from '../../src/scan/badges'
import { readNumber } from '../../src/scan/ocr'
import { testCatalog } from '../fixtures/testCatalog'
import { captureEvents, restoreEvents } from '../helpers/analytics'

vi.mock('../../src/scan/badges', () => ({ findBadges: vi.fn(() => []), pickBadge: vi.fn() }))
vi.mock('../../src/scan/ocr', () => ({
  initOcr: vi.fn(async () => {}),
  readNumber: vi.fn(),
  terminateOcr: vi.fn(async () => {}),
}))
vi.mock('../../src/scan/camera', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/scan/camera')>()),
  grabFrame: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
}))

const ids: TrackIds = { level: 'level-1', bookType: 'textbook', unit: 'unit-1', track: 't-2' }
const playbackFailure = { type: 'error', lang: 'en', device: 'mobile', label: 'playback-failure', ...ids }

let cap: ReturnType<typeof captureEvents>
let play: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  play = vi.fn(() => Promise.resolve())
  HTMLMediaElement.prototype.play = play as never
  HTMLMediaElement.prototype.pause = vi.fn() as never
  HTMLMediaElement.prototype.load = vi.fn()
  cap = captureEvents()
  sessionStorage.setItem('pe.visit', '1')
})
afterEach(restoreEvents)

function setupPlayer() {
  const utils = render(
    <MemoryRouter>
      <LocaleProvider>
        <AnalyticsProvider>
          <Player src="http://audio.test/one.mp3" chooseAnotherTo="/u" source="navigation" ids={ids} />
        </AnalyticsProvider>
      </LocaleProvider>
    </MemoryRouter>,
  )
  return utils.container.querySelector('audio') as HTMLAudioElement
}

describe('playback failures', () => {
  it('an audio error event sends one playback-failure with the ids and no track_started', async () => {
    const audio = setupPlayer()
    act(() => void fireEvent(audio, new Event('error')))
    expect(await cap.events()).toEqual([playbackFailure])
  })

  it('a play() rejection other than AbortError sends playback-failure', async () => {
    play.mockRejectedValue(new DOMException('blocked', 'NotAllowedError'))
    setupPlayer()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Play' }))
    await act(async () => {})
    expect(await cap.events()).toEqual([playbackFailure])
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('an AbortError sends nothing', async () => {
    play.mockRejectedValue(new DOMException('interrupted', 'AbortError'))
    setupPlayer()
    await userEvent.setup().click(screen.getByRole('button', { name: 'Play' }))
    await act(async () => {})
    expect(await cap.events()).toEqual([])
  })

  it('the same failure again in this session sends nothing more', async () => {
    const audio = setupPlayer()
    act(() => void fireEvent(audio, new Event('error')))
    act(() => void fireEvent(audio, new Event('error')))
    play.mockRejectedValue(new DOMException('blocked', 'NotSupportedError'))
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }))
    await act(async () => {})
    expect(await cap.events()).toEqual([playbackFailure])
  })

  it('a failed retry that never plays still sends no track_started', async () => {
    const audio = setupPlayer()
    act(() => void fireEvent(audio, new Event('error')))
    await userEvent.setup().click(screen.getByRole('button', { name: /try again/i }))
    expect((await cap.events()).map((e) => e.type)).toEqual(['error'])
  })
})

describe('scan failures', () => {
  const track = { stop: vi.fn() }
  const crop = { data: new Uint8ClampedArray(4), width: 1, height: 1 }
  const badge = { kind: 'badge', candidate: { box: { x: 0, y: 0, w: 1, h: 1 }, distance: 0, relWidth: 0.3, crop } }

  function Harness() {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button onClick={() => setOpen(true)}>opener</button>
        {open && <ScanOverlay bookId="book-a" onClose={() => setOpen(false)} />}
      </>
    )
  }

  async function openScanner() {
    render(
      <CatalogProvider catalog={testCatalog}>
        <LocaleProvider>
          <AnalyticsProvider>
            <MemoryRouter initialEntries={['/b/book-a']}>
              <Harness />
            </MemoryRouter>
          </AnalyticsProvider>
        </LocaleProvider>
      </CatalogProvider>,
    )
    const user = userEvent.setup()
    await user.click(screen.getByText('opener'))
    return user
  }

  const scanFailure = { type: 'error', lang: 'en', device: 'mobile', label: 'scan-failure' }

  it('sends scan-failure when the camera cannot start, once per session', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(Object.assign(new Error('x'), { name: 'NotAllowedError' })) },
    })
    const user = await openScanner()
    expect(await screen.findByText(/camera access is blocked/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Choose manually' }))
    await user.click(screen.getByText('opener'))
    expect(await screen.findByText(/camera access is blocked/i)).toBeInTheDocument()
    expect(await cap.events()).toEqual([scanFailure])
  })

  it('sends scan-failure when the number is not in the book', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn(async () => ({ getTracks: () => [track] })) },
    })
    vi.mocked(findBadges).mockReturnValue([])
    vi.mocked(pickBadge).mockReturnValue(badge as never)
    vi.mocked(readNumber).mockResolvedValue({ number: '99', confidence: 90 })
    await openScanner()
    expect(await screen.findByText(/not in this book/i, {}, { timeout: 3000 })).toBeInTheDocument()
    expect(await cap.events()).toEqual([scanFailure])
  })
})

describe('unexpected errors', () => {
  it('window error and unhandledrejection send error/unexpected once, with only the type label', async () => {
    render(
      <LocaleProvider>
        <AnalyticsProvider>
          <p>app</p>
        </AnalyticsProvider>
      </LocaleProvider>,
    )
    act(() => {
      window.dispatchEvent(new ErrorEvent('error', { message: 'secret message with /path/to/file.ts' }))
      window.dispatchEvent(new ErrorEvent('error', { message: 'again' }))
      const rejection = new Event('unhandledrejection')
      Object.assign(rejection, { reason: new Error('another secret') })
      window.dispatchEvent(rejection)
    })
    const events = await cap.events()
    expect(events).toEqual([{ type: 'error', lang: 'en', device: 'mobile', label: 'unexpected' }])
    expect(JSON.stringify(events)).not.toMatch(/secret|path/)
  })

  it('stops listening after unmount', async () => {
    const { unmount } = render(
      <LocaleProvider>
        <AnalyticsProvider>
          <p>app</p>
        </AnalyticsProvider>
      </LocaleProvider>,
    )
    unmount()
    act(() => void window.dispatchEvent(new ErrorEvent('error', { message: 'late' })))
    expect(await cap.events()).toEqual([])
  })
})
