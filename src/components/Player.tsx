import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleProvider'

type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

interface Props {
  src: string
  /** Path of the unit's track list, offered when the audio fails. */
  chooseAnotherTo: string
  /** Called when the learner presses play. */
  onPlay?: () => void
}

export function Player({ src, chooseAnotherTo, onPlay }: Props) {
  const { t } = useLocale()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<PlayerState>('idle')

  // Leaving the track (unmount) stops its audio.
  useEffect(() => {
    const audio = audioRef.current
    return () => audio?.pause()
  }, [])

  function start() {
    const audio = audioRef.current
    if (!audio) return
    setState('loading')
    onPlay?.()
    audio.play()?.catch((err: unknown) => {
      if (err instanceof DOMException && err.name === 'AbortError') return
      setState('error')
    })
  }

  function retry() {
    audioRef.current?.load()
    start()
  }

  const wantsPlay = state === 'loading' || state === 'playing'

  return (
    <div className="player">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onPlaying={() => setState('playing')}
        onPause={() => setState((s) => (s === 'ended' || s === 'error' ? s : 'paused'))}
        onEnded={() => setState('ended')}
        onWaiting={() => setState((s) => (s === 'playing' ? 'loading' : s))}
        onError={() => setState('error')}
      />
      {state === 'error' ? (
        <div role="alert" className="player__error">
          <p>{t('error.audioFailed')}</p>
          <button type="button" onClick={retry}>
            {t('error.retry')}
          </button>{' '}
          <Link to={chooseAnotherTo} className="button button--secondary">
            {t('player.chooseAnother')}
          </Link>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="player__toggle"
            onClick={() => (wantsPlay ? audioRef.current?.pause() : start())}
          >
            {wantsPlay ? t('player.pause') : t('player.play')}
          </button>
          {state === 'loading' && (
            <p role="status" className="player__status">
              {t('player.loading')}
            </p>
          )}
        </>
      )}
    </div>
  )
}
