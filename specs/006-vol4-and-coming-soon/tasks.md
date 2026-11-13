---

description: "Task list for Volume 4 Student Book & Coming Soon placeholders"
---

# Tasks: Volume 4 Student Book & "Coming Soon" Placeholders

**Input**: Design documents from `/specs/006-vol4-and-coming-soon/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/catalog-coming-soon.md, quickstart.md

**Tests**: Included. The project constitution (Principle IV, Test-First) requires tests written before implementation; write each test task first and confirm it fails.

**Organization**: Grouped by user story. All paths are relative to the repo root.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 = Volume 4 Student Book (P1), US2 = Coming-soon placeholders (P2), US3 = Release a placeholder later (P3)

---

## Phase 1: Setup

**Purpose**: Establish a baseline so Volume 2 regressions are detectable (SC-005).

- [ ] T001 Run `npm run build:catalog && npm run check` on the clean tree and save a copy of the current `src/content/catalog.json` to the scratchpad as the Vol 2 baseline for the later regression diff (no repo changes).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared catalogue plumbing: the `comingSoon` schema/types, the live-vs-placeholder generator rule, and the new locale strings. Both US1 and US2 depend on this.

**⚠️ CRITICAL**: No user story work can start until this phase is complete.

- [ ] T002 [P] Add a failing schema test in `tests/unit/catalog-schema.test.ts`: an optional root `comingSoon` array validates; items require `id`, `levelId`, `type`, `title`; extra properties and a missing `comingSoon` (old catalogues) behave per `specs/006-vol4-and-coming-soon/contracts/catalog-coming-soon.md`.
- [ ] T003 [P] Add failing tests in `tests/unit/catalog.test.ts` for (a) `scripts/catalog-rules.ts`: `comingSoon[].levelId` must exist in `levels`; `comingSoon` ids are unique and must not collide with any `books` id; and (b) the `src/content/catalog.ts` accessors: `getBook` never returns a placeholder, `getComingSoon` returns it, `booksByLevel()` returns `{ level, books, comingSoon }[]` keeping levels with either, in level order.
- [ ] T002a [P] Add a failing generator test (`tests/unit/build-catalog.test.ts`, new): feed a units table where only the Level 3 SB column has ranges and assert `level-3-student-book` is in `books` while the other placeholders stay in `comingSoon`; clearing the column moves it back; empty units are omitted and `OMITTED` tracks excluded. This requires the units-table parsing and live/placeholder split to be an importable function (extract it from `scripts/build-catalog.ts` as part of T008 if needed, keeping output identical).
- [ ] T004 Add the optional `comingSoon` property (schema from the contract) to `specs/001-audio-practice-site/contracts/catalog.schema.json`, keeping root `additionalProperties: false` and `required` unchanged.
- [ ] T005 Implement the new validation rules from T003 in `scripts/catalog-rules.ts` (levelId exists; ids unique and disjoint from `books`).
- [ ] T006 [P] Add `book.comingSoon` ("Coming soon") and `book.unavailable` ("This book isn't available yet. Check back soon.") to `src/locales/en.json`, and "Próximamente" / "Este libro aún no está disponible. Vuelve pronto." to `src/locales/es.json` (the existing `locale-parity` test must pass).
- [ ] T007 Make the T003(b) tests pass: add types and accessors in `src/content/catalog.ts`: `ComingSoonBook`, optional `Catalog.comingSoon`, `getComingSoon(id)`, and extend `booksByLevel()` to return `{ level, books, comingSoon }[]` (levels with either, in level order). `getBook(id)` must never return a placeholder. Update existing callers of `booksByLevel()` so they compile (a pass-through is fine until US2).
- [ ] T008 Make the T002a test pass: update the generator rule in `scripts/build-catalog.ts`: a book is live iff its range column in `docs/UNITS-DRAFT.md` is non-empty, otherwise it is emitted into the top-level `comingSoon` array (`id`, `levelId`, `type`, `title`, `titleTranslations.es`; no units/cover). Remove the `HIDDEN_LEVELS` set and the "All tracks" fallback, include levels 1, 3, 4 in `levels`, and keep Vol 2 output unchanged.

**Checkpoint**: Schema, rules, types, strings and generator rule are in place and their tests (T002, T002a, T003) were seen failing first; user stories can start.

---

## Phase 3: User Story 1 - Practice with the Volume 4 Student Book (Priority: P1) 🎯 MVP

**Goal**: The Volume 4 Student Book is a live book with its units and tracks, playable, resumable and scannable like Volume 2.

**Independent Test**: From the home page open "English in Action 4: Student Book", open any unit, play a track; 76 tracks across 13 units (unit 6 absent, see plan Deviations); track 1 appears nowhere.

### Tests for User Story 1 (write first, confirm they fail)

- [ ] T009 [P] [US1] Create `tests/unit/vol4-catalog.test.ts` asserting against `src/content/catalog.json`: book `level-4-student-book` exists (type `textbook`, es title "English in Action 4: Libro del estudiante"); unit numbers are 1–5 and 7–14; unit ranges match `research.md` (1: 2-6, 2: 7-11, 3: 12-17, 4: 18-23, 5: 24-27, 7: 35-41, 8: 42-48, 9: 49-55, 10: 56-65, 11: 66-69, 12: 70-74, 13: 75-77, 14: 78-84); track 1 is in no unit; the book has exactly 76 tracks, each track appears in exactly one unit (SC-002); every track `file` is `level-4/sb/0NN.mp3` and exists under `audio-source/level-4/sb`.
- [ ] T010 [P] [US1] Add scan-resolution regression cases in the existing scan test file under `tests/unit/` (find the one covering `resolve`): a Vol 4 track number resolves to the correct unit/track, track 1 does not resolve to any unit, and tracks 28–34 (missing chapter 6) resolve to nothing without throwing.
- [ ] T011 [P] [US1] Add `tests/e2e/vol4.spec.ts` (Playwright, mobile viewport): home → "English in Action 4: Student Book" → Unit 1 → play first track (≤3 taps, SC-001); reload and confirm the Continue card returns to it.

### Implementation for User Story 1

- [ ] T012 [US1] Fill the Level 4 "SB tracks" column in `docs/UNITS-DRAFT.md` with the ranges from `specs/006-vol4-and-coming-soon/research.md` (units 1–14, unit 6 = `28-34`), leaving the Level 4 WB column empty.
- [ ] T013 [US1] In `scripts/build-catalog.ts` add `'4/sb': [1]` to `OMITTED` and drop units whose track list is empty (unit 6 disappears until files 028–034 exist), then run `npm run build:catalog` and commit the regenerated `src/content/catalog.json`.
- [ ] T014 [US1] Run `npm run check` and the T009–T010 tests; confirm `docs/SOURCES.md` still passes `checkSources` (77 Level 4 rows already present, FR-011) and that the Vol 2 books in `catalog.json` are identical to the T001 baseline (diff shows additions only: levels 1/3/4, the level-4 student book, and `comingSoon`).
- [ ] T015 [P] [US1] Update `docs/TODO.md`: Level 4 Student Book is live; tracks 28–34 (chapter 6) are still missing at the source, so Unit 6 will appear once those files are added and the catalogue is rebuilt.

**Checkpoint**: Volume 4 Student Book is live and testable on its own (MVP).

---

## Phase 4: User Story 2 - See what's coming soon (Priority: P2)

**Goal**: Five greyed-out, non-interactive "Coming soon" tiles (Vol 1 SB/WB, Vol 3 SB/WB, Vol 4 WB) on the home page, translated, accessible, and excluded from progress/scan/analytics.

**Independent Test**: Open the home page: five greyed tiles labelled "Coming soon" with no link and no tab stop; Spanish shows "Próximamente"; `/b/level-1-student-book` shows a friendly unavailable page.

### Tests for User Story 2 (write first, confirm they fail)

- [ ] T016 [P] [US2] Extend `tests/unit/vol4-catalog.test.ts` (or add `tests/unit/coming-soon-catalog.test.ts`) asserting `comingSoon` ids are exactly `level-1-student-book`, `level-1-workbook`, `level-3-student-book`, `level-3-workbook`, `level-4-workbook`; none has `units`; none appears in `books`; `getBook` returns undefined and `getComingSoon` returns the entry for each.
- [ ] T017 [P] [US2] Create `tests/component/coming-soon.test.tsx`: Home renders five tiles under their levels after the live books; each tile shows the title and visible "Coming soon" text (not `aria-hidden`, which is what exposes it to AT as unavailable, FR-006); tiles are not links/buttons, have no `tabindex`/click handler and are not focusable; clicking does not navigate; in Spanish the badge and `titleTranslations.es` titles render; `/b/level-1-student-book` renders the title, "This book isn't available yet. Check back soon." and a home link, with no ScanButton; `/b/level-1-student-book/u/unit-1` falls through to NotFound.
- [ ] T018 [P] [US2] Add regression tests (find the existing resume/progress and analytics tests under `tests/`): stored progress pointing at a placeholder id is ignored by `loadProgress`/Continue, scan resolution never returns a placeholder, rendering/clicking a placeholder tile fires no analytics event, and visiting `/b/level-1-student-book` directly writes no progress/last-book and sends no book/unit analytics event (FR-008).
- [ ] T019 [P] [US2] Open the existing contrast test in `tests/` and add `.card--soon` title and badge text colours (≥4.5:1 against the card background) to it; if no such test exists, create `tests/unit/contrast.test.ts` using the CSS tokens from `src/styles/base.css`.

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create `src/components/ComingSoonCard.tsx`: a non-link `div` (no `tabIndex`, no handlers) showing the localized title (via `titleTranslations`) and a visible "Coming soon" badge from `book.comingSoon`; badge is real text (not `aria-hidden`); min height 44px matching existing cards.
- [ ] T021 [P] [US2] Add `.card--soon` styles to `src/styles/base.css`: greyed via the `--muted` token and a dashed border (not reduced opacity), no hover/pressed affordance, `cursor: default`.
- [ ] T022 [US2] Update `src/pages/Home.tsx` to use the extended `booksByLevel()` and render each level's `ComingSoonCard`s after its live books.
- [ ] T023 [US2] Update `src/pages/Book.tsx`: when `getBook(id)` is undefined but `getComingSoon(id)` matches, render the title, `book.unavailable` text and a link home (no ScanButton, no error styling); other unknown ids and deeper placeholder URLs keep the existing NotFound.
- [ ] T024 [US2] Run `npm run check` and the T016–T019 tests until green; manually verify the quickstart US2 steps (tiles, Spanish, direct URL).

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 - Release a placeholder when data arrives (Priority: P3)

**Goal**: Turning a placeholder into a live book needs only that book's mapping data and a rebuild.

**Independent Test**: Fill one placeholder's column in `docs/UNITS-DRAFT.md`, rebuild: that book is live and the other four stay greyed.

- [ ] T025 [P] [US3] Confirm T002a covers the release path (Level 3 SB live, other four placeholders, and reversal); add a case for filling a WB column (e.g. Level 4 WB) if it does not.
- [ ] T026 [US3] Make any fix T002a/T025 expose in `scripts/build-catalog.ts` (the live-vs-placeholder rule from T008 should already satisfy it); run the quickstart US3 manual step and revert the temporary edit.
- [ ] T027 [P] [US3] Document the release procedure (fill the "SB tracks"/"WB tracks" column in `docs/UNITS-DRAFT.md`, add the audio to `docs/SOURCES.md`, run `npm run build:catalog`, then `npm run check`) in `docs/TODO.md`.

**Checkpoint**: All three stories complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T028 Run the full suite: `npm run check` and `npm run test:e2e`; confirm 3 live books (Vol 2 SB, Vol 2 WB, Vol 4 SB) and 5 placeholders.
- [ ] T029 Walk through `specs/006-vol4-and-coming-soon/quickstart.md` (US1, US2, regression) and confirm the Vol 2 diff against the T001 baseline shows only additions for level 4 and `comingSoon` (SC-005).
- [ ] T030 Report the plan's two deviations to the owner in the PR description: Unit 6 is hidden because tracks 28–34 are missing at the source (13 units, not 14; spec FR-001 now says so), and unit titles come from `docs/UNITS-DRAFT.md` (spec assumption updated).

---

## Dependencies & Execution Order

- **Phase 1** → **Phase 2** → user stories. Phase 2 blocks everything.
- **US1 (P1)** depends only on Phase 2; it is the MVP.
- **US2 (P2)** depends on Phase 2 and the regenerated `catalog.json` (T013) for real placeholder data; its component work (T020, T021) can begin right after Phase 2.
- **US3 (P3)** depends on Phase 2 (generator rule); verify after US1 so the baseline data is final.
- **Polish** after all desired stories.
- Within a phase: tests first (must fail), then implementation. T002a before T008; T003 before T005 and T007; T004 before T005; T007 before T022/T023; T012 before T013; T020/T021 before T022.

## Parallel Opportunities

- Phase 2: T002, T002a, T003, T006 together; then T004/T005 and T007 in parallel with each other once their tests exist (T008 after T005 and T007 are understood).
- US1: T009, T010, T011 (tests) together; T015 alongside T014.
- US2: T016–T019 together; T020 and T021 together.
- US3: T025 and T027 together.

### Parallel example: User Story 2

```text
Task: "Placeholder catalogue assertions in tests/unit/coming-soon-catalog.test.ts"   (T016)
Task: "Component tests in tests/component/coming-soon.test.tsx"                        (T017)
Task: "Resume/scan/analytics exclusion tests"                                         (T018)
Task: "ComingSoonCard in src/components/ComingSoonCard.tsx"                           (T020)
Task: "Placeholder styles in src/styles/base.css"                                     (T021)
```

## Implementation Strategy

1. **MVP**: Phases 1–3 (setup, foundation, US1). Volume 4 is live; stop and validate against the US1 independent test.
2. **Increment 2**: Phase 4 (US2) adds the five placeholder tiles; validate independently.
3. **Increment 3**: Phase 5 (US3) proves the release path; Phase 6 polish and PR.
