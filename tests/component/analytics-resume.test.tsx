import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderApp } from '../helpers/renderApp'
import { captureEvents, restoreEvents } from '../helpers/analytics'

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as never
  HTMLMediaElement.prototype.pause = vi.fn() as never
  localStorage.setItem('pe.progress', JSON.stringify({ v: 1, bookId: 'book-a', unitId: 'unit-1', trackId: 't-12a' }))
})
afterEach(restoreEvents)

const resumeEvents = async (cap: ReturnType<typeof captureEvents>) =>
  (await cap.events()).filter((e) => e.type === 'resume_used')

describe('resume_used', () => {
  it('is not sent when the home screen merely shows the card', async () => {
    const cap = captureEvents()
    renderApp('/')
    expect(screen.getByRole('link', { name: /continue/i })).toBeInTheDocument()
    expect(await resumeEvents(cap)).toEqual([])
  })

  it('is sent exactly once when the card is activated, and navigation proceeds', async () => {
    const cap = captureEvents()
    const { router } = renderApp('/')
    await userEvent.setup().click(screen.getByRole('link', { name: /continue/i }))
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-1/t/t-12a')
    expect(await resumeEvents(cap)).toEqual([{ type: 'resume_used', lang: 'en', device: 'mobile' }])
  })

  it('sends nothing with the gate closed, and navigation still works', async () => {
    const cap = captureEvents()
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true })
    const { router } = renderApp('/')
    await userEvent.setup().click(screen.getByRole('link', { name: /continue/i }))
    expect(router.state.location.pathname).toBe('/b/book-a/u/unit-1/t/t-12a')
    expect(await cap.events()).toEqual([])
  })
})
