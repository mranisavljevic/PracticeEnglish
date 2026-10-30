---

description: "Task list for Warm Background & Scanner Layout Refresh"
---

# Tasks: Warm Background & Scanner Layout Refresh

**Input**: Design documents from `/specs/004-warm-ui-scanner-layout/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ui-contract.md, quickstart.md

**Tests**: Included. Constitution principle IV (Test-First) requires tests written first and failing before implementation.

**Organization**: Grouped by user story. US1 (warm palette) is independent of US2/US3 (scanner layout). US2 and US3 both edit the scanner markup/CSS, so US3 follows US2.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1, US2, US3

## Path Conventions

Single project: `src/`, `tests/` at repository root. Files touched: `index.html`, `src/components/ScanOverlay.tsx`, `src/styles/base.css`, `tests/unit/`, `tests/component/scan-overlay.test.tsx`, `tests/e2e/scan.spec.ts`.

---

## Phase 1: Setup

**Purpose**: Establish a baseline before changing anything

- [X] T001 Run `npm run check` from repo root and confirm it passes on the current branch; record the current scanner viewport height at 360x640 (the video is full-bleed, so 640px) as the SC-004 baseline

---

## Phase 2: Foundational

**Purpose**: Shared change needed by more than one story

- [X] T002 Add `viewport-fit=cover` to the viewport meta tag in `index.html` (becomes `width=device-width, initial-scale=1, viewport-fit=cover`) so `env(safe-area-inset-bottom)` is non-zero on notched devices (needed by US3)

**Checkpoint**: Baseline green, meta tag updated.

---

## Phase 3: User Story 1 - Warmer, more welcoming look (Priority: P1) 🎯 MVP

**Goal**: Replace pure-white page and surface colors with the cream/sand palette; blue accent unchanged.

**Independent Test**: Open home, book, unit and track pages; no stark white backgrounds, text legible, blue unchanged.

### Tests for User Story 1 (write first, must fail)

- [X] T003 [US1] Create `tests/unit/theme-contrast.test.ts`: read `src/styles/base.css`, parse the `:root` tokens `--bg`, `--surface`, `--fg`, `--muted`, `--accent`, `--danger`, compute WCAG contrast, and assert every pair listed in research.md section 1 is >= 4.5:1 (`--fg`, `--muted`, `--accent`, `--danger` on both `--bg` and `--surface`). Also assert `--bg` is not `#ffffff` and `--accent` is still `#1d4ed8`.

### Implementation for User Story 1

- [X] T004 [US1] In `src/styles/base.css` `:root`, change `--bg` to `#faf6ee`, `--surface` to `#f3ece0`, `--border` to `#d9d0bd`; leave `--accent`, `--accent-fg`, `--fg`, `--muted`, `--danger` untouched (per data-model.md)
- [X] T005 [US1] Grep `src/styles/base.css` and `src/**/*.tsx` for hard-coded `#fff`, `#ffffff` and `white` used as a background (exclude `--accent-fg`, button text on blue, and the scanner's light-on-dark text/reticle border); replace any background hits with `var(--bg)` or `var(--surface)`
- [X] T006 [US1] Run `npm run check`; confirm T003 passes and no existing test regressed

**Checkpoint**: Site has a warm background; US1 shippable on its own.

---

## Phase 4: User Story 2 - Scanner header with title and instructions (Priority: P2)

**Goal**: Title and instructions form a header at the top; status/error text stays at the bottom; the layout becomes three zones.

**Independent Test**: Open the scanner; title + instructions at top; trigger starting, hint, detected, not-found and error states; messages appear in the bottom panel; in error, title stays on top and "Choose manually" is reachable.

### Tests for User Story 2 (write first, must fail)

- [X] T007 [P] [US2] Update `tests/component/scan-overlay.test.tsx` to assert the contract in `contracts/ui-contract.md`: `.scan__header` contains `#scan-title` and `.scan__instructions`; `.scan__status` is inside `.scan__panel` and not inside `.scan__header`; DOM order is header, `.scan__viewport`, `.scan__panel`; `.scan__viewport` contains the `video` and `.scan__reticle`; in the error state `.scan__instructions` is absent, `.scan__viewport` has the `hidden` attribute, the video is still mounted, the title is present and "Choose manually" is rendered
- [X] T008 [P] [US2] Keep existing overlay assertions (Escape closes, Tab trap, focus restore, `aria-live="polite"` on `.scan__status`) passing in `tests/component/scan-overlay.test.tsx`; add one for the Spanish locale rendering the same zone structure

### Implementation for User Story 2

- [X] T009 [US2] Restructure the JSX in `src/components/ScanOverlay.tsx` into `header.scan__header` (h2 `#scan-title.scan__title` + `p.scan__instructions`, instructions omitted when `status === 'error'`), `div.scan__viewport` (`<video ref={videoRef} className="scan__video">` + `div.scan__reticle[aria-hidden]`, with `hidden` when `status === 'error'`), and `div.scan__panel` (`.scan__status[aria-live=polite]` + `.scan__actions`). Do not change any hook, handler, string key or `useScanner` usage.
- [X] T010 [US2] In `src/styles/base.css` scanner block (lines ~108-117), make `.scan` a column flex with `justify-content: flex-start`; add `.scan__header { padding: 1rem 1rem 0.5rem; }`; keep `.scan__title`, `.scan__instructions`, `.scan__status` rules; make `.scan__panel` non-overlay (static, `margin-top: auto`, no longer positioned over the video)
- [X] T011 [US2] Run `npm run check`; confirm T007/T008 pass

**Checkpoint**: Zone order and message placement correct (viewport sizing finished in US3).

---

## Phase 5: User Story 3 - Smaller viewport and comfortable button area (Priority: P2)

**Goal**: Camera viewport capped at about 50dvh and shrinking first; bottom padding of at least 24px plus safe area; guide frame stays inside the viewport.

**Independent Test**: At 360x640, buttons are >= 16px above the bottom edge and fully visible; the viewport is at least 15% shorter than the 640px baseline; scanning still works.

**Depends on**: US2 (same markup and CSS block) and T002.

### Tests for User Story 3 (write first, must fail)

- [X] T012 [US3] In `tests/e2e/scan.spec.ts` add a 360x640 test (with the existing fake-camera setup used by that file): assert the lowest `.scan__actions` button's bottom edge is at least 16px above the viewport bottom and the button is fully in view; assert `.scan__viewport` bounding height <= 0.85 * 640; assert `.scan__header` and `.scan__panel` are fully visible and do not overlap `.scan__viewport`; assert `.scan__reticle` bounding box lies inside `.scan__viewport`
- [X] T013 [US3] In `tests/e2e/scan.spec.ts` add a Spanish-locale case at 360x640 and a landscape case (640x360) asserting header, viewport, status and buttons are all visible without overlap (viewport shrinks first)

### Implementation for User Story 3

- [X] T014 [US3] In `src/styles/base.css`: replace `.scan__video` absolute full-bleed with `width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius); display: block;`; add `.scan__viewport { position: relative; flex: 1 1 0; min-height: 0; max-height: 50vh; max-height: 50dvh; margin: 0 1rem; overflow: hidden; border-radius: var(--radius); }`; change `.scan__reticle` positioning to center within `.scan__viewport` (`top: 50%`) and keep its existing size/border/shadow
- [X] T015 [US3] In `src/styles/base.css` set `.scan__panel` padding to `1rem 1rem calc(1.5rem + env(safe-area-inset-bottom))`, with a plain dark background (e.g. `transparent` over the `#000` backdrop); ensure `.scan__header` and `.scan__panel` use `flex: 0 0 auto` so only the viewport shrinks; confirm `.scan__actions > *` keeps `min-height: 48px`
- [X] T016 [US3] Run `npm run check` and `npm run test:e2e`; confirm T012/T013 pass and no existing e2e test regressed

**Checkpoint**: All three stories work.

---

## Phase 6: Polish & Cross-Cutting

- [ ] T017 Walk through `specs/004-warm-ui-scanner-layout/quickstart.md` manual steps 1-7 (home/book/unit/track pages, scanner, blocked camera, Spanish, landscape, real icon scan) and note any deviation
- [X] T018 [P] Verify the scanner backdrop remains `#000` with light text and is visually distinct from the warm page background in `src/styles/base.css`
- [X] T019 Final `npm run check` and `npm run test:e2e`; confirm `src/scan/*` has no diff (`git diff --stat -- src/scan`)

---

## Dependencies & Execution Order

- Phase 1 then Phase 2 first.
- US1 (Phase 3) is independent of US2/US3; it can run in parallel with them (it only edits `:root` tokens in `base.css`, so coordinate if two people edit that file).
- US2 (Phase 4) before US3 (Phase 5): both edit `ScanOverlay.tsx` markup and the `.scan*` CSS block; US3 also needs T002.
- Within each story: tests first (must fail), then implementation, then the `npm run check` task.

### Story completion order

`Setup → Foundational → US1` (MVP) and `Foundational → US2 → US3`, then Polish.

## Parallel Opportunities

- T007 and T008 (same file, separate test blocks; write together) can proceed alongside T003/T004 from US1.
- US1 (T003-T006) can run in parallel with US2 (T007-T011), as they touch different areas.
- T018 can run alongside T017.

### Parallel example (after Phase 2)

```text
Track A: T003 → T004 → T005 → T006        (US1, palette)
Track B: T007 + T008 → T009 → T010 → T011 (US2, scanner zones)
Then:    T012, T013 → T014 → T015 → T016  (US3)
```

## Implementation Strategy

- **MVP**: Phase 1, Phase 2, then US1 (T001-T006). This delivers the warmer look site-wide.
- **Incremental**: add US2 (zones), then US3 (sizing and padding), validating each at its checkpoint.
- Scanning logic in `src/scan/*` is never modified.
