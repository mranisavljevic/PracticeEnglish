import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AnalyticsProvider } from '../../src/analytics/AnalyticsProvider'
import type { TrackIds, TrackSource } from '../../src/analytics/events'
import { Player } from '../../src/components/Player'
import { LocaleProvider } from '../../src/i18n/LocaleProvider'
import { captureEvents, restoreEvents } from '../helpers/analytics'

const ids: TrackIds = { level: 'level-1', bookType: 'textbook', unit: 'unit-1', track: 't-2' }
const started = (label: string) => ({ type: 'track_started', lang: 'en', device: 'mobile', label, ...ids })

let cap: ReturnType<typeof captureEvents>

beforeEach(() => {
  vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en'])
  HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve()) as never
  HTMLMediaElement.prototype.pause = vi.fn() as never
  HTMLMediaElement.prototype.load = vi.fn()
  cap = captureEvents()
  // Keep the visit out of these assertions.
  sessionStorage.setItem('pe.visit', '1')
})
afterEach(restoreEvents)

function Where() {
  const { state } = useLocation()
  return <output data-testid="state">{JSON.stringify(state)}</output>
}

function setup(source?: TrackSource) {
  const utils = render(
    <MemoryRouter>
      <LocaleProvider>
        <AnalyticsProvider>
          <Player src="http://audio.test/one.mp3" chooseAnotherTo="/u" source={source} ids={ids} nextTo="/next" prevTo="/prev" />
          <Where />
        </AnalyticsProvider>
      </LocaleProvider>
    </MemoryRouter>,
  )
  const audio = utils.container.querySelector('audio') as HTMLAudioElement
  const fire = (name: string) => act(() => void fireEvent(audio, new Event(name)))
  return { ...utils, audio, fire }
}

describe('track_started', () => {
  it('waits for the audio to actually play, then sends one event with the arrival source', async () => {
    const user = userEvent.setup()
    const { fire } = setup('scan')
    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(await cap.events()).toEqual([])
    fire('playing')
    fire('playing')
    expect(await cap.events()).toEqual([started('scan')])
  })

  it('defaults the source to navigation', async () => {
    const user = userEvent.setup()
    const { fire } = setup()
    await user.click(screen.getByRole('button', { name: 'Play' }))
    fire('playing')
    expect(await cap.events()).toEqual([started('navigation')])
  })

  it('does not send again for pause then resume', async () => {
    const user = userEvent.setup()
    const { fire } = setup('resume')
    await user.click(screen.getByRole('button', { name: 'Play' }))
    fire('playing')
    await user.click(screen.getByRole('button', { name: 'Pause' }))
    fire('pause')
    await user.click(screen.getByRole('button', { name: 'Play' }))
    fire('playing')
    expect(await cap.events()).toEqual([started('resume')])
  })

  it('sends no track_started when the audio errors before playing', async () => {
    const user = userEvent.setup()
    const { fire } = setup('scan')
    await user.click(screen.getByRole('button', { name: 'Play' }))
    fire('error')
    fire('playing')
    expect((await cap.events()).map((e) => e.type)).toEqual(['error'])
  })

  describe('repeat', () => {
    it('Replay sends one repeat when the audio plays', async () => {
      const user = userEvent.setup()
      const { fire } = setup('scan')
      await user.click(screen.getByRole('button', { name: 'Play' }))
      fire('playing')
      await user.click(screen.getByRole('button', { name: 'Replay' }))
      expect(await cap.events()).toHaveLength(1)
      fire('playing')
      expect(await cap.events()).toEqual([started('scan'), started('repeat')])
    })

    it('Play after the track ended is a repeat', async () => {
      const user = userEvent.setup()
      const { fire } = setup('navigation')
      await user.click(screen.getByRole('button', { name: 'Play' }))
      fire('playing')
      fire('ended')
      await user.click(screen.getByRole('button', { name: 'Play' }))
      fire('playing')
      expect(await cap.events()).toEqual([started('navigation'), started('repeat')])
    })

    it('two rapid Replay taps before playing still send one event', async () => {
      const user = userEvent.setup()
      const { fire } = setup('navigation')
      await user.click(screen.getByRole('button', { name: 'Replay' }))
      await user.click(screen.getByRole('button', { name: 'Replay' }))
      fire('playing')
      fire('playing')
      expect(await cap.events()).toEqual([started('repeat')])
    })
  })

  it('renders the Next link with source next, and Previous without one', async () => {
    const user = userEvent.setup()
    setup('scan')
    await user.click(screen.getByRole('link', { name: 'Next' }))
    expect(screen.getByTestId('state')).toHaveTextContent('{"source":"next"}')
  })

  it('Previous carries no source', async () => {
    const user = userEvent.setup()
    setup('scan')
    await user.click(screen.getByRole('link', { name: 'Previous' }))
    expect(screen.getByTestId('state')).toHaveTextContent('null')
  })
})
