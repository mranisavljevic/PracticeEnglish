# Research: Scan Audio Icon

No NEEDS CLARIFICATION remained in the spec; this resolves the technology choices it deferred.

## D1 — Number recognition engine
- **Decision**: `tesseract.js` (WASM), restricted to digits (`tessedit_char_whitelist=0123456789`), single-line page segmentation, run in its own worker, created lazily the first time the overlay opens and terminated on close.
- **Rationale**: Works on iOS Safari and Android Chrome alike, fully on-device (FR-010), no color dependence on the text itself.
- **Alternatives**: Shape Detection `TextDetector` — Chromium/Android only, unavailable on iOS (rejected). Server/cloud OCR — violates on-device requirement. Custom digit template matching — brittle across fonts/badge styles, more code (violates Simplicity).
- **Self-hosting**: by default tesseract.js fetches worker/core/language data from CDNs. Set `workerPath`, `corePath`, `langPath` to `/ocr/` so no third-party requests occur; `scripts/copy-ocr-assets.ts` copies files from `node_modules` (core `-simd-lstm` build and a fast `eng` traineddata). Netlify serves them with the existing asset caching; add a long-cache header for `/ocr/*`.
- **Offline**: scanning needs no network once the assets are in the HTTP cache; first-ever use offline fails with the generic "can't start scanner" message. Acceptable (spec: opening audio already follows offline behavior); no service worker added.

## D2 — Finding the badge (OCR input)
- **Decision**: Pure-TS localization on a downscaled grayscale frame: adaptive threshold → connected components → keep roughly rectangular, mostly-filled blobs (aspect ≈1.3–3.5, fill ≥ ~0.7, minimum size relative to the frame) that contain small high-contrast "holes" (headphone glyph + numerals). Crop the numeral region (the part of the badge right of the icon), invert so text is dark-on-light, upscale to ~48 px tall, pass to OCR.
- **Rationale**: Satisfies FR-004's "ignore other page numbers, don't depend on badge color": page/exercise numbers aren't filled boxes; purple (textbook) and dark-grey (workbook) both are dark filled blobs against white paper, so luminance contrast alone works.
- **Alternatives**: OCR whole frame and filter — picks up page numbers and exercise numbers, slow. Color segmentation for purple — fails on grey workbook badges.
- **Risk/validation**: tuned and regression-tested against the four sample photos (convert HEIC→PNG with `sips` for fixtures). If a given photo fails, thresholds are the knob; this is the main accuracy risk behind SC-001.

## D3 — Several badges / ambiguity
- **Decision**: Score each candidate by distance from badge center to frame center (the on-screen aim reticle). Pick the minimum; if the runner-up is within 15% of the winner's distance (or the winner's distance exceeds a max-radius), report "ambiguous" and surface the "move closer to one" tip instead of a number.
- **Rationale**: Directly implements the spec edge case; deterministic and unit-testable on candidate lists without images.

## D4 — Confidence and confirmation flow
- **Decision**: Accept a reading only if OCR confidence ≥ ~70 and the same number is read in 2 consecutive processed frames (~4–5 fps loop, one OCR in flight at a time). The shown number updates whenever a new stable reading differs; nothing navigates until the student taps "Open". Number not in the selected book → "not found" message, no Open button. After ~5 s without a reading → tips message; "badge too small" (candidate width < threshold) → "move closer".
- **Rationale**: Meets FR-005/007/008 and SC-003 (no wrong auto-opens, confirmation shows misreads).

## D5 — Navigation and back history
- **Decision**: The scanner is an overlay component with local state — not a route — so it never enters history (FR-006). Track numbers are unique per book (spec assumption), so `resolve(book, n)` finds the unit and track. On confirm: if the target unit differs from the current page's unit (or we're on the Book page), `navigate(unitPath)` then `navigate(trackPath)`, so history is …→ Unit → Track and both the in-app back link (already `unitPath`) and the browser back button land on the track's unit list. If already on that unit's list, a single `navigate(trackPath)`. Existing Track-page effect saves progress (FR-013).
- **Alternatives**: `navigate(trackPath)` only — browser back would return to the unit list/Book page rather than the unit's track list (rejected). `replace` — would drop the scan origin unnecessarily.

## D6 — Camera availability
- **Decision**: Show the button only if `navigator.mediaDevices?.getUserMedia` exists, `matchMedia('(pointer: coarse)')` matches, and (when `enumerateDevices` is supported) at least one `videoinput` is listed; evaluated after mount (SSR-safe, no hydration flash since it's a client-only SPA). Request `{ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } } }`; stop all tracks on close/unmount/`visibilitychange` hidden. Permission denied or `NotFoundError`/`NotReadableError` → `scan.error.*` message with a "Choose manually" button that closes the overlay.
- **Rationale**: Covers spec FR-002/FR-009 and webviews without camera access (button hidden).

## D7 — Typeface delivery
- **Decision**: Self-host three static weights — Regular 400, SemiBold 600, Bold 700 — as `woff2`, subset to Basic Latin + Latin-1 Supplement + general punctuation (covers English and Spanish: ñ, á, é, í, ó, ú, ü, ¿, ¡, «», “”, –, —, €). Generated by `scripts/subset-font.sh` (`pyftsubset … --flavor=woff2 --layout-features=kern,liga`) from `~/Desktop/Commissioner/static/`; commit outputs plus `OFL.txt` to `public/fonts/`. Estimated ~15–25 KB each (≈60 KB total, under FR-017's 100 KB).
- **CSS**: `@font-face` ×3 with `font-display: swap`, `font-family: 'Commissioner', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` on `body`; `button, input, select, textarea { font: inherit }` so controls use it (FR-014). `<link rel="preload" as="font" type="font/woff2" crossorigin>` for Regular and Bold only (the weights seen first) to shrink the swap window.
- **Alternatives**: Variable font subset — one file but carries four axes (FLAR, VOLM, slnt, wght); even wght-only instancing adds tooling for little gain. Google Fonts CDN — third-party request, rejected by FR-015. Shipping full TTFs — ~165 KB each, violates FR-017.
- **Note**: Verify existing CSS doesn't use weights other than 400/600/700 (otherwise browsers synthesize); adjust or add a weight.
