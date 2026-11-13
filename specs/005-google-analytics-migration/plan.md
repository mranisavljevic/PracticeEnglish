# Implementation Plan: Google Analytics Migration

**Branch**: `005-google-analytics-migration` | **Date**: 2026-11-02 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-google-analytics-migration/spec.md`

## Summary

Replace the first-party collector from spec 003 with Google Analytics 4, keeping the five-event vocabulary and every call site unchanged:

1. **Transport swap** (`src/analytics/`): `track()` stops posting to `/api/e` and instead calls `gtag('event', …)`. The GA script (`gtag.js`) is injected dynamically, only after a gate passes: a measurement ID is configured, no Do Not Track / GPC signal, and the learner has granted consent ([research.md](./research.md) D1–D3). Until then nothing from Google is loaded.
2. **Consent** (new `ConsentProvider` + small banner and a footer "Privacy settings" link): shown to every visitor without a DNT/GPC signal; choice stored in `localStorage`; a build-time flag can disable the prompt (treated as granted) ([research.md](./research.md) D4).
3. **GA configuration**: `send_page_view: false`, Google signals and ad personalisation off, no user ID, short cookie lifetime; every event carries `app: practice-english`, `ui_lang`, `device_class` ([contracts/ga-event-contract.md](./contracts/ga-event-contract.md)). Enhanced measurement and data retention are stream/property settings the owner changes in the GA admin; this is a rollout checklist item, not code ([research.md](./research.md) D5).
4. **Retirement**: delete both Netlify functions, the shared schema, the report script, the `@netlify/blobs` dependency and the `/api/*` redirects; move the event vocabulary types into `src/analytics/events.ts`.
5. **Governance**: amend the constitution (2.1.0) to permit Google Analytics with safeguards, mark 003 FR-007 superseded, update the privacy note in en/es ([research.md](./research.md) D7).

## Technical Context

**Language/Version**: TypeScript (strict), Node 22 (unchanged).

**Primary Dependencies**: React 19, react-router-dom 7, Vite (existing). **No new runtime dependency**: `gtag.js` is loaded from Google at runtime, never bundled. **Removed**: `@netlify/blobs`.

**Storage**: Client only. `localStorage` key `pe.consent` (`granted` | `declined`; absent = unset). `sessionStorage` keys `pe.visit` and `pe.errs` unchanged (per-tab dedupe). Google sets its own `_ga*` cookies after consent.

**Testing**: Vitest (unit: privacy/consent gate, loader, event→gtag param mapping, dedupe; component: consent prompt, visit-after-consent, DNT hides prompt, locale parity for new strings; existing analytics component tests re-pointed at a stubbed `window.gtag`), Playwright at 390×844 with Google hosts intercepted via `page.route` (scripted journey = SC-002; no-consent / DNT / blocked = SC-003).

**Target Platform**: Same browsers as today; hosting on Netlify (no server code after this change).

**Project Type**: Static single-page web application (the serverless functions are removed).

**Performance Goals**: ≤50 ms added to time-to-first-playback (SC-004). The script is injected `async` after consent and after first paint; `track()` never awaits and queues on `window.dataLayer` until the script is ready.

**Constraints**: No data sent without opt-in (unless the owner disables the prompt); DNT/GPC always wins; no free text; app unchanged when Google is blocked or offline; dev/tests send nothing without an explicit measurement ID.

**Scale/Scope**: Five events, ~4 files changed under `src/analytics/`, 1 new component, 2 locale files, ~12 files deleted.

## Constitution Check

*GATE: passed before Phase 0 research (via the amendment in D7); re-checked after Phase 1 design, still passes.*

| Principle / Constraint | Status | How the plan satisfies it |
|---|---|---|
| I. Mobile-First, Fast Access | PASS | Banner is a compact, dismissible bottom bar that does not block playback or navigation; no added taps to start audio. Script is async. |
| II. Multilingual by Default | PASS | New strings (`consent.*`, updated `analytics.privacy`) in en and es; parity test enforces. Events carry the displayed language. |
| III. Resume | PASS | Resume flow only observed. Consent flag is not progress and stores no playback position. |
| IV. Test-First | PASS | tasks.md will order failing tests before each module; unit + component + Playwright. |
| V. Simplicity | PASS w/ note | Net removal of code and a dependency. No analytics library added (plain `gtag`). The consent banner is the only new UI, required by FR-011. |
| TS + React strict | PASS | All new code strict TS; `gtag` typed via a local `Window` augmentation. |
| Content/legal | PASS | No content change. |
| Accessibility | PASS | Banner uses `role="region"` with a label, real buttons, keyboard-operable, ≥44 px targets. |
| No personal data / analytics needs justification | PASS after amendment | GA assigns a pseudonymous browser ID, which the current wording forbids. The amendment (see D7 and Complexity Tracking) permits GA with: opt-in consent, DNT/GPC honoured, no ads/Signals/user-ID, no free text, minimal retention. |
| New text has translations | PASS | en + es. |

**Post-design re-check**: [data-model.md](./data-model.md) fields are unchanged from 003 plus a consent state; none identifies a person. The remaining pseudonymous identifier is Google's `_ga` cookie, covered by the amendment and disclosed in the privacy note.

## Project Structure

### Documentation (this feature)

```text
specs/005-google-analytics-migration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── client-contract.md
│   └── ga-event-contract.md
└── tasks.md             # Phase 2 (/speckit-tasks), not created here
```

### Source Code (repository root)

```text
src/
├── analytics/
│   ├── events.ts            # vocabulary types moved here from the schema; device class; privacy gate (adds consent + GA ID)
│   ├── ga.ts                # NEW: loadGa(), gtag() queue, GA config flags, event → params mapping
│   ├── consent.ts           # NEW: read/write pe.consent, DNT/GPC check, subscribe
│   ├── ConsentBanner.tsx    # NEW: prompt + "Privacy settings" re-open control
│   ├── track.ts             # CHANGED: send() → gtag; dedupe helpers unchanged
│   ├── AnalyticsProvider.tsx# CHANGED: visit also fires when consent is granted mid-session
│   └── source.ts            # unchanged
├── components/Layout.tsx    # CHANGED: mounts ConsentBanner, footer privacy link
└── locales/{en,es}.json     # CHANGED: analytics.privacy; new consent.* keys

netlify/functions/           # DELETED (collect.ts, report.ts, lib/schema.ts)
scripts/analytics-report.ts  # DELETED
netlify.toml                 # CHANGED: /api/e and /api/report redirects removed
package.json                 # CHANGED: drop "report" script and @netlify/blobs
playwright.config.ts         # CHANGED: analytics project uses VITE_GA_MEASUREMENT_ID
.specify/memory/constitution.md  # CHANGED: v2.1.0 amendment

tests/
├── helpers/analytics.ts     # CHANGED: stub window.gtag instead of sendBeacon
├── unit/                    # analytics-collect/report/schema DELETED; events/track/source updated; ga + consent added
├── component/               # analytics-* re-pointed; consent-banner added
└── e2e/analytics.spec.ts    # CHANGED: intercept Google hosts
```

**Structure Decision**: Keep the existing single-project layout. All GA specifics are isolated in `src/analytics/ga.ts` so call sites (`useAnalytics()`) and their tests do not change.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Constitution wording "MUST NOT collect personal data" amended to allow GA's pseudonymous browser ID | Owner wants all apps in one GA account (spec goal) | Keeping the self-hosted collector, or configuring GA with no identifier at all, does not give one account; GA4 cannot run without a client ID cookie/identifier when it sends hits normally |
| Consent banner (new UI) | Required by FR-011 for a mixed-region audience | Showing nothing and sending on load would violate the opt-in rule |
