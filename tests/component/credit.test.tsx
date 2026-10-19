import { describe, it, expect, afterEach, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/renderApp'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

const routes = ['/', '/b/book-a', '/b/book-a/u/unit-1', '/b/book-a/u/unit-1/t/t-1', '/nope']

describe('Credit', () => {
  it.each(routes)('renders on %s with source credit and non-endorsement (en)', (path) => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
    renderApp(path)
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByText(/English in Action/)).toBeInTheDocument()
    expect(within(footer).getByText(/not (affiliated|endorsed)|no.*endors/i)).toBeInTheDocument()
  })

  it.each(routes)('renders on %s in Spanish', async (path) => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es'])
    renderApp(path)
    const footer = screen.getByRole('contentinfo')
    expect(within(footer).getByText(/English in Action/)).toBeInTheDocument()
    expect(within(footer).getByText(/no (está|esta)|no cuenta|sin respaldo|no.*(afiliad|respald)/i)).toBeInTheDocument()
    void userEvent
  })
})
