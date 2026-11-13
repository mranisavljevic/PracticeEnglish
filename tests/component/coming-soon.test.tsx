import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/renderApp'
import { comingSoonCatalog } from '../fixtures/comingSoonCatalog'

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
})
afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

const render = (path = '/') => renderApp(path, comingSoonCatalog)

describe('Coming-soon tiles on Home', () => {
  it('renders each placeholder under its level, after the live books', () => {
    render()
    const level1 = screen.getByRole('heading', { level: 2, name: 'Level 1' }).closest('section')!
    const items = within(level1).getAllByRole('listitem')
    expect(items.map((li) => li.textContent)).toEqual([
      expect.stringContaining('Book A Textbook'),
      expect.stringContaining('Book B Workbook'),
      expect.stringContaining('English in Action 1: Student Book'),
    ])
    const level3 = screen.getByRole('heading', { level: 2, name: 'Level 3' }).closest('section')!
    expect(within(level3).getByText('English in Action 3: Workbook')).toBeInTheDocument()
  })

  it('shows a visible "Coming soon" badge as real text, not hidden from assistive tech', () => {
    render()
    const badges = screen.getAllByText('Coming soon')
    expect(badges).toHaveLength(2)
    for (const b of badges) {
      expect(b.closest('[aria-hidden="true"]')).toBeNull()
      expect(b).toBeVisible()
    }
  })

  it('is not a link or button, has no tab stop and does nothing when clicked', async () => {
    const user = userEvent.setup()
    const { router } = render()
    const tile = screen.getByText('English in Action 1: Student Book').closest('.card--soon') as HTMLElement
    expect(tile).not.toBeNull()
    expect(tile.closest('a')).toBeNull()
    expect(tile.querySelector('a, button, [tabindex]')).toBeNull()
    expect(tile).not.toHaveAttribute('tabindex')
    expect(screen.queryByRole('link', { name: /English in Action 1/ })).not.toBeInTheDocument()
    await user.click(tile)
    expect(router.state.location.pathname).toBe('/')
  })

  it('shows Próximamente and the Spanish title in Spanish', async () => {
    const user = userEvent.setup()
    render()
    await user.selectOptions(screen.getByRole('combobox'), 'es')
    expect(screen.getAllByText('Próximamente')).toHaveLength(2)
    expect(screen.getByText('English in Action 1: Libro del estudiante')).toBeInTheDocument()
  })
})

describe('Placeholder book URL', () => {
  it('shows the title, the unavailable message and a way home, with no scan button', () => {
    render('/b/level-1-student-book')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('English in Action 1: Student Book')
    expect(screen.getByText("This book isn't available yet. Check back soon.")).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /back|home/i }).some((a) => a.getAttribute('href') === '/')).toBe(true)
    expect(screen.queryByRole('button', { name: /scan/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument()
  })

  it('shows the message in Spanish', async () => {
    const user = userEvent.setup()
    render('/b/level-1-student-book')
    await user.selectOptions(screen.getByRole('combobox'), 'es')
    expect(screen.getByText('Este libro aún no está disponible. Vuelve pronto.')).toBeInTheDocument()
  })

  it('deeper placeholder URLs fall through to NotFound', () => {
    render('/b/level-1-student-book/u/unit-1')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/not found/i)
  })

  it('other unknown ids still render NotFound', () => {
    render('/b/nope')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/not found/i)
  })
})
