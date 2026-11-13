# Implementation Plan: French Translation

**Branch**: `007-french-translation` | **Date**: 2026-11-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-french-translation/spec.md`

## Summary

Add French as a third interface language. The i18n layer already discovers locales by globbing `src/locales/*.json`, detects the browser's primary subtag (so `fr-CA`/`fr-BE`/`fr-CH` resolve to `fr`), persists the choice, sets `<html lang>`, and lists locales in the switcher. The feature is therefore a new `src/locales/fr.json` (formal "vous", 60 keys, placeholders intact) plus test updates: two existing assertions treat `fr` as unsupported and must change, and new tests cover French detection, a French parity/vous check, a French e2e journey, and a 360px overflow check in French. No runtime code or dependency changes.

## Technical Context

**Language/Version**: TypeScript (strict), React 19, Vite

**Primary Dependencies**: none added (existing i18n module, react-router-dom)

**Storage**: `localStorage` key `pe.lang` (unchanged)

**Testing**: Vitest + Testing Library (unit/component), Playwright (e2e, mobile viewport)

**Target Platform**: Mobile-first web, modern browsers

**Project Type**: web-app (single frontend project)

**Performance Goals**: Language switch visible < 1 s without reload (already in-memory; locale JSON is eagerly bundled, ~4 KB added)

**Constraints**: French strings run longer than English; no clipping or horizontal scroll at 360px; placeholders `{number}`, `{label}`, `{title}`, `{track}`, `{book}`, `{unit}` preserved

**Scale/Scope**: 1 new JSON file (60 keys), ~4 test files touched/added, README note

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Mobile-First | PASS | 360px no-overflow e2e check run in French (FR-008) |
| II. Multilingual by Default | PASS | Exactly the "add a language = resources only" path; strings from resources; titles stay English; browser-language default reused |
| III. Resume | PASS | Untouched |
| IV. Test-First | PASS | Tests written first and observed failing (fr undefined) before `fr.json` is added; unit tests for detection/fallback, e2e for journey |
| V. Simplicity | PASS | No new dependencies, no code changes |
| Constraints / Workflow | PASS | Accessibility labels translated (`lang.label`); consent/analytics text translated per "all supported languages" rule; no data collection change |

Post-design re-check: PASS, no violations; Complexity Tracking not needed.

## Project Structure

### Documentation (this feature)

```text
specs/007-french-translation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── locale-resource.md
└── tasks.md             # /speckit-tasks
```

### Source Code (repository root)

```text
src/
└── locales/
    ├── en.json
    ├── es.json
    └── fr.json            # NEW

tests/
├── unit/
│   ├── i18n-detect.test.ts     # CHANGE: 'fr' no longer unsupported; add fr cases
│   └── locale-parity.test.ts   # ADD: fr formal-register check
└── e2e/
    ├── language.spec.ts        # ADD: French device journey + persistence
    └── responsive.spec.ts      # ADD: 360px no-overflow in French

README.md                       # CHANGE: list supported languages (optional note)
```

**Structure Decision**: Existing single-project layout; the glob-based locale registry means no registration code is needed.

## Complexity Tracking

No violations.
