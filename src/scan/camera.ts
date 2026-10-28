import { useEffect, useState } from 'react'
import type { Frame } from './badges'

export type CameraErrorKind = 'denied' | 'unavailable'

export class CameraError extends Error {
  kind: CameraErrorKind
  constructor(kind: CameraErrorKind) {
    super(`camera ${kind}`)
    this.kind = kind
  }
}

/** Permission refusals are `denied`; a missing, busy or unsupported camera is `unavailable`. */
export function classifyCameraError(err: unknown): CameraErrorKind {
  const name = (err as { name?: string } | null)?.name
  return name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : 'unavailable'
}

export async function startCamera(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) throw new CameraError('unavailable')
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
      audio: false,
    })
  } catch (err) {
    throw new CameraError(classifyCameraError(err))
  }
}

export function stopCamera(stream: MediaStream | null | undefined) {
  stream?.getTracks().forEach((track) => track.stop())
}

const MAX_FRAME_WIDTH = 1280
let scratch: HTMLCanvasElement | null = null

/** Copies the current video frame to pixel data, or null while the video has no picture yet. */
export function grabFrame(video: HTMLVideoElement): Frame | null {
  if (video.readyState < 2 || !video.videoWidth || !video.videoHeight) return null
  const scale = Math.min(1, MAX_FRAME_WIDTH / video.videoWidth)
  const width = Math.round(video.videoWidth * scale)
  const height = Math.round(video.videoHeight * scale)
  scratch ??= document.createElement('canvas')
  scratch.width = width
  scratch.height = height
  const ctx = scratch.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

/** True on touch devices that can open a camera; evaluated after mount, so it starts false. */
export function useCameraAvailable(): boolean {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    let cancelled = false
    async function check() {
      const media = navigator.mediaDevices
      if (!media?.getUserMedia) return
      if (!window.matchMedia?.('(pointer: coarse)').matches) return
      if (media.enumerateDevices) {
        try {
          if (!(await media.enumerateDevices()).some((d) => d.kind === 'videoinput')) return
        } catch {
          // Can't list devices; fall back to trying the camera when the student taps.
        }
      }
      if (!cancelled) setAvailable(true)
    }
    void check()
    return () => {
      cancelled = true
    }
  }, [])
  return available
}
