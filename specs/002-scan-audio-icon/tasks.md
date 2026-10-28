# Tasks: Scan Audio Icon

**Input**: Design documents from `/specs/002-scan-audio-icon/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md
**Tests**: Included — the constitution (IV. Test-First) requires failing tests before each module. Write each test task first and confirm it fails before implementing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1–US4 (see spec.md)
- Paths are relative to the repo root. Existing layout: `src/{components,pages,i18n,locales,styles,content}`, `tests/{unit,component,e2e,fixtures,helpers}`, `scripts/`, `public/`, `netlify.toml`.

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Add runtime dependency `tesseract.js` (^7) to `package.json` via `npm install tesseract.js`
- [ ] T002 [P] Create `scripts/copy-ocr-assets.ts` that copies tesseract worker (`worker.min.js`), the `-simd-lstm` core (`.wasm.js` + `.wasm`), and a fast `eng.traineddata.gz` from `node_modules` into `public/ocr/`; add npm script `"copy:ocr": "tsx scripts/copy-ocr-assets.ts"` to `package.json`; run it and commit the outputs in `public/ocr/`
- [ ] T003 [P] Convert sample photos to PNG (`sips -s format png ~/Downloads/{page_sample,audio_icon_sample,wb_page_sample,wb_audio_icon_sample}.HEIC`, one PNG per HEIC, same base name). Crop each to the badge and its immediate surroundings (a few hundred px) into `tests/fixtures/badges/`. Keep the full-page conversions in `tests/fixtures/private/` and add that path to `.gitignore` (publisher page photos must not be committed). Also compose a synthetic `tests/fixtures/badges/multi.png` by tiling 3 committed badge crops with plain text between them (used by T010 so the multi-badge case runs in CI). Tests needing a full page skip when the private folder is absent.
- [ ] T004 [P] Add long-cache `[[headers]]` blocks for `/ocr/*` and `/fonts/*` to `netlify.toml` (`Cache-Control = "public, max-age=31536000, immutable"`). Do not touch `firebase.json`; it serves only the audio.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Locale strings and track resolution used by every scanning story.

- [ ] T005 [P] Add the `scan.*` keys from contracts/ui-contract.md (`button`, `title`, `instructions`, `cancel`, `detected` {number}, `open`, `notFound` {number}, `tips`, `moveCloser`, `ambiguous`, `error.denied`, `error.unavailable`, `chooseManually`, `loading`) in English to `src/locales/en.json`
- [ ] T006 [P] Add the same `scan.*` keys in Spanish to `src/locales/es.json` (existing en/es parity test must pass)
- [ ] T007 [P] Write failing unit test `tests/unit/resolve.test.ts`: `resolve(book, "15")` returns `{unitId, trackId}` for a track in any unit of the book; returns `undefined` for numbers not in the book, empty/non-numeric strings, and title-read tracks omitted from the catalog
- [ ] T008 Implement `src/scan/resolve.ts` exporting `resolve(book, number)` using the catalog types in `src/content/catalog.ts` (track `label` equals the printed number); make T007 pass

**Checkpoint**: Strings and resolution ready.

---

## Phase 3: User Story 1 — Scan an icon to open its track (Priority: P1) 🎯 MVP

**Goal**: From the Book (unit list) page, tap Scan audio icon, aim at a badge, see the detected number, tap Open, land on that track; back goes to the track's unit list.

**Independent Test**: On a camera-capable (mocked) device, scan a badge on the Book page, tap Open, and verify the track page opens and back returns to that unit's track list.

### Tests for US1 (write first, confirm failing)

- [ ] T009 [P] [US1] Unit test `tests/unit/badges.test.ts` for `pickBadge(candidates)`: nearest-to-center wins; runner-up within 1.15× best distance → `{kind:'ambiguous'}`; winner beyond max radius → `{kind:'none'}`; candidate narrower than the min-width threshold → `{kind:'tooSmall'}`; empty → `{kind:'none'}`
- [ ] T010 [P] [US1] Unit test `tests/unit/badge-detect.test.ts` for `findBadges(imageData)` against the PNG fixtures in `tests/fixtures/badges/` (purple textbook badge and dark-grey workbook badge both yield a candidate whose crop is the numeral region; plain page-number/text regions yield none; the synthetic `multi.png` yields ≥3 candidates; a full-page private fixture is an optional extra that skips when absent). Load PNGs via a test helper in `tests/helpers/` (decode with a canvas polyfill or `pngjs` dev dependency — add it in this task if needed)
- [ ] T011 [P] [US1] Unit test `tests/unit/stability.test.ts` for the pure `reduceReading(state, reading)` exported from `src/scan/stability.ts`: a reading counts only if confidence ≥ 70 and the same number appears in 2 consecutive frames; a new stable different number replaces the displayed one; unstable/low-confidence readings do not change state
- [ ] T012 [P] [US1] Component test `tests/component/scan-overlay.test.tsx`: with mocked `getUserMedia` and a mocked OCR/badge pipeline — shows reticle + instructions; a stable matching number shows "detected" text and an Open button; re-aim updates the number without navigating; number not in the book shows the not-found message and no Open button; no reading after ~5 s shows tips; a `tooSmall` pick shows `scan.moveCloser`; an `ambiguous` pick shows `scan.ambiguous` and nothing opens; `visibilitychange` to hidden stops all tracks; Cancel and Esc close and stop all tracks; focus moves into the dialog and is restored on close
- [ ] T013 [P] [US1] Component test `tests/component/scan-navigation.test.tsx`: on Book page, Open navigates `unitPath` then `trackPath` (history = Book → Unit → Track; browser back from the track lands on the unit's track list); the Track page saves progress so Home shows Continue for the scanned track (FR-013)

### Implementation for US1

- [ ] T014 [US1] Implement `src/scan/badges.ts`: `findBadges(imageData)` (downscale to grayscale, adaptive threshold, connected components, keep filled rectangles per research D2 — aspect ≈1.3–3.5, fill ≥ ~0.7, min size relative to frame, containing high-contrast holes; crop numeral region right of the icon, invert, upscale to ~48 px tall) and `pickBadge(candidates)` per research D3 / data-model `Selection`; tune thresholds until T009 and T010 pass
- [ ] T015 [P] [US1] Implement `src/scan/camera.ts`: `startCamera()` requesting `{video:{facingMode:{ideal:'environment'},width:{ideal:1280}}}` and returning the stream, `stopCamera(stream)` stopping all tracks, and error classification into `denied` vs `unavailable` (`NotAllowedError`, `NotFoundError`, `NotReadableError`)
- [ ] T016 [P] [US1] Implement `src/scan/ocr.ts`: lazy `createWorker` from `tesseract.js` with `workerPath`/`corePath`/`langPath` set to `/ocr/`, `tessedit_char_whitelist=0123456789`, single-line PSM; export `readNumber(crop): Promise<{number:string; confidence:number}|null>` (1–4 digits) and `terminateOcr()`
- [ ] T016a [P] [US1] Implement `src/scan/stability.ts` exporting the pure `reduceReading(state, reading)`; make T011 pass
- [ ] T017 [US1] Implement `src/scan/useScanner.ts` (depends on T014–T016a, T008): hook owning the state machine from data-model.md (`starting → scanning ⇄ detected | notFound`, `tips`, `error(denied|unavailable)`, `closed`), ~4–5 fps frame loop with one OCR in flight, 2-frame stability + confidence ≥ 70 via `reduceReading`; if the dynamic `import()` of `ocr.ts`, the worker, the wasm core or the traineddata fails to load or initialize, stop the camera and transition to `error(unavailable)`; ~5 s no-reading → tips, `tooSmall` → moveCloser, `ambiguous` → ambiguous tip, stop camera/terminate OCR on close, unmount, and `visibilitychange` hidden. Import `ocr.ts` via dynamic `import()` so tesseract is a separate lazy chunk
- [ ] T018 [US1] Implement `src/components/ScanOverlay.tsx` per contracts/ui-contract.md: full-screen `role="dialog"` `aria-modal`, `<video playsInline muted>`, centered aim reticle, `aria-live="polite"` status region, detected number + **Open** button (≥44 px), Cancel button, Esc closes, focus moved in/restored; props `bookId`, `currentUnitId?`, `onClose`; on Open perform the navigation table (Book page: `unitPath` then `trackPath`; same unit: `trackPath`; other unit: `unitPath(target)` then `trackPath`) using existing path helpers; make T012/T013 pass
- [ ] T019 [US1] Implement `src/components/ScanButton.tsx`: renders the `scan.button` button (≥44 px) and manages overlay open/close; for now renders unconditionally (capability gating added in US3); add overlay/button styles to `src/styles/base.css` (360 px width, portrait, safe full-screen video `object-fit: cover`)
- [ ] T020 [US1] Render `<ScanButton bookId={…} />` under the heading/subtitle in `src/pages/Book.tsx`
- [ ] T021 [US1] Playwright journey `tests/e2e/scan.spec.ts` (390×844): launch Chromium with `--use-fake-device-for-media-stream --use-file-for-fake-video-capture=<badge video>` and `--use-fake-ui-for-media-stream` (configure in `playwright.config.ts` for this spec only; generate the badge clip with `ffmpeg -loop 1 -i <badge.png> -t 2 -r 10 -vf scale=640:360 -pix_fmt yuv420p tests/fixtures/badges/badge.y4m`, document the command in `tests/fixtures/badges/README.md`; keep the clip under 2 MB and commit it, otherwise gitignore it and generate it in the e2e setup; ffmpeg is a one-time local prerequisite, not an npm dependency), scan from the Book page, assert detected number appears within 5 s, Open → track page, back → unit track list

**Checkpoint**: US1 fully functional and independently testable (MVP).

---

## Phase 4: User Story 2 — Scan from inside a unit (Priority: P2)

**Goal**: The same scanner on a unit's track list, including scanning a badge from a different unit.

**Independent Test**: On a unit page, scan a badge for a track in the same unit and one in another unit; each opens its track and back returns to that track's unit list.

- [ ] T022 [P] [US2] Extend `tests/component/scan-navigation.test.tsx`: from Unit page, same-unit badge → single `trackPath` push, back → same unit list; other-unit badge → `unitPath(target)` then `trackPath`, back → target unit's list
- [ ] T023 [US2] Render `<ScanButton bookId={…} currentUnitId={…} />` under the heading in `src/pages/Unit.tsx` (overlay navigation logic from T018 already handles `currentUnitId`; fix any gaps found by T022)
- [ ] T024 [P] [US2] Extend `tests/e2e/scan.spec.ts` with a unit-page scan journey asserting the back chain

**Checkpoint**: US1 and US2 both work.

---

## Phase 5: User Story 3 — Only offered where it can work (Priority: P2)

**Goal**: Hide the button on desktop/camera-less devices; show clear errors when the camera is denied or fails.

**Independent Test**: With mocks, no button on desktop/no-camera; denied permission shows translated message and Choose manually closes the overlay.

- [ ] T025 [P] [US3] Component test `tests/component/scan-button.test.tsx`: button hidden when `getUserMedia` is missing, when `matchMedia('(pointer: coarse)')` doesn't match, or when `enumerateDevices` lists no `videoinput`; shown otherwise; hidden pages (Home, book list) never render it
- [ ] T026 [P] [US3] Extend `tests/component/scan-overlay.test.tsx`: `NotAllowedError` → `scan.error.denied` message with **Choose manually**; `NotFoundError`/`NotReadableError` → `scan.error.unavailable`; Choose manually closes the overlay and leaves the origin page unchanged; a rejected OCR init → `scan.error.unavailable` with **Choose manually**, and the camera stream is stopped
- [ ] T027 [US3] Add `useCameraAvailable()` in `src/scan/camera.ts` implementing research D6 (client-only effect: `getUserMedia` exists, `(pointer: coarse)` matches, and if `enumerateDevices` is supported at least one `videoinput`); gate `ScanButton` on it so it renders nothing otherwise
- [ ] T028 [US3] Render the error states and **Choose manually** button in `src/components/ScanOverlay.tsx`; make T025/T026 pass
- [ ] T029 [P] [US3] Extend `tests/e2e/scan.spec.ts`: on a desktop-viewport/non-coarse-pointer context no scan button appears and manual browsing still works (SC-004)
- [ ] T029a [P] [US3] Extend `tests/e2e/scan.spec.ts`: at 360×740 the scan button, Open and Cancel have bounding height ≥ 44 px and the page has no horizontal scroll (FR-012)

**Checkpoint**: Scanning is safe to ship.

---

## Phase 6: User Story 4 — Commissioner typeface (Priority: P3)

**Goal**: All site text in self-hosted Commissioner (400/600/700), non-blocking, ≤ ~100 KB.

**Independent Test**: Every page, including form controls and the language selector, renders in Commissioner; text visible immediately on throttled network; no missing glyphs in EN/ES.

- [ ] T030 [P] [US4] Create `scripts/subset-font.sh` running `pyftsubset` (fonttools + brotli) on `~/Desktop/Commissioner/static/Commissioner-{Regular,SemiBold,Bold}.ttf` with Basic Latin + Latin-1 Supplement + general punctuation (`U+0020-007E,U+00A0-00FF,U+2010-2027,U+2030-203A,U+20AC`), `--flavor=woff2 --layout-features=kern,liga`, output to `public/fonts/`; run it, and copy the OFL license from the download to `public/fonts/OFL.txt`
- [ ] T031 [P] [US4] Test `tests/unit/fonts.test.ts`: the three woff2 files and `OFL.txt` exist in `public/fonts/`, combined size ≤ 100 KB, `src/styles/base.css` declares three `@font-face` rules (weights 400/600/700, `font-display: swap`, same-origin `/fonts/` URLs, no third-party hosts), and `index.html` preloads Regular and Bold with `crossorigin`
- [ ] T032 [US4] In `src/styles/base.css` add the three `@font-face` rules, change body `font-family` (currently line 12) to `'Commissioner', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`, and add `button, input, select, textarea { font: inherit; }`; confirm no other font weights are used (existing uses: 600, 700 only) and the scan overlay text inherits the font
- [ ] T033 [US4] Add `<link rel="preload" as="font" type="font/woff2" crossorigin href="/fonts/Commissioner-Regular.woff2">` and the Bold equivalent to `index.html`

**Checkpoint**: All four stories complete.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T034 [P] Confirm tesseract/scan code is a lazy chunk: run `npm run build` and verify initial JS bundle size has not grown by the OCR library (inspect `dist/assets`); no network requests to third-party hosts for OCR or fonts
- [ ] T035 [P] Run `npm run check` (typecheck, lint, unit/component tests, catalog validation) and `npm run test:e2e`; fix failures
- [ ] T036 Run the manual checklist in `specs/002-scan-audio-icon/quickstart.md` on a real phone over HTTPS (both badge styles, multi-badge workbook page, denied permission, offline after one prior scanner use (open the scanner once online, go offline, reopen and confirm it works; then clear site data, go offline and confirm `scan.error.unavailable` appears), camera indicator off after close); tune `src/scan/badges.ts` thresholds if SC-001 (≥90% within 5 s) is not met
- [ ] T037 [P] Update `README.md` with the scan feature, `npm run copy:ocr`, and `scripts/subset-font.sh` prerequisites

---

## Dependencies & Execution Order

- **Phase 1** → **Phase 2** → user stories. T002 outputs are needed by T016/T021; T003 fixtures are needed by T010/T021.
- **US1 (Phase 3)** needs Phase 2. Within US1: tests T009–T013 first (parallel); T014, T015, T016, T016a → T017 (T014–T016a parallel); T017 → T018 → T019 → T020 → T021.
- **US2** depends on US1 (reuses overlay, button, navigation). **US3** depends on US1 (modifies `ScanButton`/`ScanOverlay`/`camera.ts`); US2 and US3 can proceed in parallel after US1 (different pages/tests, but both touch `tests/e2e/scan.spec.ts` and `ScanOverlay.tsx`, so merge carefully).
- **US4 (Phase 6)** is fully independent of Phases 2–5 (only shares `base.css` with overlay styles from T019 — sequence T032 after T019 or merge) and can be done first or in parallel as a standalone shippable change.
- **Polish** after all desired stories.

## Parallel Examples

- **Setup**: T002, T003, T004 together.
- **Foundational**: T005, T006, T007 together, then T008.
- **US1 tests**: T009, T010, T011, T012, T013 together; **US1 modules**: T014, T015, T016 together.
- **US4**: T030 and T031 together, in parallel with any scanner work.

## Implementation Strategy

- **MVP**: Phases 1–3 (US1) — scanning from the Book page end to end. Note the button is ungated until US3; do not ship US1 alone to desktop users — ship US1 + US3 together (T027 is small).
- **Incremental delivery**: US1 → US3 (safety gate) → US2 (unit-page button) → US4 (font, can ship any time).
- Badge localization accuracy (SC-001) is the main risk: validate T010 against fixtures early, before building the UI around it.
