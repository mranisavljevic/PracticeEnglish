---

description: "Task list for Anonymous Usage Analytics"
---

# Tasks: Anonymous Usage Analytics

**Input**: Design documents from `/specs/003-anonymous-usage-analytics/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/collector-api.md, contracts/client-contract.md, quickstart.md

**Tests**: Included. The project constitution (Principle IV, Test-First) and plan.md require failing tests before each module. Write each test task first and confirm it fails before the implementation task that follows it.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested on its own.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story the task belongs to (US1–US5)
- Paths are relative to the repository root (`/Users/mranisavljevic/Dev/PracticeEnglish`)

## Path Conventions

Single project: client in `src/`, serverless collector in `netlify/functions/`, tests in `tests/{unit,component,e2e}/`. Before creating a test file, check the existing files in those directories and match their naming and setup.

---

## Phase 1: Setup

**Purpose**: Dependencies and config shared by every story.

- [ ] T001 Add `@netlify/blobs` as a dependency in `package.json` (server-only; imported only from `netlify/functions/`) and run `npm install`
- [ ] T002 [P] Add an `npm run report` script to `package.json` that runs `scripts/analytics-report.ts` (use the same TS runner as the other scripts in `scripts/`)
- [ ] T003 [P] Update `netlify.toml`: set `[functions] directory = "netlify/functions"`, add redirects `/api/e` → `/.netlify/functions/collect` and `/api/report` → `/.netlify/functions/report` (status 200), placed before any SPA catch-all redirect
- [ ] T004 [P] Add `netlify/functions` and `scripts/analytics-report.ts` to the `include` list of `tsconfig.json` (or a separate tsconfig that `npm run check` also type-checks) so the functions are covered by strict `tsc`
- [ ] T005 [P] Document the env vars `VITE_ANALYTICS_ENDPOINT` (Production context only, value `/api/e`) and `ANALYTICS_REPORT_TOKEN` (function env) in `docs/DEPLOY.md`; also note there that Dev, tests and previews must leave the endpoint unset (FR-011) and that Netlify's own request logs are outside the app's collection and not covered by the privacy note

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The shared vocabulary, privacy gate, sender and collector that every story's events go through.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

### Tests (write first, confirm they fail)

- [ ] T006 [P] Unit test for the schema in `tests/unit/analytics-schema.test.ts`: `validateEvent` accepts the valid examples from `contracts/collector-api.md`; rejects unknown fields (e.g. `ua`), missing or forbidden `label`/ids per the presence rules in `data-model.md`, bad id patterns (`^[a-z0-9-]{1,40}$`), unknown enums, and bodies over 1 KB; `encodeKey`/`decodeKey` round-trip including `-` for unused slots and the `YYYY-MM-DD/…/uuid` shape
- [ ] T007 [P] Unit test in `tests/unit/analytics-events.test.ts`: `detectDevice` returns `mobile` for iPhone/Android/iPad/iPod UA strings and `desktop` for desktop, empty, undefined and unrecognised UAs; `trackingAllowed` is false when the endpoint is unset or empty (the default for dev, tests and previews, FR-011), when `doNotTrack === '1'` (navigator or window), or when `globalPrivacyControl === true`, and true otherwise
- [ ] T008 [P] Unit test in `tests/unit/analytics-track.test.ts`: `track` is a no-op when tracking is not allowed; sends via `navigator.sendBeacon` with a `text/plain` Blob containing exactly `type`, `lang`, `device` and any label/ids (no UA, no timestamp); falls back to `fetch` with `keepalive: true` when `sendBeacon` is missing or returns false; never throws when sending throws; `track` returns synchronously (not a promise, never awaits the send) so it cannot delay playback (supports SC-004); `trackOncePerSession` sends once per key, stores flags in `sessionStorage`, and falls back to an in-memory set when `sessionStorage` throws
- [ ] T009 [P] Unit test in `tests/unit/analytics-collect.test.ts`: the `collect` handler returns 204 and writes one empty blob with the encoded key for valid events (blob store mocked); 400 and nothing stored for invalid events; 405 for non-POST; sets `Cache-Control: no-store`; never reads `user-agent`, `x-forwarded-for` or `client-ip` headers (assert via a request whose headers object throws or records on those names)

### Implementation

- [ ] T010 Create `netlify/functions/lib/schema.ts`: exported const vocabularies (event types, device classes, track sources, error types, book types), the `UsageEvent` type, `validateEvent(unknown): UsageEvent | null` implementing the allowlist and presence rules from `data-model.md`, and `encodeKey(event, date, uuid)` / `decodeKey(key)` for the blob key format (makes T006 pass)
- [ ] T011 Create `src/analytics/events.ts`: `import type` the vocabularies from `netlify/functions/lib/schema.ts` (types only, so no server code ships to the browser), plus `detectDevice(userAgent)` and `trackingAllowed(env, nav)` per `contracts/client-contract.md` (makes T007 pass)
- [ ] T012 Create `src/analytics/track.ts`: `track(event, lang)` and `trackOncePerSession(key, event, lang)` per `contracts/client-contract.md`. Read `import.meta.env.VITE_ANALYTICS_ENDPOINT`, compute the device class once (cached), send with `sendBeacon` falling back to `fetch` keepalive, wrap everything in try/catch (makes T008 pass)
- [ ] T013 Create `src/analytics/source.ts`: `TrackSource` re-export, `withSource(source)` returning the router `state` object `{ source }`, and `readSource(location.state): TrackSource` returning `navigation` when state is absent or not a valid source; plus `clearSource(navigate, location)` that calls `navigate(location, { replace: true, state: null })` so a reload or back/forward to the same history entry does not re-read `scan`/`resume`/`next` (FR-002)
- [ ] T014 Create `netlify/functions/collect.ts`: POST-only handler that reads the body (reject > 1 KB), parses JSON, calls `validateEvent`, writes an empty blob to store `analytics` under `encodeKey(event, today's UTC date, crypto.randomUUID())`, responds 204 / 400 / 405 with `Cache-Control: no-store`, and reads no headers (makes T009 pass)
- [ ] T015 Create `src/analytics/AnalyticsProvider.tsx` with the `useAnalytics()` hook from `contracts/client-contract.md` (`trackStarted`, `resumeUsed`, `languageChanged`, `playbackFailure`, `scanFailure`), each bound to the currently displayed language from the existing locale context in `src/i18n/LocaleProvider.tsx`; mount it inside `LocaleProvider` in the app root (`src/main.tsx` or `src/App.tsx`, wherever `LocaleProvider` is mounted). The provider sends nothing yet; events are added per story below

**Checkpoint**: `npm run check` passes; the collector accepts and stores valid events locally. User stories can start.

---

## Phase 3: User Story 1 - Visitors, language and device (Priority: P1) 🎯 MVP

**Goal**: The owner can read visits by language and device class, and learners see the privacy note.

**Independent Test**: Open the app at 390×844 in one language and at desktop size in another; the report shows two visits with the right language/device class; reloads don't add visits; changing language records `language_changed`.

### Tests for User Story 1 (write first, confirm they fail)

- [ ] T016 [P] [US1] Component test in `tests/component/analytics-visit.test.tsx`: mounting `AnalyticsProvider` sends exactly one `visit` event with the displayed language and device class; remounting in the same tab session (sessionStorage flag set) sends none; with the gate closed (DNT, GPC, or no endpoint) sends none; a changed language yields `language_changed` with the new language via `LocaleProvider.setLang`, and re-selecting the current language sends nothing; when the stored or browser language is unsupported and the app falls back, events carry the language actually displayed
- [ ] T017 [P] [US1] Unit test in `tests/unit/analytics-report.test.ts`: the `report` handler returns 401 without the correct Bearer token, 400 for `to` < `from`, bad dates, or a range over 366 days; with mocked blob keys across several days it returns the JSON shape from `data-model.md` (visits total/byLang/byDevice/byLangDevice, trackStarts, resumeUsed, languageChanges, errors) and counts only keys within the range
- [ ] T018 [P] [US1] Locale parity: confirm the existing locale parity test (find it under `tests/unit/` or `tests/component/`) fails once `analytics.privacy` is added to `en.json` only; add a component test in `tests/component/analytics-privacy.test.tsx` asserting the footer renders the translated `analytics.privacy` text in EN and ES and that it is found via an accessibility-tree query (e.g. `getByText`, not `aria-hidden`), supporting FR-013

### Implementation for User Story 1

- [ ] T019 [US1] In `src/analytics/AnalyticsProvider.tsx`, on mount call `trackOncePerSession('visit', { type: 'visit' }, lang)` (makes the visit part of T016 pass)
- [ ] T020 [US1] In `src/i18n/LocaleProvider.tsx`, in `setLang`, when a supported language different from the current one is chosen, call the analytics `languageChanged(newLang)` with the new language (makes the language part of T016 pass). `LocaleProvider` wraps `AnalyticsProvider` (T015), so call `track()` from `src/analytics/track.ts` directly instead of the `useAnalytics` hook to avoid a circular dependency
- [ ] T021 [P] [US1] Add `analytics.privacy` first to `src/locales/en.json` only and confirm the parity test (T018) fails, then to `src/locales/es.json` (EN text from `research.md` D8; write an accurate Spanish translation) and to any other locale files present
- [ ] T022 [US1] (after T021) Render the privacy note in the footer next to the existing credit (find the `Credit` component usage in `src/components/Layout.tsx`), as plain text using the existing translation hook (makes T018 pass)
- [ ] T023 [US1] Create `netlify/functions/report.ts`: GET handler checking `Authorization: Bearer $ANALYTICS_REPORT_TOKEN` (constant-time compare), validating `from`/`to`, listing blob keys for each day prefix in range, decoding with `decodeKey` and aggregating into the Report shape from `data-model.md` (all sections, so later stories need no changes here) (makes T017 pass)
- [ ] T024 [P] [US1] Create `scripts/analytics-report.ts`: parse `--from`, `--to`, `--url` (default `https://practiceenglish.net`), read `ANALYTICS_REPORT_TOKEN` from env, fetch `/api/report`, print tables for visits (language × device), track-start sources, resume uses, language changes, errors by type, and top tracks; exit non-zero with a clear message on 401/400

**Checkpoint**: Story 1 works alone: visits and language changes are recorded, the privacy note shows, and `npm run report` prints them.

---

## Phase 4: User Story 2 - Scan vs. navigate (Priority: P2)

**Goal**: A `track_started` event is recorded when audio actually begins playing, labelled `scan`, `navigation` or `resume`, with level/book type/unit/track.

**Independent Test**: Start one track via scan and one via the lists; the report shows one `scan` and one `navigation` start (and a `resume` start via the Continue card). A track that fails to load records no start.

### Tests for User Story 2 (write first, confirm they fail)

- [ ] T025 [P] [US2] Unit test in `tests/unit/analytics-source.test.ts`: `readSource` returns the source for each valid label and `navigation` for missing, null or invalid state
- [ ] T026 [P] [US2] Component test in `tests/component/analytics-track-started.test.tsx` (render `Player` with a mocked audio element): pressing Play records no event until the audio `playing` event fires, then exactly one `track_started` with the `source` prop and the `ids`; repeated `playing` events don't resend; pause then resume sends nothing; an audio `error` before `playing` sends no `track_started`
- [ ] T027 [P] [US2] Component tests for source hand-off: scanning and pressing Open in `ScanOverlay` navigates with `state.source === 'scan'`; `ContinueCard` link has `state.source === 'resume'`; `Track` page passes `readSource(location.state)` and catalog ids (`book.levelId`, `book.type`, `unit.id`, `track.id`) to `Player`; after the `Track` page mounts with `state.source === 'scan'`, the history entry's state is cleared, and remounting it (simulated reload) yields source `navigation`. Put them in `tests/component/analytics-source-handoff.test.tsx`

### Implementation for User Story 2

- [ ] T028 [US2] In `src/components/Player.tsx`, add optional props `source: TrackSource` and `ids: { level, bookType, unit, track }`. Add a pending-start flag set on the first Play from idle (source = the prop); on the audio `playing` event, if pending, call `trackStarted(source, ids)` and clear the flag (makes T026 pass; `research.md` D4). Add a code comment that `Player` must not autoplay: the pending-start flag assumes playback begins only after a learner Play/Replay action, so adding autoplay requires revisiting this logic
- [ ] T029 [US2] In `src/pages/Track.tsx`, read `readSource(useLocation().state)` and pass `source` and `ids` (from the catalog objects it already resolves) to `Player`. Capture the source once per mount (`useRef`/`useState`), then call `clearSource` from T013 so a reload or back/forward to this entry is read as `navigation` rather than repeating `scan`/`resume`/`next` (FR-002)
- [ ] T030 [P] [US2] In `src/components/ScanOverlay.tsx`, make `open` call `navigate(path, { state: withSource('scan') })`
- [ ] T031 [P] [US2] In `src/components/ContinueCard.tsx`, set `state={withSource('resume')}` on the link (the `resume_used` event is added in US4)

**Checkpoint**: Scan, list-pick and resume arrivals each record one correctly labelled `track_started`; Stories 1 and 2 both work.

---

## Phase 5: User Story 3 - Repeat / next / list picks (Priority: P3)

**Goal**: Continuing practice is distinguishable: `repeat`, `next`, and `navigation` for later list picks.

**Independent Test**: Play a track, press Replay, press Next, then pick another track from a list; the report shows starts with sources `repeat`, `next`, `navigation` plus the initial one.

### Tests for User Story 3 (write first, confirm they fail)

- [ ] T032 [P] [US3] Extend `tests/component/analytics-track-started.test.tsx`: Replay sets a pending start with source `repeat` and the next `playing` sends one `track_started` labelled `repeat`; Play after the track has ended is also `repeat`; two rapid Replay taps before `playing` still send one event; the Next link renders with `state.source === 'next'`
- [ ] T033 [P] [US3] Playwright test in `tests/e2e/analytics.spec.ts` (390×844, collector intercepted with `page.route('**/api/e')` collecting bodies; set the endpoint env for the test build/dev server as the other e2e specs configure env): play → Replay → Next → pick a different track from the list; assert the captured `track_started` labels in order are `navigation`, `repeat`, `next`, `navigation`

### Implementation for User Story 3

- [ ] T034 [US3] In `src/components/Player.tsx`, make Replay and Play-after-ended set the pending start with source `repeat` (overriding the arrival source for that start); keep pause→resume from setting it (makes T032 pass)
- [ ] T035 [US3] In `src/components/Player.tsx`, render the Next link with `state={withSource('next')}`; when the new track mounts, `Track` reads it through the existing `readSource` path from T029 (makes T033's `next` assertion pass)

**Checkpoint**: All five track-start sources are recorded.

---

## Phase 6: User Story 4 - "Continue where I left off" usage (Priority: P3)

**Goal**: A `resume_used` event is recorded when, and only when, the Continue card is activated.

**Independent Test**: Activate the Continue card once and see one `resume_used`; load the home screen without activating it and see none.

### Tests for User Story 4 (write first, confirm they fail)

- [ ] T036 [P] [US4] Component test in `tests/component/analytics-resume.test.tsx`: rendering `ContinueCard` sends nothing; clicking its link sends exactly one `resume_used`; with the gate closed it sends nothing and navigation still works

### Implementation for User Story 4

- [ ] T037 [US4] In `src/components/ContinueCard.tsx`, call `resumeUsed()` from `useAnalytics()` in the link's `onClick` without calling `preventDefault` or delaying navigation (makes T036 pass)

**Checkpoint**: Resume adoption is measurable.

---

## Phase 7: User Story 5 - Errors (Priority: P2)

**Goal**: `error` events with type `playback-failure`, `scan-failure` or `unexpected`, deduplicated per tab session, with no messages or stack traces.

**Independent Test**: Trigger a playback failure, a scan failure and an uncaught error; the report shows one of each type, playback failure carries the track ids, and repeated identical failures add no further events.

### Tests for User Story 5 (write first, confirm they fail)

- [ ] T038 [P] [US5] Component test in `tests/component/analytics-errors.test.tsx`: an audio `error` event or a `play()` rejection (not `AbortError`) sends one `error/playback-failure` with the four ids and no `track_started`; an `AbortError` sends nothing; a second identical failure in the same session sends nothing; `ScanOverlay` sends `error/scan-failure` when scanner state becomes `error` or `notFound`, deduped; dispatching `window` `error` and `unhandledrejection` events sends `error/unexpected` once, and the payload contains only the type label (assert the message text is absent)
- [ ] T039 [P] [US5] Playwright test in `tests/e2e/analytics.spec.ts`: add a scripted full journey (visit, language change, scan or list pick, repeat, next, resume, a failing track via `page.route` aborting its audio file) and assert the captured events equal the expected list exactly, with no extras (SC-002); add a second test with `/api/e` aborted and the existing journeys still passing (SC-005); add a third with `Do Not Track` set (`navigator.doNotTrack = '1'` via `addInitScript`) asserting zero requests to `/api/e`

### Implementation for User Story 5

- [ ] T040 [US5] In `src/components/Player.tsx`, on the audio `error` event and on non-`AbortError` `play()` rejections, clear the pending start and call `playbackFailure(ids)` (deduped by `type|level/unit/track` via `trackOncePerSession`) (makes the playback part of T038 pass)
- [ ] T041 [P] [US5] In `src/components/ScanOverlay.tsx`, when the scanner state (from `src/scan/useScanner.ts`) transitions to `error` or `notFound`, call `scanFailure()` once per transition, deduped by type. Expose the state from `useScanner` only if it isn't already available to the overlay
- [ ] T042 [US5] In `src/analytics/AnalyticsProvider.tsx`, install `window` `error` and `unhandledrejection` listeners that send `error/unexpected` through `trackOncePerSession` without reading the event payload, and remove them on unmount

**Checkpoint**: Failures are visible to the owner; all five stories work.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T043 [P] Privacy review (SC-006): capture a real request body and listed blob key from the local run in `quickstart.md` §2, and confirm only fields from `contracts/collector-api.md` appear; note the result in the PR description
- [ ] T044 [P] Timing check (SC-004; automated guard is the synchronous-`track` assertion in T008): measure time-to-first-playback with analytics enabled vs. unset on a mobile profile and confirm the added time is ≤ 50 ms
- [ ] T045 [P] Update `README.md` with a short "Analytics" section pointing to `docs/DEPLOY.md` and `npm run report`
- [ ] T046 Run `npm run check` and `npm run test:e2e`, fix any failures, then walk through `specs/003-anonymous-usage-analytics/quickstart.md` sections 1–2 and tick off every item

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies; start immediately.
- **Foundational (Phase 2)**: depends on Setup; blocks all stories.
- **User Stories (Phases 3–7)**: all depend on Foundational. They can proceed in parallel by file where noted, or in order US1 → US2 → US5 → US3 → US4 (priority order puts US5 at P2 alongside US2).
- **Polish (Phase 8)**: after the stories you intend to ship.

### User Story Dependencies

- **US1 (P1)**: only Foundational. It is the MVP. It also builds the report (T023, T024), which every other story's verification uses.
- **US2 (P2)**: only Foundational. Adds the `Player` pending-start mechanism and the `source`/`ids` props.
- **US5 (P2)**: only Foundational, but T040 edits `Player.tsx` after T028 (same file; do US2 first or sequence them) and T041 edits `ScanOverlay.tsx` after T030.
- **US3 (P3)**: builds on US2 (T034/T035 extend T028 in `Player.tsx`; T032 extends the T026 test file).
- **US4 (P3)**: builds on T031 (same file, `ContinueCard.tsx`).

### Within Each Story

- Tests first and failing, then implementation; models/vocabulary → client module → call sites.
- Tasks touching the same file (`Player.tsx`: T028, T034, T035, T040; `ScanOverlay.tsx`: T030, T041; `ContinueCard.tsx`: T031, T037; `AnalyticsProvider.tsx`: T015, T019, T042; `tests/e2e/analytics.spec.ts`: T033, T039) must run sequentially.

### Parallel Opportunities

- Setup: T002–T005 together.
- Foundational tests T006–T009 together; then T010 and T014 are sequential (T014 imports the schema), while T011 (after T010), T012 (after T011) and T013 can be split across people.
- US1: T016–T018 together; T021 and T024 are independent of the rest.
- US2: T025–T027 together; T030 and T031 together.
- US3–US5 test tasks (`[P]`) can all be written in parallel once Foundational is done.

### Parallel Example: User Story 1

```text
Task: "Component test in tests/component/analytics-visit.test.tsx"      (T016)
Task: "Unit test in tests/unit/analytics-report.test.ts"                 (T017)
Task: "Privacy note test in tests/component/analytics-privacy.test.tsx"  (T018)
Task: "Add analytics.privacy to src/locales/en.json and es.json"         (T021)
Task: "Create scripts/analytics-report.ts"                               (T024)
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 (Setup) and Phase 2 (Foundational).
2. Complete Phase 3 (US1): visits, language, device class, privacy note, report.
3. **Stop and validate**: run `quickstart.md` §2 steps 1 and 4, and verify with `npm run report`.
4. Deploy with `VITE_ANALYTICS_ENDPOINT` and `ANALYTICS_REPORT_TOKEN` set in Production only.

### Incremental Delivery

1. Setup + Foundational → collector ready.
2. + US1 → audience, language and device visibility (MVP).
3. + US2 → scan vs. navigate vs. resume starts.
4. + US5 → error visibility.
5. + US3 → repeat/next detail.
6. + US4 → explicit resume usage.
7. Polish: privacy review, timing check, docs.

## Notes

- `[P]` means different files with no dependency on unfinished tasks.
- Never read or store IP, user-agent or timestamps beyond the server-set UTC day (FR-007); the client sends the device class only, never the UA.
- Dev, tests and deploy previews leave `VITE_ANALYTICS_ENDPOINT` unset, so they send nothing (FR-011). E2E specs set it only for tests that intercept `/api/e`.
- Commit after each task or logical group; stop at any checkpoint to validate that story on its own.
