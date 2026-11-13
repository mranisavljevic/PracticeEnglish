import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { loadProgress } from '../../src/storage/progress'
import { resolve } from '../../src/scan/resolve'
import { renderApp } from '../helpers/renderApp'
import { captureEvents, restoreEvents } from '../helpers/analytics'
import { comingSoonCatalog } from '../fixtures/comingSoonCatalog'

let cap: ReturnType<typeof captureEvents>

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  cap = captureEvents()
  sessionStorage.setItem('pe.visit', '1') // keep the visit event out of these assertions
})
afterEach(restoreEvents)

describe('placeholders stay out of progress, scan and analytics', () => {
  it('stored progress pointing at a placeholder is ignored', () => {
    localStorage.setItem(
      'pe.progress',
      JSON.stringify({ v: 1, bookId: 'level-1-student-book', unitId: 'unit-1', trackId: 'track-1' }),
    )
    expect(loadProgress(comingSoonCatalog)).toBeNull()
    renderApp('/', comingSoonCatalog)
    expect(screen.queryByRole('link', { name: /continue/i })).not.toBeInTheDocument()
  })

  it('scan resolution cannot return a placeholder (no book to resolve against)', () => {
    const soon = comingSoonCatalog.comingSoon![0]!
    expect(comingSoonCatalog.books.find((b) => b.id === soon.id)).toBeUndefined()
    // resolve() takes a live Book; a placeholder has no units, so nothing can match.
    expect(resolve({ ...soon, units: [] }, '1')).toBeUndefined()
  })

  it('rendering and clicking a tile sends no analytics event', async () => {
    const user = userEvent.setup()
    renderApp('/', comingSoonCatalog)
    await user.click(screen.getByText('English in Action 1: Student Book'))
    expect(await cap.events()).toEqual([])
  })

  it('visiting a placeholder URL writes no progress and sends no analytics event', async () => {
    renderApp('/b/level-1-student-book', comingSoonCatalog)
    expect(localStorage.getItem('pe.progress')).toBeNull()
    expect(await cap.events()).toEqual([])
  })
})
