import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/renderApp'

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as never
  HTMLMediaElement.prototype.pause = vi.fn() as never
})
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

const saved = { v: 1, bookId: 'book-a', unitId: 'unit-1', trackId: 't-12a' }

describe('Continue card', () => {
  it('is hidden with no progress', () => {
    renderApp('/')
    expect(screen.queryByRole('link', { name: /continue/i })).not.toBeInTheDocument()
  })

  it('is hidden with stale progress', () => {
    localStorage.setItem('pe.progress', JSON.stringify({ ...saved, trackId: 'gone' }))
    renderApp('/')
    expect(screen.queryByRole('link', { name: /continue/i })).not.toBeInTheDocument()
  })

  it('shows book, unit and track label and links to the saved track', () => {
    localStorage.setItem('pe.progress', JSON.stringify(saved))
    renderApp('/')
    const card = screen.getByRole('link', { name: /continue/i })
    expect(card).toHaveAttribute('href', '/b/book-a/u/unit-1/t/t-12a')
    expect(within(card).getByText(/12a/)).toBeInTheDocument()
    expect(within(card).getByText(/Book A Textbook/)).toBeInTheDocument()
    expect(within(card).getByText(/Hello/)).toBeInTheDocument()
  })

  it('opening a track page records progress', () => {
    renderApp('/b/book-a/u/unit-1/t/t-2')
    expect(JSON.parse(localStorage.getItem('pe.progress')!)).toEqual({
      v: 1,
      bookId: 'book-a',
      unitId: 'unit-1',
      trackId: 't-2',
    })
  })

  it('pressing play writes pe.progress', async () => {
    const user = userEvent.setup()
    renderApp('/b/book-a/u/unit-1/t/t-1')
    localStorage.removeItem('pe.progress')
    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(JSON.parse(localStorage.getItem('pe.progress')!).trackId).toBe('t-1')
  })
})
