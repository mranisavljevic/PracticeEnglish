# Tasks: Google Analytics Migration

**Input**: Design documents from `/specs/005-google-analytics-migration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/client-contract.md, contracts/ga-event-contract.md, quickstart.md

**Tests**: Included. Constitution Principle IV (Test-First) and plan.md require failing tests before each module. Write each test task first, confirm it fails, then implement.

**Organization**: Grouped by user story. Order of delivery: US1 → US2 → US3 → US4 (removal is last, after GA is verified, per research D9).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US4 map to spec.md user stories

## Path Conventions

Single project: `src/`, `tests/`, `netlify/`, `scripts/` at repo root.

---

## Phase 1: Setup

**Purpose**: Governance and configuration that everything else relies on.

- [X] T001 Amend `.specify/memory/constitution.md` to v2.1.0: replace the "MUST NOT collect personal data" bullet with the Google Analytics allowance (opt-in consent, DNT/GPC honoured, no advertising features or user-level identifiers, no free text, minimal retention); update the Sync Impact Report and version line (FR-013, research D7). Set Last Amended to the date of the change, and add to the Sync Impact Report the impact on existing specs (spec 003 FR-007 is superseded; 003's no-persistent-identifier wording no longer applies). Version bump 2.0.0 → 2.1.0 (MINOR: materially expanded guidance). State retention as "2-month data retention".
- [X] T002 [P] Declare `VITE_GA_MEASUREMENT_ID` and `VITE_CONSENT_PROMPT` on `ImportMetaEnv` (and remove `VITE_ANALYTICS_ENDPOINT`) in the project's Vite env declaration file (`src/vite-env.d.ts`, or wherever `ImportMetaEnv` is declared), and add a `gtag`/`dataLayer` `Window` augmentation in `src/analytics/ga.d.ts`.

---

## Phase 2: Foundational (blocking prerequisites)

**Purpose**: Vocabulary, consent state, GA loader, and the test helper. No user story can start until these exist.

### Tests first

- [X] T003 [P] Update `tests/unit/analytics-events.test.ts`: `privacySignalPresent` (DNT `'1'` on navigator/window, GPC `true`), and `trackingAllowed(env, nav, win, consent)` false without `VITE_GA_MEASUREMENT_ID`, with a privacy signal, or unless consent is `granted`; invalid IDs (not `^G-[A-Z0-9]+$`) are off; import types from `src/analytics/events.ts`.
- [X] T004 [P] Create `tests/unit/analytics-consent.test.ts`: `getConsent` returns unset/granted/declined; `VITE_CONSENT_PROMPT=off` ⇒ granted; blocked `localStorage` falls back to memory without throwing; `setConsent` persists and notifies `subscribe` listeners; declining deletes `_ga*` cookies; `promptVisible` true only when unset, prompt on, no privacy signal.
- [X] T005 [P] Create `tests/unit/analytics-ga.test.ts`: `ensureGa(id)` defines `dataLayer`/`gtag`, issues `config` with `send_page_view:false`, `allow_google_signals:false`, `allow_ad_personalization_signals:false`, `cookie_expires:5184000`, appends the `googletagmanager.com/gtag/js?id=` script exactly once; `sendEvent` maps each `UsageEvent` to the params in `contracts/ga-event-contract.md` (`app`, `ui_lang`, `device_class`, `source`, `error_type`, `level`, `book_type`, `unit`, `track`), never sends `user_id`, free text or UA, and never throws.

### Implementation

- [X] T006 Move the vocabulary types (`EventType`, `TrackSource`, `ErrorType`, `DeviceClass`, `BookType`, `UsageEvent`) from `netlify/functions/lib/schema.ts` into `src/analytics/events.ts` (define them there; do not delete the schema file yet), update every import of `netlify/functions/lib/schema` in `src/` and `tests/` to `src/analytics/events`, add `privacySignalPresent(nav, win)` and the new `trackingAllowed(env, nav, win, consent)` (drop `VITE_ANALYTICS_ENDPOINT`). Makes T003 pass.
- [X] T007 [P] Create `src/analytics/consent.ts` per `contracts/client-contract.md` (`getConsent`, `setConsent`, `subscribe`, `promptVisible`; `localStorage['pe.consent']`; memory fallback; `_ga*` cookie cleanup on decline). Makes T004 pass.
- [X] T008 [P] Create `src/analytics/ga.ts` with `ensureGa(id)` and `sendEvent(event)` per the client and event contracts. Makes T005 pass.
- [X] T009 Rewrite `tests/helpers/analytics.ts` and, in the same task, update the existing component tests that import it (`analytics-track-started`, `analytics-source-handoff`, `analytics-resume`, `analytics-errors`) so they compile and run against the stub (T016–T018 add the new assertions): `captureEvents()` stubs `VITE_GA_MEASUREMENT_ID` (e.g. `G-TEST123`), sets consent granted, stubs `window.gtag` as a recording `vi.fn`, and returns the `('event', name, params)` calls as events; `restoreEvents()` clears env, storage, `dataLayer`, `gtag`, privacy-signal properties and injected GA `<script>` tags.

**Checkpoint**: Foundation ready; new unit tests (T003–T005) pass.

---

## Phase 3: User Story 1 - See PracticeEnglish alongside my other apps (Priority: P1) 🎯 MVP

**Goal**: A visit from a consenting learner is delivered to GA4 with `app`, `ui_lang`, `device_class`, once per tab session.

**Independent Test**: With a measurement ID and consent granted, loading the app issues one `visit` event with the common params; reload in the same tab sends no second visit; no ID ⇒ no script.

### Tests first

- [X] T010 [P] [US1] Update `tests/unit/analytics-track.test.ts`: `track()` calls `ensureGa` on the first allowed call then `gtag('event', …)` with mapped params; no-op without ID/consent/with a privacy signal (re-checked on every call, including a signal appearing mid-session); `trackOncePerSession('visit', …)` sets its dedupe flag only when the event is actually sent (visit blocked by missing consent is sent after opt-in); never throws or awaits.
- [X] T011 [P] [US1] Update `tests/component/analytics-visit.test.tsx`: one `visit` on mount when consent is granted; none when unset; granting consent mid-session fires exactly one `visit`; a second mount in the same tab session sends none.
- [X] T012 [P] [US1] Rewrite `tests/e2e/analytics.spec.ts` visit section: intercept `**/googletagmanager.com/gtag/js*` (fulfil with an empty script) and `**/google-analytics.com/**`; with consent pre-set in `localStorage`, assert `dataLayer` holds one `visit` carrying `app: 'practice-english'`, `ui_lang`, `device_class`; reload ⇒ no second visit.

### Implementation

- [X] T013 [US1] Change `src/analytics/track.ts`: replace `endpoint()`/`send()` with the `trackingAllowed` + consent check, `ensureGa(id)` on first allowed call, and `sendEvent`; keep `track()` / `trackOncePerSession` signatures and the session dedupe helpers (`pe.visit`, `pe.errs`) unchanged except the flag-after-send rule. Makes T010 pass.
- [X] T014 [US1] Update `src/analytics/AnalyticsProvider.tsx`: subscribe to consent changes and re-run the `visit` effect when consent becomes granted. Makes T011 pass.
- [X] T015 [US1] Update `playwright.config.ts`: the analytics web server uses `VITE_GA_MEASUREMENT_ID=G-TEST123` instead of `VITE_ANALYTICS_ENDPOINT=/api/e`, and the comment mentions Google hosts being intercepted. Makes T012 pass.

**Checkpoint**: US1 works and is independently testable (consent set via storage in tests).

---

## Phase 4: User Story 2 - Keep all the usage events (Priority: P1)

**Goal**: `track_started`, `resume_used`, `language_changed` and `error` reach GA with the same timing, labels and dedupe as spec 003, with no call-site changes.

**Independent Test**: A scripted session produces exactly the expected `dataLayer` events and no automatic ones.

### Tests first

- [X] T016 [P] [US2] Re-point `tests/component/analytics-track-started.test.tsx` at the gtag stub: assert `track_started` params (`source`, `level`, `book_type`, `unit`, `track`) for scan, navigation, resume, repeat and next.
- [X] T017 [P] [US2] Re-point `tests/component/analytics-source-handoff.test.tsx` and `tests/component/analytics-resume.test.tsx`: source hand-off still yields the right `source`; `resume_used` sent once per activation; `language_changed` carries the **new** `ui_lang`.
- [X] T018 [P] [US2] Re-point `tests/component/analytics-errors.test.tsx`: `error` with `error_type` (`playback-failure` with content ids, `scan-failure` and `unexpected` without), deduped per tab session, no message/stack/URL in params.
- [X] T019 [P] [US2] Extend `tests/e2e/analytics.spec.ts` with the scripted journey (pick track, replay, Next, resume from home, switch language, trigger a playback error): assert the exact ordered event list from `dataLayer` and zero extra events (SC-002).

### Implementation

- [X] T020 [US2] Make T016–T019 pass. Expected to need no source change beyond T013; if a test exposes a mapping gap, fix `src/analytics/ga.ts` (`sendEvent`) only. Do not edit call sites in `src/` that use `useAnalytics()`.

**Checkpoint**: Event parity with 003 verified (US1 + US2 = functional MVP).

---

## Phase 5: User Story 3 - Visitors' privacy is still respected (Priority: P2)

**Goal**: Consent prompt for every visitor without a DNT/GPC signal; nothing from Google before opt-in; privacy note names Google Analytics in en and es.

**Independent Test**: Fresh profile shows the banner and zero Google requests; decline keeps it off; DNT/GPC hides the banner and keeps Google unloaded even with stored `granted`.

### Tests first

- [X] T021 [P] [US3] Create `tests/component/consent-banner.test.tsx`: banner renders as `role="region"` labelled by `consent.title` with accept/decline buttons when unset; accept loads GA and sends `visit`; decline loads nothing and hides the banner; hidden when a privacy signal is present; `PrivacySettingsButton` reopens the choice and is not rendered under a privacy signal; `VITE_CONSENT_PROMPT=off` shows no banner.
- [X] T022 [P] [US3] Update `tests/component/analytics-privacy.test.tsx`: DNT or GPC ⇒ no script injected and no events even with `pe.consent=granted`; signal appearing mid-session stops further events; blocked/failed script load leaves the app working with no console errors.
- [X] T023 [P] [US3] Extend `tests/e2e/analytics.spec.ts` with negative runs: no consent, declined, DNT/GPC, and Google hosts aborted ⇒ zero requests to Google hosts and the existing journeys still pass (SC-003).
- [X] T024 [P] [US3] Confirm `tests/unit/locale-parity.test.ts` covers the new keys (`consent.title`, `consent.body`, `consent.accept`, `consent.decline`, `consent.settings`, rewritten `analytics.privacy`); extend it if it does not enumerate keys generically.

### Implementation

- [X] T025 [P] [US3] Add `consent.*` keys and rewrite `analytics.privacy` (names Google Analytics, lists what is collected, mentions the `_ga` cookie, states no personal data is deliberately gathered) in `src/locales/en.json` and `src/locales/es.json`.
- [X] T026 [US3] Create `src/analytics/ConsentBanner.tsx`: `ConsentBanner` (compact bottom bar, `role="region"`, keyboard-operable buttons ≥44 px, link to the privacy note, no focus trap) and `PrivacySettingsButton`; style with existing tokens/CSS conventions. Makes T021 pass.
- [X] T027 [US3] Update `src/components/Layout.tsx`: mount `ConsentBanner` and render `PrivacySettingsButton` in the footer next to the privacy note. Makes T021–T023 pass.

- [ ] T035a [US3] Verify against a throwaway GA4 stream (quickstart steps 2–4): off by default, consent flow works, DebugView shows only the five defined events and none of `page_view`, `scroll`, `click`, `file_download`, `view_search_results`, and none of the five event names is reserved (otherwise prefix all with `pe_` and update `contracts/ga-event-contract.md`, `src/analytics/ga.ts` and tests). Release gate for US4 (FR-002a, FR-012).

**Checkpoint**: Privacy behaviour complete in en and es.

---

## Phase 6: User Story 4 - Retire the old self-hosted analytics (Priority: P3)

**Goal**: No code, endpoint, dependency or test remains for the spec 003 collector.

**Independent Test**: `git grep` finds no collector references outside `specs/`; build succeeds; nothing posts to `/api/e`.

> Run only after US1–US3 are verified against a GA test stream (T035a).

- [X] T028 [US4] Delete `netlify/functions/collect.ts`, `netlify/functions/report.ts`, `netlify/functions/lib/schema.ts` (the `netlify/functions` directory goes away) and `scripts/analytics-report.ts`.
- [X] T029 [P] [US4] Delete `tests/unit/analytics-collect.test.ts`, `tests/unit/analytics-report.test.ts`, `tests/unit/analytics-schema.test.ts`.
- [X] T030 [P] [US4] Edit `netlify.toml`: remove the `[functions]` block and the `/api/e` and `/api/report` redirects (keep the SPA fallback and cache headers).
- [X] T031 [P] [US4] Edit `package.json`: remove the `report` script and the `@netlify/blobs` dependency; run `npm install` to refresh `package-lock.json`.
- [X] T032 [US4] Mark spec 003 FR-007 as superseded by 005 in `specs/003-anonymous-usage-analytics/spec.md` (FR-013).
- [X] T033 [US4] Verify retirement: `git grep -nE "api/e|netlify/functions|@netlify/blobs|VITE_ANALYTICS_ENDPOINT|analytics-report"` returns nothing outside `specs/`, and `npm run build` succeeds (SC-005).

**Checkpoint**: Single analytics path (GA) remains.

---

## Phase 7: Polish & cross-cutting

- [X] T034 Run `npm run check` and `npm run test:e2e`; fix any typecheck, lint or locale-parity failures.
- [ ] T035 Re-run the T035a checks against the final build after US4 removal to confirm nothing regressed.
- [ ] T036 Measure time-to-first-playback with analytics on vs off (quickstart step 5); added time must be ≤ 50 ms (SC-004).
- [ ] T037 Complete the owner-side rollout checklist in `quickstart.md` (separate web stream, Enhanced measurement off, Google signals off, 2-month retention, custom dimensions registered, `VITE_GA_MEASUREMENT_ID` set in Netlify production only) and confirm the privacy note renders in en and es (SC-006). Also: scope the ID to the Netlify Production context only, so deploy previews and branch deploys have it unset (load a preview and confirm no Google request, FR-008); confirm in GA admin that IP storage is not configurable (GA4 default, satisfies FR-005); time the SC-001 check (PracticeEnglish visible and filterable in under one minute).

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 → user stories. Phase 2 blocks all stories.
- **US1** (after Phase 2): no dependency on other stories; consent is set via storage in tests.
- **US2** (after US1): reuses `track.ts`/`ga.ts` from US1; mostly test work.
- **US3** (after Phase 2; practically after US1): needs `consent.ts` (Phase 2) and the provider change (T014). Required before release because it is the only UI path to opt in.
- **US4** (last): only after US1–US3 pass and T035a has verified GA; T006 must be done before T028 (types moved out of the schema file).
- Polish: after all stories.

Within a story: tests (fail) → implementation → checkpoint.

## Parallel Opportunities

- Phase 2 tests T003, T004, T005 together; then T007 and T008 together (T006 first because it defines the types they import).
- US1 tests T010, T011, T012 together.
- US2 tests T016–T019 together (different files; T019 shares `analytics.spec.ts` with T012/T023, so sequence edits to that one file).
- US3 tests T021–T024 and locale task T025 together (T023 shares `analytics.spec.ts`).
- US4: T029, T030, T031 together after T028.

## Implementation Strategy

1. **MVP**: Phases 1–3 (US1) — visits reach GA when consent is stored; add US2 for event parity. Do not deploy before US3: without the banner no visitor can opt in, so nothing would ever be sent.
2. Deliver US3 next (release gate), then verify on a GA test stream (T035).
3. Finish with US4 removal, then polish and the owner rollout checklist.
