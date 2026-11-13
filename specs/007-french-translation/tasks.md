---

description: "Task list for French Translation"
---

# Tasks: French Translation

**Input**: Design documents from `/specs/007-french-translation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/locale-resource.md, quickstart.md

**Tests**: REQUIRED. Constitution principle IV (Test-First) and FR-010/FR-011 demand automated checks; tests are written and observed failing before `src/locales/fr.json` exists.

**Organization**: Grouped by user story. The feature is resource-only (no runtime code changes): one new locale file plus test updates and a README note.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1/US2/US3 (spec.md priorities P1/P2/P3)

## Phase 1: Setup

**Purpose**: Confirm the baseline before changing anything.

- [X] T001 Run `npm run check` from the repo root and confirm the baseline is green (record the key count of `src/locales/en.json`, currently 58, as the parity target; never hard-code the count in tests)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Existing tests treat `fr` as an unsupported language. They must be repointed to a genuinely unsupported code (`de`) so they stay valid once French is registered.

**⚠️ CRITICAL**: Must finish before `src/locales/fr.json` is added, otherwise the suite breaks for the wrong reason.

- [X] T002 [P] In `tests/unit/i18n-detect.test.ts`, change the unsupported-language examples from `fr` to `de`: `isSupported('fr')` → `isSupported('de')` (test "isSupported checks registered locales"), and the fallback test's `setNavigator(['fr-FR', 'de'])` → `setNavigator(['de-DE', 'it'])`. Leave the "uses first supported primary subtag" test for T005.
- [X] T003 [P] In `tests/component/analytics-visit.test.tsx` (test "carries the language actually displayed when the saved one is unsupported", ~line 106), change `mockReturnValue(['fr'])` to `mockReturnValue(['de'])` so the browser language is still unsupported and the expectation of `en` remains valid.

**Checkpoint**: `npm run check` still green with no `fr.json`.

---

## Phase 3: User Story 1 - Use the whole app in French (Priority: P1) 🎯 MVP

**Goal**: A complete French interface (same key set as `en.json`, formal "vous", placeholders intact, titles untranslated) selectable from the language switcher.

**Independent Test**: Select "Français" and walk home → book → unit → track → play, plus offline and 404 states; no English/Spanish UI text, titles stay English.

### Tests for User Story 1 (write first, observe FAIL)

- [X] T004 [P] [US1] In `tests/unit/locale-parity.test.ts`, add: (a) a test that `locales.fr` exists and has exactly the same key set as `en` (no missing AND no extra keys, FR-010); (b) a test that `fr` contains no tu-forms: no value matches the Unicode-aware `/(?<![\p{L}'])(tu|ton|ta|tes|toi|te|t')(?![\p{L}])/iu` (plain `\b` is unsafe with accented letters); if a legitimate word is ever flagged, add it to a small named allowlist in the test rather than loosening the regex (FR-011); (c) a test that `meta.nativeName` of `fr` equals `"Français"`; (d) a test that `app.name` is `"PracticeEnglish"` and `credit.source` and `app.tagline` still contain `English in Action` where English does (FR-005); (e) a test that for every key, the set of `{placeholder}` tokens in `fr` equals the set in `en` (FR-006); (f) a test that no `fr` value has an ordinary space immediately before `:`, `?`, `!` or `;` (a U+00A0 non-breaking space is required, per the typographic edge case). Run `npm run test:unit` (or `npx vitest run tests/unit/locale-parity.test.ts`) and confirm these FAIL because `src/locales/fr.json` does not exist.
- [X] T005 [P] [US1] In `tests/e2e/language.spec.ts`, add a `test.describe('French device')` with `test.use({ locale: 'fr-FR' })` mirroring the Spanish block: home `h1` shows the French "choose your book" heading, an English book title (`Sample Textbook: A Deliberately Long English Title`, `exact: false`) stays visible, switching the combobox to `en` shows `Choose your book`. The expected French text is read at test time from `src/locales/fr.json` (import the JSON, e.g. `fr["home.heading"]`), so no string has to be agreed in advance; before T006 the import fails, which is the Red state. Add a second test walking home → book → unit → track and asserting `document.documentElement.lang === 'fr'` and that the page text contains none of the English/Spanish heading strings from `en.json`/`es.json` for the same keys. In the same walk, assert the analytics consent banner (clear `pe.*` consent state first so it appears), the `/nope` 404 page and an offline state (`context.setOffline(true)`) render the French strings from `fr.json` (US1 scenario 3, SC-002). Confirm FAIL.

### Implementation for User Story 1

- [X] T006 [US1] Create `src/locales/fr.json`: a flat JSON object with exactly the keys of `src/locales/en.json` (58 at time of writing) in the same order, French values, formal "vous" register, `"meta.nativeName": "Français"`, placeholders (`{number}`, `{label}`, `{title}`, `{track}`, `{book}`, `{unit}`) preserved per key, straight `'` apostrophes, a non-breaking space (U+00A0) before `:`, `?`, `!`, `;` (e.g. `"Unité {number} : {title}"`, consent title ending ` ?`), `…` and `×` as in English, `app.name` = `PracticeEnglish`, "English in Action" kept verbatim in `credit.source` and `app.tagline`, `lang.label` translated. Follow `contracts/locale-resource.md` and `data-model.md`; use `src/locales/es.json` as the structural reference.
- [X] T007 [US1] Run `npm run check` and `npx playwright test tests/e2e/language.spec.ts`; T004 and T005 tests must now PASS and the rest of the suite stay green. Fix any key/placeholder/tu-form findings in `src/locales/fr.json`.

**Checkpoint**: French works end to end and is selectable; User Story 1 is independently demonstrable (MVP).

---

## Phase 4: User Story 2 - French is remembered and auto-detected (Priority: P2)

**Goal**: French browsers (including `fr-CA`, `fr-BE`, `fr-CH`) default to French; the choice persists; a saved choice wins.

**Independent Test**: Load with a French browser language and no saved preference → French; pick French, reload → still French.

### Tests for User Story 2

- [X] T008 [P] [US2] In `tests/unit/i18n-detect.test.ts`: (a) in the "isSupported checks registered locales" test (already repointed to `de` by T002) add `expect(isSupported('fr')).toBe(true)`; (b) update the existing "uses first supported primary subtag" test, which currently uses `setNavigator(['fr-FR', 'es-MX', 'en-US'])` and expects `es`, to `setNavigator(['de-DE', 'fr-FR', 'es-MX'])` expecting `'fr'`; (c) add a `it.each(['fr', 'fr-FR', 'fr-CA', 'fr-BE', 'fr-CH'])` test that `detectLanguage()` returns `'fr'` with no saved value; (d) add a test that a saved `pe.lang = 'es'` wins over `['fr-CA']`; (e) add a test that a saved `pe.lang = 'fr'` wins over `['es-MX']`. Author and run these in the Red step together with T004/T005, before T006 creates `fr.json`, and confirm (a)–(c) and (e) FAIL (no file-juggling needed). Must follow T002 (same file).
- [X] T009 [US2] In `tests/e2e/language.spec.ts`, inside the French describe from T005, add a test: start on `fr-FR`, switch combobox to `es` then back to `fr`, `page.reload()`, and assert the heading is still French and `localStorage.getItem('pe.lang') === 'fr'` (via `page.evaluate`). Add a test with `locale: 'fr-CA'` asserting the French heading on first load.

### Implementation for User Story 2

- [X] T010 [US2] Run `npx vitest run tests/unit/i18n-detect.test.ts tests/component/analytics-visit.test.tsx` and `npx playwright test tests/e2e/language.spec.ts`; all pass. No source change is expected (detection already matches on primary subtag per research.md Decision 2); if a case fails, fix the cause in `src/i18n/index.ts` minimally.

**Checkpoint**: US1 and US2 both work independently.

---

## Phase 5: User Story 3 - Selector and page metadata (Priority: P3)

**Goal**: "Français" appears in the selector; `<html lang="fr">` while active; French text fits at 360px.

**Independent Test**: Open selector → "Français" listed; select it → `document.documentElement.lang` is `fr`; no horizontal scroll at 360px.

### Tests for User Story 3

- [X] T011 [P] [US3] In `tests/e2e/language.spec.ts` (French describe), add a test asserting the language combobox options include `English`, `Español`, and `Français` (`page.getByRole('combobox').locator('option')` texts) and that after `selectOption('fr')` the `html` element has attribute `lang="fr"`. Also assert SC-004/US1 scenario 1: starting from English, register `page.on('load')` and `page.on('framenavigated')` counters, select `fr`, and assert the French heading is visible within 1000 ms (`expect(...).toBeVisible({ timeout: 1000 })`) with zero additional load/navigation events (no reload).
- [X] T012 [P] [US3] In `tests/e2e/responsive.spec.ts`, add a 360×740 check run with French active (`test.use({ locale: 'fr-FR' })` in a new describe, or set `localStorage['pe.lang']='fr'` via `page.addInitScript`) that visits every entry of the existing top-level `routes` constant (`/`, book, unit, `track-12a`, `/nope`) at 360×740 and asserts `document.documentElement.scrollWidth <= document.documentElement.clientWidth` (the same expression the existing test uses; there is no helper to reuse, so export or duplicate the `routes` array; FR-008, SC-005).

### Implementation for User Story 3

- [X] T013 [US3] Run `npx playwright test tests/e2e/language.spec.ts tests/e2e/responsive.spec.ts`. If any French string overflows at 360px, shorten that value in `src/locales/fr.json` (keep meaning and "vous"); only adjust CSS in `src/` if shortening cannot fix it.

**Checkpoint**: All three stories verified.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T014 [P] Update the "Adding a language" section of `README.md` to mention that English, Spanish and French are currently supported (one sentence; do not change the instructions).
- [X] T018 [P] Hard-coded string audit (FR-002, constitution II): search `src/` components for user-facing literals that bypass `t()` (JSX text nodes, `aria-label`, `title`, `placeholder`, `alt` attributes with literal strings, e.g. `grep -rnE "aria-label=\"|title=\"|placeholder=\"|alt=\"" src --include=*.tsx` and a scan for JSX text between tags). Move any finding into `en.json`, `es.json` and `fr.json` together; if none, record "none found" in the PR description. Run before T015.
- [X] T015 Run the full gate: `npm run check` and `npm run test:e2e`; all green.
- [ ] T016 Walk through `specs/007-french-translation/quickstart.md` manually (browser language `fr-CA`: home → book → unit → track → play, offline state, `/nope`; confirm no English/Spanish UI text and `document.documentElement.lang === 'fr'`).
- [ ] T017 Release gate (not code): have a French speaker review `src/locales/fr.json` per spec Assumptions; record the outcome in the PR description.

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → US1 → US2 → US3 → Polish.
- T002 and T003 touch different files → parallel.
- Within US1: T004 and T005 (different files) in parallel, observed failing, then T006, then T007.
- T008 shares `tests/unit/i18n-detect.test.ts` with T002: do T002 first. T008 is authored in the Red step with T004/T005, before T006.
- T018 is independent of the others and runs before T015. T009, T011 share `tests/e2e/language.spec.ts` with T005 → sequential after T005 (T011 may be authored in parallel with T012).
- US2/US3 depend on `fr.json` (T006) for their green run, but their tests can be authored in parallel with US1 tests (different or non-conflicting regions).

## Parallel Example

```bash
# Phase 2:
Task: "Repoint fr→de in tests/unit/i18n-detect.test.ts"      # T002
Task: "Repoint ['fr']→['de'] in tests/component/analytics-visit.test.tsx"  # T003

# US1 tests:
Task: "Add fr parity/vous tests in tests/unit/locale-parity.test.ts"   # T004
Task: "Add French journey in tests/e2e/language.spec.ts"               # T005

# US3 tests:
Task: "Selector + html lang test in tests/e2e/language.spec.ts"        # T011
Task: "360px French overflow test in tests/e2e/responsive.spec.ts"     # T012
```

## Implementation Strategy

- **MVP**: Phases 1–3 (T001–T007). Ship-ready French UI once reviewed.
- **Incremental**: US2 (detection/persistence verification) then US3 (selector/metadata/overflow), then polish.
- Red-Green: T004/T005/T008 must be observed failing before T006 lands.

## Notes

- No runtime code or dependencies change; any `src/` edit (T010, T013) is a contingency only.
- Commit after each phase.
