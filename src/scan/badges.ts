// Locates audio-icon badges (dark filled rectangles holding a headphone glyph and a number) in a
// camera frame and prepares the numeral for OCR. Plain page numbers and text are not filled boxes.

export interface Frame {
  data: Uint8ClampedArray | Uint8Array
  width: number
  height: number
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface BadgeCandidate {
  box: Box
  /** Badge centre to frame centre, as a fraction of the frame diagonal. */
  distance: number
  /** Badge width as a fraction of the frame width. */
  relWidth: number
  /** Numeral region, dark on light, ready for OCR. */
  crop: Frame
}

export type Selection =
  | { kind: 'badge'; candidate: BadgeCandidate }
  | { kind: 'ambiguous' }
  | { kind: 'tooSmall' }
  | { kind: 'none' }

const WORK_WIDTH = 480
const TILES_X = 12
const TILES_Y = 9
const DARK_RATIO = 0.55
const MIN_ASPECT = 1.3
const MAX_ASPECT = 3.5
const MIN_FILL = 0.5
const MAX_FILL = 0.92
const MIN_REL_WIDTH_WORK = 0.025
const OCR_HEIGHT = 48
const OCR_PAD = 8

const MAX_RADIUS = 0.35
const AMBIGUOUS_RATIO = 1.15
const MIN_REL_WIDTH = 0.07

/** Chooses the badge the student is aiming at: the one nearest the frame centre. */
export function pickBadge(candidates: BadgeCandidate[]): Selection {
  const sorted = [...candidates].sort((a, b) => a.distance - b.distance)
  const best = sorted[0]
  if (!best || best.distance > MAX_RADIUS) return { kind: 'none' }
  if (best.relWidth < MIN_REL_WIDTH) return { kind: 'tooSmall' }
  const runnerUp = sorted[1]
  if (runnerUp && runnerUp.distance <= best.distance * AMBIGUOUS_RATIO) return { kind: 'ambiguous' }
  return { kind: 'badge', candidate: best }
}

function toGray(frame: Frame, scale: number, w: number, h: number): Float32Array {
  const gray = new Float32Array(w * h)
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * scale)
    const y1 = Math.max(y0 + 1, Math.min(frame.height, Math.floor((y + 1) * scale)))
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * scale)
      const x1 = Math.max(x0 + 1, Math.min(frame.width, Math.floor((x + 1) * scale)))
      let sum = 0
      let n = 0
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * frame.width + xx) * 4
          sum += 0.299 * frame.data[i]! + 0.587 * frame.data[i + 1]! + 0.114 * frame.data[i + 2]!
          n++
        }
      }
      gray[y * w + x] = sum / n
    }
  }
  return gray
}

/** Estimates paper brightness per tile (a bright percentile, so badges and ink don't pull it down). */
function paperBrightness(gray: Float32Array, w: number, h: number): Float32Array {
  const tile = new Float32Array(TILES_X * TILES_Y)
  for (let ty = 0; ty < TILES_Y; ty++) {
    for (let tx = 0; tx < TILES_X; tx++) {
      const values: number[] = []
      for (let y = Math.floor((ty * h) / TILES_Y); y < Math.floor(((ty + 1) * h) / TILES_Y); y++) {
        for (let x = Math.floor((tx * w) / TILES_X); x < Math.floor(((tx + 1) * w) / TILES_X); x++) values.push(gray[y * w + x]!)
      }
      values.sort((a, b) => a - b)
      tile[ty * TILES_X + tx] = values[Math.floor(values.length * 0.85)] ?? 255
    }
  }
  // Borrow brightness from neighbouring tiles so a tile lying wholly inside a badge isn't read as paper.
  const R = 2
  const out = new Float32Array(tile.length)
  for (let ty = 0; ty < TILES_Y; ty++) {
    for (let tx = 0; tx < TILES_X; tx++) {
      let max = 0
      for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
          const yy = ty + dy
          const xx = tx + dx
          if (yy >= 0 && yy < TILES_Y && xx >= 0 && xx < TILES_X) max = Math.max(max, tile[yy * TILES_X + xx]!)
        }
      }
      out[ty * TILES_X + tx] = max
    }
  }
  return out
}

interface Blob {
  box: Box
  area: number
}

function components(mask: Uint8Array, w: number, h: number): Blob[] {
  const seen = new Uint8Array(mask.length)
  const blobs: Blob[] = []
  const stack: number[] = []
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue
    let minX = w
    let minY = h
    let maxX = 0
    let maxY = 0
    let area = 0
    stack.push(start)
    seen[start] = 1
    while (stack.length) {
      const p = stack.pop()!
      const x = p % w
      const y = (p - x) / w
      area++
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
      for (const n of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, y > 0 ? p - w : -1, y < h - 1 ? p + w : -1]) {
        if (n >= 0 && mask[n] && !seen[n]) {
          seen[n] = 1
          stack.push(n)
        }
      }
    }
    blobs.push({ box: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }, area })
  }
  return blobs
}

/** Crops the numeral part of a badge from the full-resolution frame: dark on light, ~48 px tall. */
function cropNumeral(frame: Frame, badge: Box): Frame {
  const iconWidth = Math.min(badge.h * 1.12, badge.w * 0.55)
  const x0 = Math.max(0, Math.round(badge.x + iconWidth))
  const x1 = Math.min(frame.width, Math.round(badge.x + badge.w - badge.w * 0.04))
  const y0 = Math.max(0, Math.round(badge.y + badge.h * 0.08))
  const y1 = Math.min(frame.height, Math.round(badge.y + badge.h * 0.92))
  const srcW = Math.max(1, x1 - x0)
  const srcH = Math.max(1, y1 - y0)

  const gray = new Float32Array(srcW * srcH)
  let lo = 255
  let hi = 0
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const i = ((y0 + y) * frame.width + x0 + x) * 4
      const g = 0.299 * frame.data[i]! + 0.587 * frame.data[i + 1]! + 0.114 * frame.data[i + 2]!
      gray[y * srcW + x] = g
      if (g < lo) lo = g
      if (g > hi) hi = g
    }
  }
  const range = Math.max(1, hi - lo)

  const scale = OCR_HEIGHT / srcH
  const innerW = Math.max(1, Math.round(srcW * scale))
  const width = innerW + OCR_PAD * 2
  const height = OCR_HEIGHT + OCR_PAD * 2
  const data = new Uint8ClampedArray(width * height * 4).fill(255)
  for (let y = 0; y < OCR_HEIGHT; y++) {
    const sy = Math.min(srcH - 1, y / scale)
    const fy = Math.floor(sy)
    const wy = sy - fy
    for (let x = 0; x < innerW; x++) {
      const sx = Math.min(srcW - 1, x / scale)
      const fx = Math.floor(sx)
      const wx = sx - fx
      const fx1 = Math.min(srcW - 1, fx + 1)
      const fy1 = Math.min(srcH - 1, fy + 1)
      const g =
        gray[fy * srcW + fx]! * (1 - wx) * (1 - wy) +
        gray[fy * srcW + fx1]! * wx * (1 - wy) +
        gray[fy1 * srcW + fx]! * (1 - wx) * wy +
        gray[fy1 * srcW + fx1]! * wx * wy
      // The numeral is light on the dark badge, so invert to dark-on-light.
      const v = 255 - ((g - lo) / range) * 255
      const o = ((y + OCR_PAD) * width + x + OCR_PAD) * 4
      data[o] = data[o + 1] = data[o + 2] = v
      data[o + 3] = 255
    }
  }
  return { data, width, height }
}

export function findBadges(frame: Frame): BadgeCandidate[] {
  const scale = Math.max(1, frame.width / WORK_WIDTH)
  const w = Math.max(1, Math.floor(frame.width / scale))
  const h = Math.max(1, Math.floor(frame.height / scale))
  const gray = toGray(frame, scale, w, h)
  const paper = paperBrightness(gray, w, h)

  const mask = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const ty = Math.min(TILES_Y - 1, Math.floor((y * TILES_Y) / h))
    for (let x = 0; x < w; x++) {
      const tx = Math.min(TILES_X - 1, Math.floor((x * TILES_X) / w))
      if (gray[y * w + x]! < paper[ty * TILES_X + tx]! * DARK_RATIO) mask[y * w + x] = 1
    }
  }

  const diagonal = Math.hypot(frame.width, frame.height)
  const candidates: BadgeCandidate[] = []
  for (const { box, area } of components(mask, w, h)) {
    const aspect = box.w / box.h
    const fill = area / (box.w * box.h)
    if (box.w < w * MIN_REL_WIDTH_WORK) continue
    if (aspect < MIN_ASPECT || aspect > MAX_ASPECT) continue
    if (fill < MIN_FILL || fill > MAX_FILL) continue
    const full: Box = {
      x: Math.round(box.x * scale),
      y: Math.round(box.y * scale),
      w: Math.round(box.w * scale),
      h: Math.round(box.h * scale),
    }
    const cx = full.x + full.w / 2
    const cy = full.y + full.h / 2
    candidates.push({
      box: full,
      distance: Math.hypot(cx - frame.width / 2, cy - frame.height / 2) / diagonal,
      relWidth: full.w / frame.width,
      crop: cropNumeral(frame, full),
    })
  }
  return candidates.sort((a, b) => a.distance - b.distance)
}
