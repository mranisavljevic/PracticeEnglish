import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AnalyticsProvider } from '../../src/analytics/AnalyticsProvider'
import { LocaleProvider, useLocale } from '../../src/i18n/LocaleProvider'
import { captureEvents, restoreEvents } from '../helpers/analytics'

function Picker() {
  const { lang, setLang } = useLocale()
  return (
    <>
      <output data-testid="lang">{lang}</output>
      <button onClick={() => setLang('es')}>to-es</button>
      <button onClick={() => setLang('en')}>to-en</button>
      <button onClick={() => setLang('xx')}>to-xx</button>
    </>
  )
}

function mount() {
  return render(
    <LocaleProvider>
      <AnalyticsProvider>
        <Picker />
      </AnalyticsProvider>
    </LocaleProvider>,
  )
}

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
})
afterEach(restoreEvents)

describe('visit and language events', () => {
  it('sends exactly one visit with the displayed language and device class', async () => {
    const cap = captureEvents()
    mount()
    expect(await cap.events()).toEqual([{ type: 'visit', lang: 'en', device: 'mobile' }])
  })

  it('classes a desktop user-agent as desktop', async () => {
    const cap = captureEvents('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15')
    mount()
    expect(await cap.events()).toEqual([{ type: 'visit', lang: 'en', device: 'desktop' }])
  })

  it('does not send another visit when remounted in the same tab session', async () => {
    const cap = captureEvents()
    const first = mount()
    first.unmount()
    mount()
    expect(await cap.events()).toHaveLength(1)
  })

  it('sends nothing when the endpoint is unset', async () => {
    const cap = captureEvents()
    vi.stubEnv('VITE_ANALYTICS_ENDPOINT', '')
    mount()
    expect(await cap.events()).toEqual([])
  })

  it('sends nothing with Do Not Track', async () => {
    const cap = captureEvents()
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true })
    mount()
    expect(await cap.events()).toEqual([])
  })

  it('sends nothing with Global Privacy Control', async () => {
    const cap = captureEvents()
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: true, configurable: true })
    mount()
    expect(await cap.events()).toEqual([])
  })

  it('records language_changed with the new language, and nothing for the same or an unsupported one', async () => {
    const cap = captureEvents()
    const user = userEvent.setup()
    mount()
    await user.click(screen.getByText('to-es'))
    await user.click(screen.getByText('to-es'))
    await user.click(screen.getByText('to-xx'))
    expect(screen.getByTestId('lang')).toHaveTextContent('es')
    expect(await cap.events()).toEqual([
      { type: 'visit', lang: 'en', device: 'mobile' },
      { type: 'language_changed', lang: 'es', device: 'mobile' },
    ])
  })

  it('carries the language actually displayed when the saved one is unsupported', async () => {
    const cap = captureEvents()
    localStorage.setItem('pe.lang', 'xx')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['fr'])
    mount()
    expect(screen.getByTestId('lang')).toHaveTextContent('en')
    expect(await cap.events()).toEqual([{ type: 'visit', lang: 'en', device: 'mobile' }])
  })
})
