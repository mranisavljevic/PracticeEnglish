---

description: "Task list for PracticeEnglish Audio Site"
---

# Tasks: PracticeEnglish Audio Site

**Input**: Design documents from `/specs/001-audio-practice-site/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (catalog.schema.json, routes.md, locale-file.md, local-storage.md), quickstart.md

**Tests**: REQUIRED. Constitution Principle IV (Test-First, NON-NEGOTIABLE) and plan.md mandate that tests are written and observed to FAIL before the implementation they cover. Test tasks therefore precede implementation tasks in every phase.

**Organization**: Grouped by user story (US1–US4 from spec.md) so each can be implemented and tested independently.

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: US1 (find & play), US2 (language), US3 (continue), US4 (mobile/desktop comfort)
- All paths are relative to the repo root `/Users/mranisavljevic/Dev/PracticeEnglish`

## Conventions that apply to every task

- TypeScript `strict`; no user-facing literal text in components — use `t('key')` and add the key to BOTH `src/locales/en.json` and `src/locales/es.json`.
- Every `localStorage` access goes through `src/storage/safeStorage.ts`.
- Audio URL = `${import.meta.env.VITE_AUDIO_BASE_URL ?? 'https://audio.practiceenglish.net'}/${track.file}`.
- Track `label` is a verbatim string ("12a"); never parse it as a number.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Git, project scaffold, tooling

- [X] T001 Initialize git per owner request (FIRST task, before any scaffolding): run `git init -b main`, create `.gitignore` (node_modules, dist, audio-source/, .env*, !.env.example, .firebase, .DS_Store, playwright-report, test-results), then `git add -A && git commit -m "Initial commit: Spec Kit scaffolding and spec"`; afterwards create branch `001-audio-practice-site`
- [X] T002 Scaffold Vite 7 + React 19 + TypeScript project at repo root (`package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`) without overwriting `.specify/`, `.claude/`, `specs/`; add dependencies `react-router-dom@7` and dev dependencies `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`, `eslint` (+ typescript-eslint, react-hooks plugin), `ajv`, `ajv-formats`, `tsx`
- [X] T003 Set `"strict": true` (plus `noUncheckedIndexedAccess`, `resolveJsonModule`) in `tsconfig.json`; configure Vitest (jsdom, setup file `tests/setup.ts` importing jest-dom) in `vite.config.ts`; create `eslint.config.js`
- [X] T004 [P] Create `playwright.config.ts` (webServers = `VITE_AUDIO_BASE_URL=http://localhost:5174 npm run dev` and `npm run dev:audio` (port 5174), projects Chromium + WebKit at 390×844 mobile viewport, testDir `tests/e2e`); Vite does not load `.env.example`, so the variable is set explicitly here
- [X] T005 [P] Create `netlify.toml` (build `npm run build`, publish `dist`, SPA redirect `/* → /index.html 200`, long-cache immutable headers for `/assets/*`) and `.env.example` (`VITE_AUDIO_BASE_URL=http://localhost:5174`)
- [X] T006 Add npm scripts in `package.json`: `dev`, `build`, `typecheck` (`tsc --noEmit`), `lint`, `test` (`vitest run`), `validate:catalog` (`tsx scripts/validate-catalog.ts`), `check` (typecheck + lint + test + validate:catalog), `test:e2e` (`playwright test`), `dev:audio` (`tsx scripts/serve-audio.ts` serving `tests/fixtures/audio/` on port 5174 with HTTP range support and CORS)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Content model, storage wrapper, i18n core, router shell, and base styles that every story uses

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Tests first (must FAIL before implementation)

- [X] T007 [P] Write unit tests for catalogue lookup helpers in `tests/unit/catalog.test.ts` (`getBook`, `getUnit`, `getTrack`, `getSiblings(prev/next within unit)`, `booksByLevel` preserve array order; unknown ids return `undefined`; label "12a" preserved verbatim)
- [X] T008 [P] Write catalogue schema/rules test in `tests/unit/catalog-schema.test.ts` validating `src/content/catalog.json` against `specs/001-audio-practice-site/contracts/catalog.schema.json` with Ajv, plus the `x-additional-rules` (unique ids within parent, unique track label within unit, `levelId` references an existing level); include negative fixtures (bad id pattern, `..` in file path, duplicate label)
- [X] T009 [P] Write unit tests for the safe storage wrapper in `tests/unit/safeStorage.test.ts` (get/set/remove work; when `localStorage` throws on access or write, `get` returns `null` and `set` does not throw)
- [X] T010 [P] Write unit tests for `t()` in `tests/unit/i18n-t.test.ts` (key lookup, `{name}` interpolation, missing key in non-English locale falls back to English value, missing everywhere returns the key and warns only in dev; locale discovery returns one entry per file in `src/locales/` with `code` from the file name and `nativeName` from `meta.nativeName`)

- [X] T010a [P] Write component tests in `tests/component/shell.test.tsx` for the app shell: `Layout` renders header, `<main>` and footer slots; the router resolves the five routes in `contracts/routes.md`; an unknown path renders NotFound with a translated message and a Home link (`error.notFound`, `nav.home`); after navigation, focus moves to the page `<h1>`. Must FAIL before T016a–T018.

### Implementation

- [X] T011 [P] Create typed catalogue model and pure lookup helpers in `src/content/catalog.ts` (types `Catalog/Level/Book/Unit/Track` per data-model.md; `getBook`, `getUnit`, `getTrack`, `getSiblings`, `booksByLevel`; imports `src/content/catalog.json`)
- [X] T012 [P] Create sample catalogue `src/content/catalog.json` (version 1; 2 levels; at least one textbook and one workbook with `titleTranslations`, including one 80+ character English title and a long Spanish `titleTranslations` value; one unit with tracks labelled "1", "2", "12a" pointing at `sample/…mp3` files that resolve to `tests/fixtures/audio/sample/…`, see T020a) conforming to the schema
- [X] T013 [P] Implement `src/storage/safeStorage.ts` (try/catch wrapper exposing `getItem`, `setItem`, `removeItem`; failures behave as "nothing stored")
- [X] T014 Implement i18n core in `src/i18n/index.ts` (locale auto-discovery via `import.meta.glob('../locales/*.json', { eager: true })`: `code` = file name, `nativeName` = the file's `meta.nativeName` value, so adding a language needs only a new JSON file; flat-JSON dictionaries, typed `t(key, params?)` with `{placeholder}` interpolation and English fallback, dev-only console warning on missing key) per `contracts/locale-file.md`
- [X] T015 [P] Create initial `src/locales/en.json` and `src/locales/es.json` with `meta.nativeName` (`English` / `Español`) and the `app.*`, `nav.*`, `error.*` (audioFailed, offline, notFound, retry) key groups required by `contracts/locale-file.md`
- [X] T016 Create `src/i18n/LocaleProvider.tsx` + `useLocale()` hook exposing `{lang, setLang, t}` (initially `lang` = `en`; detection/persistence is added in US2) and set `document.documentElement.lang`
- [X] T016a Create minimal shared layout `src/components/Layout.tsx` (header slot, `<main>` rendering the router `<Outlet/>`, footer slot; no switcher or credit yet) so later stories add to it instead of creating it (depends on T016, T010a)
- [X] T017 Create router shell `src/router.tsx` with the five routes from `contracts/routes.md` (`/`, `/b/:bookId`, `/b/:bookId/u/:unitId`, `/b/:bookId/u/:unitId/t/:trackId`, `*`), wired in `src/App.tsx`/`src/main.tsx` under `LocaleProvider`, with `Layout` (T016a) as the root route element so every page incl. NotFound is wrapped; page components are placeholders until their stories; include route-change focus management (focus the page `<h1>` on navigation) (depends on T010a)
- [X] T018 [P] Create `src/pages/NotFound.tsx` (translated message + link Home via `error.notFound`, `nav.home`) (depends on T010a)
- [X] T019 [P] Create mobile-first base CSS in `src/styles/base.css` (CSS variables, 360px minimum width, no horizontal overflow, `min-height: 44px` touch targets, `overflow-wrap: anywhere` for long titles, visible focus rings, `prefers-reduced-motion`) imported from `src/main.tsx`
- [X] T020 [P] Implement `scripts/validate-catalog.ts` (Ajv schema validation + `x-additional-rules` referential checks + `track.file` exists under `audio-source/`, or under `tests/fixtures/audio/` for `sample/` paths — skipped with a warning when `audio-source/` is absent) and make `npm run validate:catalog` pass (depends on T020a)
- [X] T020a [P] Add tiny sample MP3 fixtures (a few seconds each, ≤20 KB, tracks labelled "1", "2", "12a") in `tests/fixtures/audio/sample/` and implement `scripts/serve-audio.ts` (static server on port 5174 with `Accept-Ranges`/206 range responses and `Access-Control-Allow-Origin: *`); used by `npm run dev:audio`, Vitest-free e2e tests (T023, T036, T046, T054) and local development

**Checkpoint**: `npm run check` is green; T007–T010a pass; app boots to placeholder pages.

---

## Phase 3: User Story 1 - Find and play an audio file from my book (Priority: P1) 🎯 MVP

**Goal**: Home → book → unit → numbered track → audio plays, with Back navigation and shareable URLs.

**Independent Test**: With the sample catalogue at a 390×844 viewport, pick a book, unit, and track number and confirm the matching audio element has the right `src` and plays; Back returns one level.

### Tests for User Story 1 (write first; confirm FAIL)

- [X] T021 [P] [US1] Component tests for Home/Book/Unit pages in `tests/component/browse.test.tsx` (books grouped by level with title + type + cover/level label; book page lists units; unit page lists tracks by printed label incl. "12a"; unknown book/unit id renders the NotFound page (component itself is covered by T010a); Back link goes to parent path)
- [X] T022 [P] [US1] Component tests for the Player in `tests/component/player.test.tsx` (audio `src` equals `${base}/${track.file}`; play/pause toggles; shows loading state; `error` event shows translated `error.audioFailed` with Retry and a link to choose another track; changing track stops the previous audio — only one `<audio>` element exists)
- [X] T023 [P] [US1] Playwright journey in `tests/e2e/browse-play.spec.ts` (390×844: Home → book → unit → track → player visible with play control in ≤4 taps (SC-001); Back returns one level; direct link `/b/…/u/…/t/…` opens the player without autoplay)

### Implementation for User Story 1

- [X] T024 [P] [US1] Add `home.*`, `book.*`, `unit.*`, `player.*` (play, pause, loading, chooseAnother) key groups to `src/locales/en.json` and `src/locales/es.json`
- [X] T025 [P] [US1] Implement `src/components/Breadcrumb.tsx` (Back control to the parent path + printed titles; English title always shown)
- [X] T026 [P] [US1] Implement `src/components/BookCard.tsx` (printed title, type badge textbook/workbook, level, optional cover from `public/`, secondary `titleTranslations[lang]` text) 
- [X] T027 [US1] Implement `src/pages/Home.tsx` (books grouped by level using `booksByLevel`, each linking to `/b/:bookId`) (depends on T025, T026)
- [X] T028 [US1] Implement `src/pages/Book.tsx` (unit list linking to `/b/:bookId/u/:unitId`; NotFound on unknown id) (depends on T025)
- [X] T029 [US1] Implement `src/pages/Unit.tsx` (track list showing `label` verbatim, linking to the track path; NotFound on unknown id) (depends on T025)
- [X] T030 [US1] Implement `src/components/Player.tsx` with a single native `<audio preload="metadata">`, accessible play/pause button, loading indicator, error state with Retry and a `player.chooseAnother` link to the unit's track list (path passed in as a prop), state machine `idle → loading → playing ⇄ paused → ended | error` per data-model.md
- [X] T031 [US1] Implement `src/pages/Track.tsx` (resolves ids, builds audio URL from `VITE_AUDIO_BASE_URL`, renders Breadcrumb + Player, NotFound on unknown ids, no autoplay on load) (depends on T030)
- [X] T032 [US1] Wire pages into `src/router.tsx`, replacing placeholders from T017

**Checkpoint**: US1 independently functional — MVP. Run T021–T023; `npm run check` green.

---

## Phase 4: User Story 2 - Use the site in my own language (Priority: P1)

**Goal**: Spanish/English UI chosen from device language, switchable from every page, persisted; English book titles always visible.

**Independent Test**: With browser language `es` and no saved choice the UI is Spanish; switch to English, reload, English persists.

### Tests for User Story 2 (write first; confirm FAIL)

- [X] T033 [P] [US2] Unit tests for language selection in `tests/unit/i18n-detect.test.ts` (saved `pe.lang` wins if registered; else first supported primary subtag of `navigator.languages`; unsupported e.g. `fr` → `en`; invalid saved value ignored; storage throwing → detection still works)
- [X] T034 [P] [US2] Locale parity unit test in `tests/unit/locale-parity.test.ts` (every key in `en.json` exists in every discovered locale; every locale file has a non-empty `meta.nativeName`; `{placeholder}` sets match per key; fails if a component source under `src/` contains literal user-facing JSX text — simple regex check on `src/pages` and `src/components`)
- [X] T035 [P] [US2] Component test in `tests/component/language-switcher.test.tsx` (switcher present on every page, lists `nativeName`s, switching changes text immediately, keeps current route and does not remount/pause the player, writes `pe.lang`)
- [X] T036 [P] [US2] Playwright test in `tests/e2e/language.spec.ts` (browser locale `es-MX` → Spanish UI; switch to English → reload → English persists; English book titles visible in Spanish mode)

- [X] T036a [P] [US2] Component test in `tests/component/credit.test.tsx` (Credit renders on Home, Book, Unit, Track and NotFound routes via Layout, in both `en` and `es`, and includes the source credit and non-endorsement text; per FR-018; must FAIL before T041/T042)

### Implementation for User Story 2

- [X] T037 [US2] Extend `src/i18n/index.ts` with `detectLanguage()` and `isSupported()` implementing the order saved → `navigator.languages` → `en` (uses `safeStorage`, key `pe.lang`)
- [X] T038 [US2] Update `src/i18n/LocaleProvider.tsx` to initialise from `detectLanguage()`, persist on `setLang` to `pe.lang`, and update `<html lang>`
- [X] T039 [P] [US2] Add `lang.*` and `credit.*` (source, noEndorsement) key groups to `src/locales/en.json` and `src/locales/es.json`
- [X] T040 [P] [US2] Implement `src/components/LanguageSwitcher.tsx` (native `<select>` or button group labelled via `lang.*`, options from the discovered locales' `nativeName`)
- [X] T041 [P] [US2] Implement `src/components/Credit.tsx` (translated credit to *English in Action* and its publisher + non-endorsement statement; per FR-018)
- [X] T042 [US2] Extend `src/components/Layout.tsx` (created in T016a) to place `LanguageSwitcher` in the header slot and `Credit` in the footer slot, so both appear on every page (incl. NotFound) (depends on T040, T041)
- [X] T043 [US2] Ensure book/unit titles always render the printed English `title` with `titleTranslations[lang]` only as secondary text in `src/components/BookCard.tsx`, `src/pages/Book.tsx`, `src/pages/Unit.tsx` (FR-017)

**Checkpoint**: US1 + US2 both work independently; parity test green.

---

## Phase 5: User Story 3 - Continue where I left off (Priority: P2)

**Goal**: A one-tap Continue card on Home that opens the last track at 0:00; stale progress is ignored silently.

**Independent Test**: Open a track, reload Home, see Continue naming book/unit/track; tap → track page, player at 0:00.

### Tests for User Story 3 (write first; confirm FAIL)

- [X] T044 [P] [US3] Unit tests in `tests/unit/progress.test.ts` (save then load round-trips `{v:1,bookId,unitId,trackId}`; later save overwrites; invalid JSON, wrong `v`, unknown ids, or storage throwing ⇒ `null` with no throw; no playback position is ever written)
- [X] T045 [P] [US3] Component test in `tests/component/continue-card.test.tsx` (card hidden when no/stale progress; shown with book, unit, track label when valid; links to the saved track path; opening a track page records progress; pressing play in the Player writes `pe.progress`)
- [X] T046 [P] [US3] Playwright test in `tests/e2e/continue.spec.ts` (play a track, reload `/`, Continue card → tap → same track at 0:00; first visit shows no Continue; stale progress in localStorage shows no card and no error; storage blocked → app still works)

### Implementation for User Story 3

- [X] T047 [US3] Implement `src/storage/progress.ts` (`saveProgress`, `loadProgress(catalog)` validating version and ids against the catalogue, key `pe.progress`, via `safeStorage`) per `contracts/local-storage.md`
- [X] T048 [P] [US3] Add `continue.*` key group (title with `{track}` placeholder, book/unit/track descriptors) to `src/locales/en.json` and `src/locales/es.json`
- [X] T049 [US3] Implement `src/components/ContinueCard.tsx` (prominent card showing book title, unit, track label; links to the saved track path)
- [X] T050 [US3] Show `ContinueCard` at the top of `src/pages/Home.tsx` when `loadProgress` returns a value
- [X] T051 [US3] Record progress in `src/pages/Track.tsx` when the track page opens (covers direct links) and when play is pressed in `src/components/Player.tsx`

**Checkpoint**: US1–US3 independently functional.

---

## Phase 6: User Story 4 - Comfortable listening on mobile and desktop (Priority: P2)

**Goal**: Replay, previous/next within a unit, 0.75×/1× speed, stop-at-end, offline/loading messaging, responsive and keyboard-operable layout.

**Independent Test**: At 360px and 1280px no horizontal scroll; track end shows Replay/Next without auto-advancing; speed resets to 1× on a new track.

### Tests for User Story 4 (write first; confirm FAIL)

- [X] T052 [P] [US4] Component tests in `tests/component/player-controls.test.tsx` (Replay restarts at 0:00; Previous/Next link to sibling tracks and are disabled/hidden at unit edges; on `ended` playback stops, no navigation occurs, Replay and Next visible; speed toggle sets `playbackRate` 0.75/1 and resets to 1 when the track changes; speed not persisted)
- [X] T053 [P] [US4] Component test in `tests/component/offline.test.tsx` (`offline` event shows translated `error.offline` notice; `online` event hides it; audio error while offline shows offline message)
- [X] T054 [P] [US4] Playwright responsive/keyboard test in `tests/e2e/responsive.spec.ts` (no horizontal scroll via `scrollWidth <= clientWidth` at 360×740 and 1280×800 on every route; full journey operable using only keyboard, and after each navigation step (Home → Book → Unit → Track, and Back) `document.activeElement` is the page `<h1>`; touch targets ≥ 44px for player buttons)

### Implementation for User Story 4

- [X] T055 [P] [US4] Add remaining `player.*` keys (replay, next, previous, speed, speedNormal, speedSlow) to `src/locales/en.json` and `src/locales/es.json`
- [X] T056 [US4] Extend `src/components/Player.tsx`: Replay button, `ended` → stop (no auto-advance) with Replay and Next prominent, speed toggle (0.75×/1×, resets to 1× on track change, not persisted), accessible labels (depends on T030)
- [X] T057 [US4] Add Previous/Next navigation using `getSiblings` in `src/pages/Track.tsx` and pass links to `Player` (navigating stops the current audio)
- [X] T058 [P] [US4] Implement `src/components/OfflineNotice.tsx` using `online`/`offline` events (`navigator.onLine`) and mount it in `src/components/Layout.tsx` (created in T016a)
- (T059 removed: Media Session API deferred; not in spec; IDs are not renumbered)
- [X] T060 [US4] Add responsive CSS in `src/styles/` (single column at ≤ 600px; centered max-width column and larger tap grid on desktop; player controls ≥ 44px; long/translated titles wrap without hiding controls)

**Checkpoint**: All four stories functional and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T061 [P] Create `firebase/firebase.json` (public `../audio-source`, long `Cache-Control: public, max-age=31536000, immutable`, `Accept-Ranges` default) and `firebase/.firebaserc` placeholder; add `scripts/deploy-audio.sh` (`firebase deploy --only hosting --config firebase/firebase.json`) per research D2
- [ ] T062 [P] Write `README.md` (what it is, `npm run check`, local audio via `audio-source/` + `VITE_AUDIO_BASE_URL`, Netlify + Firebase deploy steps, adding a language (add one `src/locales/<code>.json` file, including `meta.nativeName`; no code changes), adding content, takedown procedure from research D11, incidental server-log privacy note, legal/endorsement note)
- [ ] T063 [P] Add `public/favicon.svg` and, if covers are used, optimized cover images in `public/covers/`
- [ ] T064 Measure bundle size (`npm run build`) and keep initial JS ≈ ≤100 KB gzip (SC-005 / plan); lazy-load nothing unless over budget
- [ ] T065 Run the full quickstart.md validation scenarios 1–5 manually at 390px, 360px and 1280px, then `npm run check` and `npm run test:e2e`; fix any failures
- [ ] T066 [P] Accessibility pass: heading order, labelled controls, focus moves to `<h1>` on route change, `lang` attribute updates on language switch, contrast of focus rings and badges
- [ ] T067a **OWNER ACTION** Gather the real audio into `audio-source/` using only files the publisher makes freely and publicly downloadable (no circumvention of any access control), and record every file in `docs/SOURCES.md` (one row per file: path under `audio-source/`, publisher page URL, date retrieved); `docs/SOURCES.md` is committed to git, the audio is not. Also sum the size of `audio-source/` and record it in `docs/SOURCES.md`; if it exceeds about 8 GB, plan the Blaze/R2 move (research D2) before deploying
- [ ] T067b Author the real catalogue in `src/content/catalog.json` from the contents of `audio-source/` (levels → books → units → tracks, track `label` verbatim as printed, `titleTranslations` where known), replacing the sample content; run `npm run validate:catalog` (depends on T067a)
- [ ] T067c Source-verification gate: first add a failing test case to `tests/unit/catalog-schema.test.ts` (or a new `tests/unit/sources.test.ts`), then extend `scripts/validate-catalog.ts` so every `track.file` outside `sample/` has a matching row in `docs/SOURCES.md` and validation fails otherwise; supports the constitution rule against hosting content that is not freely and publicly available (depends on T020; must be green before T067b is considered done)
- [ ] T068 [P] Write step-by-step first-deploy instructions in `docs/DEPLOY.md` (linked from `README.md`) for the owner, assuming no prior Netlify/Firebase experience: create the Netlify site from the repo and attach `practiceenglish.net`; create the Firebase project and Hosting site (Spark plan), install/login `firebase-tools`, set `firebase/.firebaserc`; attach `audio.practiceenglish.net` with the exact DNS records to add at the registrar; run `scripts/deploy-audio.sh`; set `VITE_AUDIO_BASE_URL=https://audio.practiceenglish.net` in Netlify env vars; verification steps (HTTPS valid on both hosts, `curl -I -H "Range: bytes=0-99"` on an audio URL returns 206, a track plays from the live site); and how to roll back or take a file down (research D11)
- [ ] T069 **OWNER ACTION** Follow `docs/DEPLOY.md` (T068) to perform the first deploy and domain/DNS setup; report any step that fails so the instructions can be corrected; then verify SC-004/SC-005 on the deployed site in Chrome DevTools with network throttling set to "Fast 3G" and cache disabled: the home screen shows selectable books within 3 s, and audio is playing within 3 s of tapping play; record the measured times in the README (depends on T068, T064, T067b)

---

## Dependencies & Execution Order

### Phase dependencies

- **Phase 1 Setup**: T001 first (git before everything), then T002 → T003 → T006; T004/T005 [P] after T002.
- **Phase 2 Foundational**: after Setup; blocks all stories. Tests T007–T010a are written first; T011–T020 follow (T014 before T015/T016; T016 before T016a; T016a before T017).
- **US1 (P1)**, **US2 (P1)**, **US3 (P2)**, **US4 (P2)**: all start after Phase 2.
- **Polish**: after the desired stories.

### Story dependencies

- **US1**: no dependency on other stories (MVP).
- **US2**: independent; touches shared files `src/components/BookCard.tsx`, `Book.tsx`, `Unit.tsx`, `router.tsx`, locale JSON — sequence after US1 if one person implements, or coordinate edits.
- **US3**: needs the Track page and Home from US1 (T031, T027); otherwise independent.
- **US4**: extends the Player and Track page from US1 (T030, T031).
- Locale JSON files are touched by every story: edit sequentially (no [P] across stories on `en.json`/`es.json`).

### Within each story

Tests first and observed failing → components/storage → pages → wiring.

### Parallel opportunities

- Setup: T004, T005.
- Foundational tests T007–T010a together; then T011, T012, T013, T015, T018, T019, T020 together.
- US1: T021–T023 together; T025, T026 (and T024) together.
- US2: T033–T036 together; T040, T041 (and T039) together.
- US3: T044–T046 together.
- US4: T052–T054 together; T055 and T058 together.
- Polish: T061, T062, T063, T066.

---

## Parallel Example: User Story 1

```bash
# Tests together:
Task: "Component tests for Home/Book/Unit pages in tests/component/browse.test.tsx"
Task: "Component tests for the Player in tests/component/player.test.tsx"
Task: "Playwright journey in tests/e2e/browse-play.spec.ts"

# Independent components together:
Task: "Implement src/components/Breadcrumb.tsx"
Task: "Implement src/components/BookCard.tsx"
```

---

## Implementation Strategy

### MVP first (US1 only)

1. Phase 1 Setup (git first) → Phase 2 Foundational → Phase 3 US1.
2. **Stop and validate**: run T021–T023 and quickstart scenario 1 at 390px.
3. Deploy to Netlify with sample audio on Firebase if ready.

### Incremental delivery

1. Foundation → US1 (MVP) → US2 (Spanish; required for the target audience, so ship before wide release) → US3 (Continue) → US4 (comfort features) → Polish.
2. Each story adds value without breaking previous ones; run `npm run check` after each.

### Notes

- Commit after each task or logical group on branch `001-audio-practice-site`.
- Verify each test fails before implementing.
- Real audio files never enter git or the Netlify bundle (`audio-source/` is git-ignored); only the tiny sample fixtures in `tests/fixtures/audio/` are committed.
