# Implementation Plan: Scan Audio Icon

**Branch**: `002-scan-audio-icon` | **Date**: 2026-10-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-scan-audio-icon/spec.md`

## Summary

Two independent changes to the existing Vite + React + TS app:

1. **Scan audio icon** (US1–US3): a camera overlay, opened from the Book (unit list) and Unit (track list) pages, that finds the headphone badge nearest a center aiming target, reads its number with on-device OCR (self-hosted, lazy-loaded `tesseract.js`, digits only), shows it with an "Open" button, and on confirm navigates to that track. Badge localization is a small pure-TS image step (color-independent), so OCR only sees the badge's numeral. Details in [research.md](./research.md) D1–D4.
2. **Commissioner font** (US4): three self-hosted, Latin-subset `woff2` files (Regular 400, SemiBold 600, Bold 700) with `font-display: swap`, applied globally including form controls ([research.md](./research.md) D6).

## Technical Context

**Language/Version**: TypeScript (strict), Node 22 for tooling (unchanged)

**Primary Dependencies**: React 19, react-router-dom 7, Vite (existing). **New runtime dependency**: `tesseract.js` 7 (lazy chunk, self-hosted worker/core/traineddata). Dev-only: `fonttools` + `brotli` (Python, one-off font subsetting script).

**Storage**: Existing `pe.progress` only; scanning adds no storage. Camera frames are never persisted or transmitted.

**Testing**: Vitest (unit: number-to-track resolution, badge selection/ambiguity, detection stability; component: scan button visibility, overlay states, navigation/back chain, i18n parity; font CSS/asset checks), Playwright at 390×844 with Chromium fake camera (`--use-fake-device-for-media-stream --use-file-for-fake-video-capture`) fed a badge video. Recognition accuracy checked against sample badge photos converted to PNG fixtures.

**Target Platform**: iOS Safari 16.4+ (needed for the WASM SIMD OCR core), Chrome Android; HTTPS (already deployed so). Desktop unchanged (button hidden).

**Project Type**: Static web application (single project).

**Performance Goals**: Correct number shown ≤5 s after aiming (SC-001); no impact on initial bundle — scanner code and OCR assets load only when the overlay opens; fonts ≤ ~100 KB total (FR-017), no blank-text period.

**Constraints**: On-device processing only; camera released on close/unmount; 360 px width, portrait, ≥44 px targets; all strings in `en.json` + `es.json`.

**Scale/Scope**: 2 pages gain a button; 1 new overlay component; ~3 small pure modules; 3 font files.

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1 design — still passes.*

| Principle / Constraint | Status | How the plan satisfies it |
|---|---|---|
| I. Mobile-First, Fast Access | PASS | Reduces taps to scan + Open (SC-002). OCR/wasm is a lazy chunk so first load stays small; fonts swap, never block. |
| II. Multilingual by Default | PASS | New strings in `scan.*` namespace of both locale files; existing parity test covers them. |
| III. Resume | PASS | Scan navigates to the normal Track route, so the existing effect saves progress (FR-013). No position stored. |
| IV. Test-First | PASS | tasks.md orders failing tests before each module; unit + component + Playwright journey. |
| V. Simplicity | PASS w/ note | Native `getUserMedia`, canvas, router; no scanner UI library. One justified dependency (`tesseract.js`) — see Complexity Tracking. |
| TS + React strict | PASS | New code is strict TS. |
| Content/legal | PASS | No new content hosted; test fixtures are badge crops only (full-page photos stay gitignored). OFL license file shipped with font (FR-015). |
| Accessibility | PASS | Native buttons, labelled controls, focus moved into overlay and restored on close, `aria-live` for detected number/messages, Esc closes. |
| No personal data | PASS | Frames processed locally, never stored or sent; stream tracks stopped on close. Font self-hosted (no Google Fonts requests). |
| New text has translations | PASS | EN + ES for every new string. |

## Project Structure

### Documentation (this feature)

```text
specs/002-scan-audio-icon/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md             # /speckit-tasks (not created here)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── ScanButton.tsx          # hidden unless camera-capable; opens ScanOverlay
│   └── ScanOverlay.tsx         # camera view, aim target, status, Open/Cancel
├── scan/
│   ├── camera.ts               # capability check, start/stop stream
│   ├── badges.ts               # find badge candidates in a frame, pick nearest center
│   ├── ocr.ts                  # lazy tesseract worker, digits-only read of a crop
│   ├── stability.ts            # pure reduceReading: confidence ≥70 + 2-frame agreement
│   ├── resolve.ts              # number → {unitId, trackId} within a book
│   └── useScanner.ts           # frame loop, 2-frame stability, status state machine
├── pages/Book.tsx, Unit.tsx    # render <ScanButton/>; navigate on confirm
├── styles/base.css             # @font-face + font-family, overlay styles
└── locales/en.json, es.json    # scan.* strings
public/
├── fonts/                      # Commissioner-{Regular,SemiBold,Bold}.woff2, OFL.txt
└── ocr/                        # tesseract worker, wasm core, eng.traineddata (digits use)
scripts/
├── subset-font.sh              # regenerates fonts from ~/Desktop/Commissioner
└── copy-ocr-assets.ts          # copies tesseract assets from node_modules to public/ocr
tests/
├── unit/                       # resolve, badges, stability
├── component/                  # scan button/overlay/navigation
├── fixtures/badges/            # PNG crops of sample pages/badges
└── e2e/scan.spec.ts
```

**Structure Decision**: Extend the existing single project; scanner logic lives in `src/scan/` as pure, individually testable modules with UI confined to two components.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| New dependency `tesseract.js` (~1 MB code+wasm, ~2 MB lang data, lazy) | iOS Safari has no `TextDetector`; need on-device digit OCR | Native Shape Detection API is Chromium-only; a hand-rolled digit matcher would be more code and less reliable across two badge styles and fonts. Lazy loading keeps first-visit cost at zero. |
