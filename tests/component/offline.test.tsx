import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, act, fireEvent } from '@testing-library/react'
import { renderApp } from '../helpers/renderApp'

let online = true

beforeEach(() => {
  online = true
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online)
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as never
  HTMLMediaElement.prototype.pause = vi.fn() as never
})
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('offline notice', () => {
  it('appears on offline event and disappears on online', () => {
    renderApp('/')
    expect(screen.queryByText(/you are offline/i)).not.toBeInTheDocument()
    act(() => {
      online = false
      fireEvent(window, new Event('offline'))
    })
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument()
    act(() => {
      online = true
      fireEvent(window, new Event('online'))
    })
    expect(screen.queryByText(/you are offline/i)).not.toBeInTheDocument()
  })

  it('shows the notice at load when already offline', () => {
    online = false
    renderApp('/')
    expect(screen.getByText(/you are offline/i)).toBeInTheDocument()
  })

  it('an audio error while offline shows the offline message in the player', () => {
    const { container } = renderApp('/b/book-a/u/unit-1/t/t-1')
    act(() => {
      online = false
      fireEvent(container.querySelector('audio')!, new Event('error'))
    })
    expect(screen.getByRole('alert')).toHaveTextContent(/offline/i)
    expect(screen.getByRole('alert')).not.toHaveTextContent('could not be played')
  })
})
