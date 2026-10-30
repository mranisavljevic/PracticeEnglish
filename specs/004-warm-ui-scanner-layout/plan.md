# Implementation Plan: Warm Background & Scanner Layout Refresh

**Branch**: `004-warm-ui-scanner-layout` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-warm-ui-scanner-layout/spec.md`

## Summary

Replace the pure-white page/surface tokens with a cream/sand palette (CSS custom properties in `src/styles/base.css`), and restructure the scanner overlay (`src/components/ScanOverlay.tsx` + `.scan*` CSS) into three stacked zones: a header (title + instructions) at the top, a smaller camera viewport in the middle, and a status + buttons footer at the bottom with safe-area padding. CSS/markup only: no new dependencies, no new strings, scanning logic untouched.

## Technical Context

**Language/Version**: TypeScript 6 (strict), React 19, Vite 8

**Primary Dependencies**: existing only (react-router-dom, tesseract.js); none added

**Storage**: N/A

**Testing**: Vitest + Testing Library (`tests/component`), Playwright e2e at mobile viewport (`tests/e2e`)

**Target Platform**: Mobile browsers first, desktop supported

**Project Type**: Single-page web app

**Performance Goals**: No regression; scan frame analysis unchanged

**Constraints**: WCAG AA contrast (4.5:1); 360×640 viewport; safe-area insets respected; both locales (en, es)

**Scale/Scope**: 1 CSS file, 1 component, `index.html` meta tag, 2–3 test files

No NEEDS CLARIFICATION items remain (see [research.md](./research.md)).

## Constitution Check

| Principle | Status |
|-----------|--------|
| I. Mobile-First | Pass: layout designed for 360×640 first; footer padding improves one-handed tap comfort |
| II. Multilingual | Pass: no new strings; existing `scan.*` keys repositioned; long Spanish text must wrap |
| III. Resume | N/A: no change |
| IV. Test-First | Pass: component and e2e tests updated/written first (red) for zone placement; token contrast covered by a unit test |
| V. Simplicity | Pass: CSS-only change, no dependencies |
| Constraints (a11y) | Pass: dialog semantics, focus trap, `aria-live` retained; touch targets stay ≥48px |

Post-design re-check: still passes; no deviations, Complexity Tracking not needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-warm-ui-scanner-layout/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── ui-contract.md
└── tasks.md             # created by /speckit-tasks
```

### Source Code (repository root)

```text
index.html                        # add viewport-fit=cover
src/
├── components/ScanOverlay.tsx    # markup: header / viewport / footer zones
└── styles/base.css               # color tokens + .scan* layout

tests/
├── component/scan-overlay.test.tsx   # zone placement, error state, a11y
├── unit/                             # token contrast test (new)
└── e2e/scan.spec.ts                  # 360×640 button clearance, viewport height
```

**Structure Decision**: Existing single-project layout; edits confined to the files above.

## Complexity Tracking

No violations.
