import { existsSync, readFileSync } from 'node:fs'
import { PNG } from 'pngjs'
import type { Frame } from '../../src/scan/badges'

/** Decodes a PNG file to RGBA pixel data the way a canvas would hand it to the scanner. */
export function loadPng(path: string): Frame {
  const png = PNG.sync.read(readFileSync(path))
  return { data: new Uint8ClampedArray(png.data), width: png.width, height: png.height }
}

export const hasFile = (path: string) => existsSync(path)
