# Implementation Plan: PracticeEnglish Audio Site

**Branch**: `001-audio-practice-site` | **Date**: 2026-10-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-audio-practice-site/spec.md`

## Summary

A static, mobile-first single-page app where learners pick a book → unit → numbered track and
play the audio, in English or Spanish, with the language and last-played track remembered on the
device. Built with Vite + React + TypeScript (strict), deployed to Netlify (as in `comk`).
Book/unit/track structure is a JSON catalogue; UI strings are per-locale JSON. Audio files are
**not** in git or the Netlify bundle: they are hosted on a dedicated Firebase Hosting site served
at `audio.practiceenglish.net` (see [research.md](./research.md) D2).

**First implementation task (per owner request): initialize git** (`git init`, `.gitignore`,
initial commit) before any other work, including scaffolding.

## Technical Context

**Language/Version**: TypeScript 5.x (strict), Node 22 LTS for tooling

**Primary Dependencies**: React 19, Vite 7 (matches `comk`), react-router-dom 7 (shareable URLs; justified in Complexity Tracking). Dev: Vitest, @testing-library/react, Playwright, ESLint, Ajv (catalogue validation script). No i18n library: a ~40-line typed `t()` helper with English fallback.

**Storage**: Device-only `localStorage` (`pe.lang`, `pe.progress`), every access wrapped in try/catch. Content: `src/content/catalog.json`. Audio: static files on Firebase Hosting (Spark plan), referenced by relative path.

**Testing**: Vitest (unit: resume/progress, catalogue navigation, locale selection/fallback, catalogue schema), Testing Library (component), Playwright at 390×844 mobile viewport (open → pick/resume → play; language switch), run in CI-less local gate: `npm run check` = typecheck + lint + test + validate:catalog.

**Target Platform**: Evergreen mobile browsers (iOS Safari 16+, Chrome Android) and desktop; online only.

**Project Type**: Static web application (single project, no backend).

**Performance Goals**: Home usable ≤3 s on typical mobile (SC-005); audio starts ≤3 s (SC-004) via `<audio preload="metadata">`, HTTP range streaming from CDN; initial JS ≤ ~100 KB gzip.

**Constraints**: No personal data/analytics; 360 px minimum width; no horizontal scroll; keyboard operable; 44 px touch targets; no auto-advance; 0.75×/1× speed resets per file.

**Scale/Scope**: Tens of books, hundreds of units, low thousands of tracks; ~6 screens (Home, Book, Unit, Track/Player, language switcher, not-found/offline states).

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1 design.*

| Principle / Constraint | Status | How the plan satisfies it |
|---|---|---|
| I. Mobile-First, Fast Access | PASS | Mobile-first CSS; ≤4 taps to play (SC-001); no account; `<audio>` streams via range requests; small bundle; CDN-hosted audio. |
| II. Multilingual by Default | PASS | All strings from `src/locales/<code>.json`; adding a locale = one JSON file (auto-discovered, includes `meta.nativeName`), no code change; default from `navigator.languages`, persisted; English titles shown beside any translation. |
| III. Resume (v2.0.0: no position) | PASS | `pe.progress` stores `{bookId, unitId, trackId}` only; Continue navigates to the track with player at 0:00. Explicit level → book → unit → track hierarchy in the catalogue. |
| IV. Test-First | PASS | tasks.md must order test tasks before implementation; unit tests for progress, navigation, locale; Playwright mobile journey. |
| V. Simplicity | PASS w/ note | Native `<audio>`, `localStorage`, no i18n/state libraries. One justified dependency: react-router. |
| TS + React, strict | PASS | Vite React-TS template, `"strict": true`. |
| Content/legal constraints | PASS | Only publisher-freely-downloadable audio; credit + non-endorsement footer; documented takedown procedure (remove file from audio site + catalogue entry); no circumvention. |
| Accessibility | PASS | Native buttons/links, labelled controls, focus management on route change, `lang` attribute updated on `<html>`. |
| No personal data | PASS | No analytics, no cookies; Netlify/Firebase server logs are the only incidental data (noted in README). |
| New text has all translations | PASS | A unit test fails if `es.json` lacks a key present in `en.json`. |

No violations → Complexity Tracking limited to the one dependency note.

## Project Structure

### Documentation (this feature)

```text
specs/001-audio-practice-site/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── catalog.schema.json     # content data contract
│   ├── routes.md               # URL contract
│   ├── locale-file.md          # translation contract
│   └── local-storage.md        # persisted-state contract
├── checklists/
└── tasks.md                    # produced later by /speckit-tasks
```

### Source Code (repository root)

```text
.gitignore                      # node_modules, dist, audio-source/, .env*, .firebase
netlify.toml                    # build, SPA redirect, security/cache headers
package.json  tsconfig.json  vite.config.ts  eslint.config.js
index.html
public/                         # favicon, covers (small, optimized)
src/
├── main.tsx  App.tsx  router.tsx
├── content/
│   ├── catalog.json            # levels → books → units → tracks
│   └── catalog.ts              # typed loader + lookup helpers (pure)
├── i18n/
│   ├── index.ts                # locale auto-discovery, detect/fallback, t()
│   └── LocaleProvider.tsx
├── locales/
│   ├── en.json
│   └── es.json
├── storage/
│   ├── safeStorage.ts          # try/catch wrapper
│   └── progress.ts             # load/save/validate last track
├── pages/                      # Home, Book, Unit, Track, NotFound
├── components/                 # Player, LanguageSwitcher, ContinueCard, Breadcrumb, Credit, OfflineNotice
└── styles/                     # CSS (mobile-first, no framework)
tests/
├── unit/                       # progress, catalog, i18n, locale-parity, schema
├── component/
└── e2e/                        # Playwright, mobile viewport
scripts/
├── validate-catalog.ts         # Ajv + referential checks (audio file exists)
└── deploy-audio.sh             # firebase deploy for the audio site
audio-source/                   # git-ignored local copies of audio (uploaded, not committed)
firebase/                       # separate audio-hosting config
├── firebase.json               # public: ../audio-source, headers, cache
└── .firebaserc
```

**Structure Decision**: Single static project (no backend). Audio is deliberately outside the
app bundle and outside git; `firebase/` holds only the hosting config for the audio site.

## Complexity Tracking

| Violation / Addition | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| `react-router-dom` dependency | FR-005 requires a shareable link for every book/unit/track with back-navigation and per-route focus handling | A hand-rolled History API router is more code to test than the library costs in bytes (~15 KB gz) |
| Second hosting target (Firebase) | ~hundreds of MB–GB of audio would bloat git and Netlify deploys/bandwidth | Committing audio to git/Netlify exceeds sensible repo size and Netlify free bandwidth |
