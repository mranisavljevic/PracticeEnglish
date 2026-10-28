import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLocale } from '../i18n/LocaleProvider'

type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error'

const SLOW_RATE = 0.75

interface Props {
  src: string
  /** Path of the unit's track list, offered when the audio fails. */
  chooseAnotherTo: string
  /** Called when the learner presses play. */
  onPlay?: () => void
  prevTo?: string
  nextTo?: string
}

export function Player({ src, chooseAnotherTo, onPlay, prevTo, nextTo }: Props) {
  const { t } = useLocale()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [state, setState] = useState<PlayerState>('idle')
  const [slow, setSlow] = useState(false)

  // Leaving the track (unmount) stops its audio.
  useEffect(() => {
    const audio = audioRef.current
    return () => audio?.pause()
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = slow ? SLOW_RATE : 1
  }, [slow])

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

  function replay() {
    if (audioRef.current) audioRef.current.currentTime = 0
    start()
  }

  const wantsPlay = state === 'loading' || state === 'playing'
  const offline = typeof navigator !== 'undefined' && navigator.onLine === false
  const speedText = slow ? t('player.speedSlow') : t('player.speedNormal')

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
          <p>{offline ? t('error.offline') : t('error.audioFailed')}</p>
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
          <div className="player__row">
            <button type="button" className="secondary" onClick={replay}>
              {t('player.replay')}
            </button>
            <button
              type="button"
              className="secondary"
              aria-pressed={slow}
              aria-label={`${t('player.speed')}: ${speedText}`}
              onClick={() => setSlow((s) => !s)}
            >
              {speedText}
            </button>
          </div>
        </>
      )}
      <div className="player__row">
        {prevTo ? (
          <Link to={prevTo} className="button button--secondary">
            {t('player.previous')}
          </Link>
        ) : null}
        {nextTo ? (
          <Link to={nextTo} className="button button--secondary">
            {t('player.next')}
          </Link>
        ) : null}
      </div>
    </div>
  )
}
