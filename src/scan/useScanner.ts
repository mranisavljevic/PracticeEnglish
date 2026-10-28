import { useEffect, useRef, useState } from 'react'
import type { Book } from '../content/catalog'
import { findBadges, pickBadge } from './badges'
import { CameraError, grabFrame, startCamera, stopCamera, type CameraErrorKind } from './camera'
import { resolve, type TrackMatch } from './resolve'
import { initialReading, reduceReading } from './stability'

export const FRAME_INTERVAL_MS = 220
export const TIPS_AFTER_MS = 5000

export type ScanHint = 'tips' | 'moveCloser' | 'ambiguous'

export type ScanState =
  | { status: 'starting' }
  | { status: 'scanning'; hint: ScanHint | null }
  | { status: 'detected'; number: string; match: TrackMatch }
  | { status: 'notFound'; number: string }
  | { status: 'error'; kind: CameraErrorKind }

type Phase = { kind: 'starting' } | { kind: 'scanning' } | { kind: 'error'; error: CameraErrorKind }

async function loadOcr() {
  const ocr = await import('./ocr')
  await ocr.initOcr()
  return ocr
}

/** Owns the camera, the frame loop and the OCR worker; everything stops on unmount or when the page is hidden. */
export function useScanner(book: Book) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [phase, setPhase] = useState<Phase>({ kind: 'starting' })
  const [hint, setHint] = useState<ScanHint | null>(null)
  const [shown, setShown] = useState<string | null>(null)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const onVisibility = () => setPaused(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    if (paused) return
    let cancelled = false
    let stream: MediaStream | null = null
    let timer: ReturnType<typeof setTimeout> | undefined
    const video = videoRef.current
    const ocrReady = loadOcr()
    ocrReady.catch(() => {})

    const fail = (kind: CameraErrorKind) => {
      stopCamera(stream)
      stream = null
      if (!cancelled) setPhase({ kind: 'error', error: kind })
    }

    async function run() {
      try {
        stream = await startCamera()
      } catch (err) {
        if (!cancelled) setPhase({ kind: 'error', error: err instanceof CameraError ? err.kind : 'unavailable' })
        return
      }
      if (cancelled) {
        stopCamera(stream)
        return
      }
      if (video) {
        video.srcObject = stream
        void Promise.resolve(video.play()).catch(() => {})
      }

      let ocr: Awaited<typeof ocrReady>
      try {
        ocr = await ocrReady
      } catch {
        fail('unavailable')
        return
      }
      if (cancelled) return

      setPhase({ kind: 'scanning' })
      const startedAt = Date.now()
      let state = initialReading

      const tick = async () => {
        if (cancelled) return
        try {
          const frame = video ? grabFrame(video) : null
          let nextHint: ScanHint | null = null
          if (frame) {
            const selection = pickBadge(findBadges(frame))
            if (selection.kind === 'badge') {
              const reading = await ocr.readNumber(selection.candidate.crop)
              if (cancelled) return
              const next = reduceReading(state, reading)
              if (next.shown !== state.shown) setShown(next.shown)
              state = next
            } else if (selection.kind === 'tooSmall') {
              nextHint = 'moveCloser'
            } else if (selection.kind === 'ambiguous') {
              nextHint = 'ambiguous'
            }
          }
          if (!nextHint && !state.shown && Date.now() - startedAt >= TIPS_AFTER_MS) nextHint = 'tips'
          setHint(nextHint)
        } catch {
          // A single bad frame or OCR hiccup shouldn't end the session; the next tick tries again.
        }
        if (!cancelled) timer = setTimeout(tick, FRAME_INTERVAL_MS)
      }
      void tick()
    }

    void run()

    return () => {
      cancelled = true
      clearTimeout(timer)
      stopCamera(stream)
      if (video) video.srcObject = null
      void ocrReady.then((o) => o.terminateOcr()).catch(() => {})
      setPhase({ kind: 'starting' })
    }
  }, [paused])

  let state: ScanState
  if (phase.kind === 'error') state = { status: 'error', kind: phase.error }
  else if (phase.kind === 'starting') state = { status: 'starting' }
  else if (shown) {
    const match = resolve(book, shown)
    state = match ? { status: 'detected', number: shown, match } : { status: 'notFound', number: shown }
  } else state = { status: 'scanning', hint }

  return { state, videoRef }
}
