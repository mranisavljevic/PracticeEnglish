# Implementation Plan: Anonymous Usage Analytics

**Branch**: `003-anonymous-usage-analytics` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-anonymous-usage-analytics/spec.md`

## Summary

Add a small, first-party, cookieless event pipeline to the existing Vite + React + TS app:

1. **Client** (`src/analytics/`): a tiny module that decides whether tracking is allowed (endpoint configured, no DNT/GPC), derives the device class from the user-agent locally, and sends fixed-vocabulary events (`visit`, `track_started`, `resume_used`, `language_changed`, `error`) with `sendBeacon`. Call sites are thin hooks into the existing Track/Player, ContinueCard, ScanOverlay/useScanner, LocaleProvider and a global error listener. The track-start *source* travels as react-router navigation state, so the Track page knows whether the learner arrived by scan, list pick, resume or next ([research.md](./research.md) D3–D4).
2. **Collector** (`netlify/functions/collect.ts`): a Netlify Function that validates each event against a strict allowlist and stores it as an empty-valued Netlify Blob whose *key* encodes the event (day + dimensions + random suffix). It never reads or stores IP or user-agent. A token-protected `report` function aggregates keys over a date range; `scripts/analytics-report.ts` prints it (FR-012, SC-003) ([research.md](./research.md) D1–D2, D6).
3. **Privacy note** (`analytics.privacy` in every locale) shown in the footer next to the existing credit (FR-013).

Why not a hosted analytics product: every third-party service derives browser/OS from the request's user-agent, which the spec's assumptions forbid unless disabled, and most gate custom-event properties behind paid plans. A ~100-line first-party collector meets FR-007 by construction ([research.md](./research.md) D1).

## Technical Context

**Language/Version**: TypeScript (strict), Node 22 (unchanged); Netlify Functions run Node 22.

**Primary Dependencies**: React 19, react-router-dom 7, Vite (existing). **New, server-only**: `@netlify/blobs` (used by the two functions; not bundled into the client). No new client runtime dependency.

**Storage**: Netlify Blobs store `analytics` (server). Client: `sessionStorage` keys `pe.visit` and `pe.errs` for once-per-tab-session flags only (no persistence across sessions; no `localStorage`).

**Testing**: Vitest (unit: privacy gate, device class, event builder/vocabulary, session dedupe, collector validation and key encoding, report aggregation; component: events fired from Player/ContinueCard/ScanOverlay/LocaleProvider, locale parity for the privacy note), Playwright at 390×844 with the collector intercepted via `page.route` (scripted journey = SC-002; blocked-endpoint run = SC-005).

**Target Platform**: Same browsers as today (iOS Safari 16.4+, Chrome Android, desktop). Collector on Netlify (already the host).

**Project Type**: Static web application + two serverless functions (single repo).

**Performance Goals**: ≤50 ms added to time-to-first-playback (SC-004): events are fire-and-forget via `sendBeacon`, never awaited; analytics code is ~1–2 KB and imported statically.

**Constraints**: No cookies, no persistent identifiers, no IP/UA stored, no free text; app behaviour identical when blocked/offline/DNT; dev and tests send nothing unless explicitly pointed at a test endpoint.

**Scale/Scope**: Small audience; one event ≈ one tiny blob. Report lists keys only (no per-event fetch). Revisit with daily roll-ups if monthly volume exceeds ~100k events.

## Constitution Check

*GATE: passed before Phase 0; re-checked after Phase 1 design — still passes.*

| Principle / Constraint | Status | How the plan satisfies it |
|---|---|---|
| I. Mobile-First, Fast Access | PASS | Zero added taps; fire-and-forget beacons, tiny code, no render blocking (SC-004). |
| II. Multilingual by Default | PASS | `analytics.privacy` added to every locale file; existing parity test covers it. Events carry the *displayed* language. |
| III. Resume | PASS | Resume flow unchanged; only observed. No playback position stored; `sessionStorage` flags are not progress. |
| IV. Test-First | PASS | tasks.md will order failing tests before each module; unit + component + Playwright journey. |
| V. Simplicity | PASS w/ note | No client dependency. One server dependency (`@netlify/blobs`) and two functions, justified in Complexity Tracking. |
| TS + React strict | PASS | All new code strict TS (functions included, covered by `tsc`). |
| Content/legal | PASS | No content change. |
| Accessibility | PASS | Privacy note is plain text in the footer; no new interactive controls. |
| No personal data / analytics needs justification | PASS | Spec's Constitution Justification applies; plan enforces it: allowlisted fields only, no IP/UA, no cookies, no cross-visit ID, DNT/GPC honoured. |
| New text has translations | PASS | EN + ES for the privacy note. |

**Post-design re-check**: the data model (see [data-model.md](./data-model.md)) has no field that can identify a person; day-level timestamps only. No new violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-anonymous-usage-analytics/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── collector-api.md
│   └── client-contract.md
└── tasks.md             # Phase 2 (/speckit-tasks) — not created here
```

### Source Code (repository root)

```text
src/
├── analytics/
│   ├── events.ts          # event/label vocabulary types, device class, privacy gate
│   ├── track.ts           # track(event): gate → build → sendBeacon; session-once helpers
│   ├── AnalyticsProvider.tsx  # visit event, global error listeners, exposes lang to events
│   └── source.ts          # TrackSource type + navigation-state helpers
├── components/            # Player, ContinueCard, ScanOverlay, Layout (footer note): small edits
├── pages/Track.tsx        # reads arrival source from router state, passes to Player
├── scan/useScanner.ts     # exposes failure for scan-failure event (via ScanOverlay)
├── i18n/LocaleProvider.tsx# language_changed event
└── locales/{en,es}.json   # analytics.privacy

netlify/functions/
├── collect.ts             # POST /api/e  → validate → blob key
├── report.ts              # GET  /api/report?from&to (Bearer token) → aggregates
└── lib/schema.ts          # shared allowlist + key encode/decode (also imported by tests)

scripts/analytics-report.ts  # CLI: fetch report, print tables
netlify.toml                 # /api/* → functions; analytics env docs
tests/{unit,component,e2e}/  # analytics-*.test.ts(x), analytics.spec.ts
docs/DEPLOY.md               # env vars: VITE_ANALYTICS_ENDPOINT, ANALYTICS_REPORT_TOKEN
```

**Structure Decision**: Extend the single existing project; add `src/analytics/` for the client and `netlify/functions/` for the collector (Netlify's default functions dir). Shared allowlist lives in `netlify/functions/lib/schema.ts` and is imported by the client's types only as types, so no server code ships to the browser.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Serverless collector + `@netlify/blobs` (new server-side layer/dependency) | Spec requires no UA/IP-derived data (assumption on FR-007) and owner-readable aggregates by label (FR-012) | Hosted tools (Plausible, Umami, GoatCounter) derive browser/OS from the UA on their side and/or paywall event properties; they also add a third-party processor. Sending nothing is impossible while meeting FR-012. |
