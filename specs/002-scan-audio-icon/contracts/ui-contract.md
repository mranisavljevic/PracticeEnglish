# UI Contract: Scan Audio Icon

No network API. Contracts are the component interfaces, routes, and strings.

## Components
- `<ScanButton bookId: string, currentUnitId?: string />` — renders nothing unless camera-capable (research D6). Label `scan.button` ("Scan audio icon"); ≥44 px tall; opens `<ScanOverlay>`. Placed under the `h1`/subtitle on `Book` and `Unit` pages.
- `<ScanOverlay bookId, currentUnitId?, onClose />` — full-screen `role="dialog"` `aria-modal`, focus moved in and restored on close, Esc and a visible Cancel button close it. Contains: live video (`playsInline muted`), center aiming reticle, `aria-live="polite"` status region, and (when `detected`) the number plus an **Open** button.

## Routes (unchanged)
`/b/:bookId`, `/b/:bookId/u/:unitId`, `/b/:bookId/u/:unitId/t/:trackId`. The overlay is not a route and never adds history.

## Navigation on Open
| Origin | Target unit | History pushed |
|---|---|---|
| Book page | any | `unitPath`, then `trackPath` |
| Unit page, same unit | same | `trackPath` |
| Unit page, other unit | other | `unitPath(target)`, then `trackPath` |

Back (link or browser) from the track → target unit's track list.

## Locale keys (en + es required; parity test enforces)
`scan.button`, `scan.title`, `scan.instructions`, `scan.cancel`, `scan.detected` ({number}), `scan.open`, `scan.notFound` ({number}), `scan.tips`, `scan.moveCloser`, `scan.ambiguous`, `scan.error.denied`, `scan.error.unavailable`, `scan.chooseManually`, `scan.loading`.

## Fonts
`/fonts/Commissioner-Regular.woff2` (400), `-SemiBold.woff2` (600), `-Bold.woff2` (700), `/fonts/OFL.txt`. `font-family` token: `'Commissioner', system-ui, sans-serif`.

## OCR assets
`/ocr/worker.min.js`, `/ocr/tesseract-core-simd-lstm.wasm.js` (+ wasm), `/ocr/eng.traineddata.gz` — same-origin only.
