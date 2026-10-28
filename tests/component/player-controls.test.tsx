import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/renderApp'

let playSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  playSpy = vi.fn(() => Promise.resolve())
  HTMLMediaElement.prototype.play = playSpy as never
  HTMLMediaElement.prototype.pause = vi.fn() as never
  HTMLMediaElement.prototype.load = vi.fn() as never
})
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

const audioOf = (c: HTMLElement) => c.querySelector('audio') as HTMLAudioElement

describe('Player controls', () => {
  it('Replay restarts at 0:00 and plays', async () => {
    const user = userEvent.setup()
    const { container } = renderApp('/b/book-a/u/unit-1/t/t-1')
    const audio = audioOf(container)
    audio.currentTime = 3
    await user.click(screen.getByRole('button', { name: /replay/i }))
    expect(audio.currentTime).toBe(0)
    expect(playSpy).toHaveBeenCalled()
  })

  it('Previous/Next link to siblings and are absent at unit edges', () => {
    const { unmount } = renderApp('/b/book-a/u/unit-1/t/t-2')
    expect(screen.getByRole('link', { name: /previous/i })).toHaveAttribute('href', '/b/book-a/u/unit-1/t/t-1')
    expect(screen.getByRole('link', { name: /next/i })).toHaveAttribute('href', '/b/book-a/u/unit-1/t/t-12a')
    unmount()
    renderApp('/b/book-a/u/unit-1/t/t-1')
    expect(screen.queryByRole('link', { name: /previous/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /next/i })).toBeInTheDocument()
  })

  it('no Next on the last track of a unit', () => {
    renderApp('/b/book-a/u/unit-1/t/t-12a')
    expect(screen.queryByRole('link', { name: /next/i })).not.toBeInTheDocument()
  })

  it('on ended: stops, does not navigate, Replay and Next remain visible', () => {
    const { container, router } = renderApp('/b/book-a/u/unit-1/t/t-2')
    act(() => {
      fireEvent(audioOf(container), new Event('ended'))
    })
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-1/t/t-2')
    expect(screen.getByRole('button', { name: /replay/i })).toBeVisible()
    expect(screen.getByRole('link', { name: /next/i })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('speed toggles 0.75/1, resets on track change, is not persisted', async () => {
    const user = userEvent.setup()
    const { container, router } = renderApp('/b/book-a/u/unit-1/t/t-1')
    expect(audioOf(container).playbackRate).toBe(1)
    await user.click(screen.getByRole('button', { name: /speed/i }))
    expect(audioOf(container).playbackRate).toBe(0.75)
    expect(screen.getByRole('button', { name: /speed/i })).toHaveTextContent('0.75')
    await user.click(screen.getByRole('button', { name: /speed/i }))
    expect(audioOf(container).playbackRate).toBe(1)
    await user.click(screen.getByRole('button', { name: /speed/i }))
    await act(async () => {
      await router.navigate('/b/book-a/u/unit-1/t/t-2')
    })
    expect(audioOf(container).playbackRate).toBe(1)
    expect(screen.getByRole('button', { name: /speed/i })).toHaveTextContent('1×')
    expect(JSON.stringify({ ...localStorage })).not.toMatch(/speed|rate/i)
  })
})
