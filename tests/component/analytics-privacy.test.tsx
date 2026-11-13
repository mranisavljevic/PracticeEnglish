import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, screen, within } from '@testing-library/react'
import { dictionaries } from '../../src/i18n'
import { track } from '../../src/analytics/track'
import { captureEvents, restoreEvents } from '../helpers/analytics'
import { renderApp } from '../helpers/renderApp'

afterEach(restoreEvents)

const scripts = () => document.head.querySelectorAll('script[src*="googletagmanager.com"]')

describe('privacy note', () => {
  it.each(['en', 'es'])('is in the footer, names Google Analytics, as readable text, in %s', (lang) => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([lang])
    renderApp('/')
    const text = dictionaries[lang]!['analytics.privacy']!
    expect(text).toContain('Google Analytics')
    const note = within(screen.getByRole('contentinfo')).getByText(text)
    expect(note).toBeVisible()
    expect(note.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('differs between English and Spanish', () => {
    expect(dictionaries.es!['analytics.privacy']).not.toBe(dictionaries.en!['analytics.privacy'])
  })
})

describe('privacy signals', () => {
  it.each([
    ['Do Not Track', () => Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true })],
    ['Global Privacy Control', () => Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true })],
  ])('%s injects no script and sends no events even with stored consent', async (_n, arrange) => {
    const cap = captureEvents()
    Reflect.deleteProperty(window, 'gtag')
    arrange()
    renderApp('/')
    expect(scripts()).toHaveLength(0)
    expect(window.gtag).toBeUndefined()
    expect(cap.gtag).not.toHaveBeenCalled()
  })

  it('a signal appearing mid-session stops further events', async () => {
    const cap = captureEvents()
    renderApp('/')
    expect(await cap.events()).toHaveLength(1)
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true })
    act(() => track({ type: 'resume_used' }, 'en'))
    expect(await cap.events()).toHaveLength(1)
  })

  it('a blocked or failed script load leaves the app working with no console errors', () => {
    captureEvents()
    Reflect.deleteProperty(window, 'gtag')
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    renderApp('/')
    const script = scripts()[0] as HTMLScriptElement
    expect(script).toBeTruthy()
    act(() => void script.dispatchEvent(new Event('error')))
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(error).not.toHaveBeenCalled()
  })
})
