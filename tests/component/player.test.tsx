import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Player } from '../../src/components/Player'
import { LocaleProvider } from '../../src/i18n/LocaleProvider'
import { audioUrl } from '../../src/content/catalog'
import { renderApp } from '../helpers/renderApp'

let playSpy: ReturnType<typeof vi.fn>
let pauseSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  playSpy = vi.fn(() => Promise.resolve())
  pauseSpy = vi.fn()
  HTMLMediaElement.prototype.play = playSpy as unknown as typeof HTMLMediaElement.prototype.play
  HTMLMediaElement.prototype.pause = pauseSpy as unknown as typeof HTMLMediaElement.prototype.pause
  HTMLMediaElement.prototype.load = vi.fn()
})

function setup() {
  const utils = render(
    <MemoryRouter>
      <LocaleProvider>
        <Player src="http://audio.test/sample/one.mp3" chooseAnotherTo="/b/book-a/u/unit-1" />
      </LocaleProvider>
    </MemoryRouter>,
  )
  const audio = utils.container.querySelector('audio') as HTMLAudioElement
  return { ...utils, audio }
}

describe('Player', () => {
  it('uses the given src and preload=metadata', () => {
    const { audio } = setup()
    expect(audio).toHaveAttribute('src', 'http://audio.test/sample/one.mp3')
    expect(audio).toHaveAttribute('preload', 'metadata')
  })

  it('toggles play and pause', async () => {
    const user = userEvent.setup()
    const { audio } = setup()
    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(playSpy).toHaveBeenCalled()
    act(() => {
      fireEvent(audio, new Event('playing'))
    })
    await user.click(screen.getByRole('button', { name: 'Pause' }))
    expect(pauseSpy).toHaveBeenCalled()
    act(() => {
      fireEvent(audio, new Event('pause'))
    })
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('shows a loading state after pressing play until playing', async () => {
    const user = userEvent.setup()
    const { audio } = setup()
    await user.click(screen.getByRole('button', { name: 'Play' }))
    expect(screen.getByRole('status')).toHaveTextContent(/loading/i)
    act(() => {
      fireEvent(audio, new Event('playing'))
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows a translated error with Retry and a link to choose another track', () => {
    const { audio } = setup()
    act(() => {
      fireEvent(audio, new Event('error'))
    })
    expect(screen.getByRole('alert')).toHaveTextContent('The audio could not be played.')
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /choose another track/i })).toHaveAttribute('href', '/b/book-a/u/unit-1')
  })
})

describe('Track page', () => {
  it('audio src is base URL + track file, no autoplay', () => {
    const { container } = renderApp('/b/book-a/u/unit-1/t/t-2')
    const audio = container.querySelector('audio')
    expect(audio).toHaveAttribute('src', audioUrl({ id: 't-2', label: '2', file: 'sample/two.mp3' }))
    expect(playSpy).not.toHaveBeenCalled()
  })

  it('only one <audio> exists after changing track, and the old one is paused', async () => {
    const { router, container } = renderApp('/b/book-a/u/unit-1/t/t-1')
    await act(async () => {
      await router.navigate('/b/book-a/u/unit-1/t/t-2')
    })
    expect(container.querySelectorAll('audio')).toHaveLength(1)
    expect(pauseSpy).toHaveBeenCalled()
  })

  it('unknown track renders NotFound', () => {
    renderApp('/b/book-a/u/unit-1/t/nope')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/not found/i)
  })
})
