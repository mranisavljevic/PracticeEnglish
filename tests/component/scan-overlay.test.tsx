import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { CatalogProvider } from '../../src/content/CatalogProvider'
import { LocaleProvider } from '../../src/i18n/LocaleProvider'
import { ScanOverlay } from '../../src/components/ScanOverlay'
import { findBadges, pickBadge } from '../../src/scan/badges'
import { readNumber, initOcr } from '../../src/scan/ocr'
import { testCatalog } from '../fixtures/testCatalog'

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

const track = { stop: vi.fn() }
const stream = { getTracks: () => [track] } as unknown as MediaStream
const crop = { data: new Uint8ClampedArray(4), width: 1, height: 1 }
const badge = { kind: 'badge', candidate: { box: { x: 0, y: 0, w: 1, h: 1 }, distance: 0, relWidth: 0.3, crop } }

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>
}

function Harness() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}>opener</button>
      {open && <ScanOverlay bookId="book-a" onClose={() => setOpen(false)} />}
      <Location />
    </>
  )
}

function renderHarness() {
  return render(
    <CatalogProvider catalog={testCatalog}>
      <LocaleProvider>
        <MemoryRouter initialEntries={['/b/book-a']}>
          <Harness />
        </MemoryRouter>
      </LocaleProvider>
    </CatalogProvider>,
  )
}

async function openOverlay() {
  const user = userEvent.setup()
  renderHarness()
  await user.click(screen.getByText('opener'))
  return user
}

async function openOverlayWith(arrange: () => void) {
  arrange()
  return openOverlay()
}

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  track.stop.mockClear()
  vi.mocked(findBadges).mockReturnValue([])
  vi.mocked(pickBadge).mockReturnValue({ kind: 'none' })
  vi.mocked(readNumber).mockResolvedValue(null)
  vi.mocked(initOcr).mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(async () => stream) },
  })
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as never
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('ScanOverlay', () => {
  it('shows a dialog with instructions and an aim reticle', async () => {
    await openOverlay()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByText(/point the camera at the audio icon/i)).toBeInTheDocument()
    expect(dialog.querySelector('.scan__reticle')).not.toBeNull()
    expect(dialog.querySelector('video')).not.toBeNull()
  })

  it('shows the detected number and an Open button once a matching number is stable', async () => {
    vi.mocked(pickBadge).mockReturnValue(badge as never)
    vi.mocked(readNumber).mockResolvedValue({ number: '2', confidence: 90 })
    await openOverlay()
    expect(await screen.findByText('Track 2', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open' })).toBeInTheDocument()
  })

  it('updates the number on re-aim without navigating', async () => {
    vi.mocked(pickBadge).mockReturnValue(badge as never)
    vi.mocked(readNumber).mockResolvedValue({ number: '2', confidence: 90 })
    await openOverlay()
    await screen.findByText('Track 2', {}, { timeout: 3000 })
    vi.mocked(readNumber).mockResolvedValue({ number: '1', confidence: 90 })
    expect(await screen.findByText('Track 1', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('/b/book-a')
  })

  it('shows a not-found message and no Open button for a number outside the book', async () => {
    vi.mocked(pickBadge).mockReturnValue(badge as never)
    vi.mocked(readNumber).mockResolvedValue({ number: '99', confidence: 90 })
    await openOverlay()
    expect(await screen.findByText('Track 99 is not in this book.', {}, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open' })).not.toBeInTheDocument()
  })

  it('shows tips when nothing is read for about five seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    renderHarness()
    fireEvent.click(screen.getByText('opener'))
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(screen.queryByText(/can't read it yet/i)).not.toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(5000))
    expect(screen.getByText(/can't read it yet/i)).toBeInTheDocument()
  })

  it('asks the student to move closer when the badge is too small', async () => {
    vi.mocked(pickBadge).mockReturnValue({ kind: 'tooSmall' })
    await openOverlay()
    expect(await screen.findByText('Move closer to the audio icon.')).toBeInTheDocument()
  })

  it('says several badges are in view and opens nothing when ambiguous', async () => {
    vi.mocked(pickBadge).mockReturnValue({ kind: 'ambiguous' })
    await openOverlay()
    expect(await screen.findByText(/several audio icons/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Open' })).not.toBeInTheDocument()
  })

  it('stops all camera tracks when the page is hidden', async () => {
    await openOverlay()
    await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled())
    await act(async () => {})
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(track.stop).toHaveBeenCalled()
  })

  it('closes on Cancel and stops all tracks', async () => {
    const user = await openOverlay()
    await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled())
    await act(async () => {})
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(track.stop).toHaveBeenCalled()
  })

  it('closes on Escape and stops all tracks', async () => {
    const user = await openOverlay()
    await waitFor(() => expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalled())
    await act(async () => {})
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(track.stop).toHaveBeenCalled()
  })

  it('moves focus into the dialog and restores it on close', async () => {
    const user = userEvent.setup()
    renderHarness()
    const opener = screen.getByText('opener')
    await user.click(opener)
    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(opener).toHaveFocus()
  })

  describe('errors', () => {
    const fail = (name: string) =>
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(Object.assign(new Error(name), { name }))

    it('explains a denied permission and offers Choose manually', async () => {
      await openOverlayWith(() => fail('NotAllowedError'))
      expect(await screen.findByText(/camera access is blocked/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Choose manually' })).toBeInTheDocument()
    })

    it.each(['NotFoundError', 'NotReadableError'])('shows the unavailable message for %s', async (name) => {
      await openOverlayWith(() => fail(name))
      expect(await screen.findByText(/scanner could not start/i)).toBeInTheDocument()
    })

    it('Choose manually closes the overlay and leaves the page unchanged', async () => {
      const user = await openOverlayWith(() => fail('NotAllowedError'))
      await user.click(await screen.findByRole('button', { name: 'Choose manually' }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(screen.getByTestId('location')).toHaveTextContent('/b/book-a')
    })

    it('shows the unavailable message and stops the camera when OCR cannot start', async () => {
      vi.mocked(initOcr).mockRejectedValue(new Error('wasm failed'))
      await openOverlay()
      expect(await screen.findByText(/scanner could not start/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Choose manually' })).toBeInTheDocument()
      expect(track.stop).toHaveBeenCalled()
    })
  })
})
