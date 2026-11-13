import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { dictionaries } from '../../src/i18n'
import { captureEvents, common, restoreEvents } from '../helpers/analytics'
import { renderApp } from '../helpers/renderApp'

const scripts = () => document.head.querySelectorAll('script[src*="googletagmanager.com"]')
const banner = () => screen.queryByRole('region', { name: dictionaries.en!['consent.title']! })

let cap: ReturnType<typeof captureEvents>
beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  cap = captureEvents()
  localStorage.clear()
  Reflect.deleteProperty(window, 'gtag')
})
afterEach(restoreEvents)

describe('consent banner', () => {
  it('shows a labelled region with accept and decline when no choice is stored, and loads nothing yet', () => {
    renderApp('/')
    const region = banner()
    expect(region).toBeInTheDocument()
    expect(within(region!).getByRole('button', { name: 'Accept' })).toBeInTheDocument()
    expect(within(region!).getByRole('button', { name: 'Decline' })).toBeInTheDocument()
    expect(scripts()).toHaveLength(0)
  })

  it('accepting loads GA, sends the visit and hides the banner', async () => {
    renderApp('/')
    window.gtag = cap.gtag as never
    await userEvent.setup().click(screen.getByRole('button', { name: 'Accept' }))
    expect(banner()).toBeNull()
    expect(scripts()).toHaveLength(1)
    expect(localStorage.getItem('pe.consent')).toBe('granted')
    expect(await cap.events()).toEqual([{ type: 'visit', ...common() }])
  })

  it('declining loads nothing and hides the banner', async () => {
    renderApp('/')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Decline' }))
    expect(banner()).toBeNull()
    expect(scripts()).toHaveLength(0)
    expect(localStorage.getItem('pe.consent')).toBe('declined')
    expect(await cap.events()).toEqual([])
  })

  it('stays hidden once a choice is stored, and Privacy settings reopens it', async () => {
    localStorage.setItem('pe.consent', 'declined')
    renderApp('/')
    expect(banner()).toBeNull()
    await userEvent.setup().click(within(screen.getByRole('contentinfo')).getByRole('button', { name: 'Privacy settings' }))
    expect(banner()).toBeInTheDocument()
  })

  it.each([
    ['Do Not Track', () => Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true })],
    ['Global Privacy Control', () => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true })],
  ])('is hidden with %s and offers no settings button', (_n, arrange) => {
    arrange()
    renderApp('/')
    expect(banner()).toBeNull()
    expect(screen.queryByRole('button', { name: 'Privacy settings' })).toBeNull()
  })

  it('shows no banner or settings button when the prompt is switched off', () => {
    vi.stubEnv('VITE_CONSENT_PROMPT', 'off')
    renderApp('/')
    expect(banner()).toBeNull()
    expect(screen.queryByRole('button', { name: 'Privacy settings' })).toBeNull()
  })

  it('shows nothing when no measurement id is configured', () => {
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', '')
    renderApp('/')
    expect(banner()).toBeNull()
  })

  it('is translated to Spanish', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['es'])
    renderApp('/')
    expect(screen.getByRole('region', { name: dictionaries.es!['consent.title']! })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: dictionaries.es!['consent.accept']! })).toBeInTheDocument()
  })
})
