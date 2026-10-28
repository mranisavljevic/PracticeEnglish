// Loaded lazily (dynamic import) so the OCR library stays out of the initial bundle.
import { createWorker, PSM, type Worker } from 'tesseract.js'
import type { Frame } from './badges'
import type { Reading } from './stability'

let worker: Promise<Worker> | null = null

function init(): Promise<Worker> {
  worker ??= (async () => {
    const w = await createWorker('eng', 1, {
      workerPath: '/ocr/worker.min.js',
      corePath: '/ocr/tesseract-core-simd-lstm.wasm.js',
      langPath: '/ocr/',
    })
    await w.setParameters({
      tessedit_char_whitelist: '0123456789',
      tessedit_pageseg_mode: PSM.SINGLE_LINE,
    })
    return w
  })()
  // A failed start must not be cached, or every retry would fail the same way.
  worker.catch(() => {
    worker = null
  })
  return worker
}

/** Starts the worker ahead of the first frame; rejects if the assets can't be loaded. */
export async function initOcr(): Promise<void> {
  await init()
}

function toCanvas(frame: Frame): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = frame.width
  canvas.height = frame.height
  canvas.getContext('2d')?.putImageData(new ImageData(new Uint8ClampedArray(frame.data), frame.width, frame.height), 0, 0)
  return canvas
}

export async function readNumber(crop: Frame): Promise<Reading | null> {
  const w = await init()
  const { data } = await w.recognize(toCanvas(crop))
  const number = data.text.replace(/\s+/g, '')
  return /^\d{1,4}$/.test(number) ? { number, confidence: data.confidence } : null
}

export async function terminateOcr(): Promise<void> {
  const pending = worker
  worker = null
  if (pending) await (await pending.catch(() => null))?.terminate()
}
