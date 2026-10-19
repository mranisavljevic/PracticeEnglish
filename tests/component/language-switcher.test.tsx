import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/renderApp'

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as never
  HTMLMediaElement.prototype.pause = vi.fn() as never
})
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('LanguageSwitcher', () => {
  it.each(['/', '/b/book-a', '/b/book-a/u/unit-1', '/b/book-a/u/unit-1/t/t-1', '/nope'])('is present on %s', (path) => {
    renderApp(path)
    const select = screen.getByRole('combobox', { name: /language/i })
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Español' })).toBeInTheDocument()
  })

  it('switching changes text immediately, keeps the route, persists pe.lang', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/b/book-a')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Units')
    await user.selectOptions(screen.getByRole('combobox'), 'es')
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Unidades')
    expect(router.state.location.pathname).toBe('/b/book-a')
    expect(localStorage.getItem('pe.lang')).toBe('es')
    expect(document.documentElement.lang).toBe('es')
  })

  it('does not remount the player', async () => {
    const user = userEvent.setup()
    const { container } = renderApp('/b/book-a/u/unit-1/t/t-1')
    const before = container.querySelector('audio')
    await user.selectOptions(screen.getByRole('combobox'), 'es')
    expect(container.querySelector('audio')).toBe(before)
    await act(async () => {})
    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled()
  })

  it('shows English titles with the translation as secondary text', async () => {
    const user = userEvent.setup()
    renderApp('/')
    await user.selectOptions(screen.getByRole('combobox'), 'es')
    expect(screen.getByText('Book A Textbook')).toBeInTheDocument()
    expect(screen.getByText('Libro A')).toBeInTheDocument()
  })
})
