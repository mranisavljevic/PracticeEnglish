# Research: Google Analytics Migration

No `NEEDS CLARIFICATION` remained after the spec's two clarification sessions; the items below are the technical decisions the plan depends on.

## D1. Integration method: plain `gtag.js`, injected dynamically

- **Decision**: Inject `https://www.googletagmanager.com/gtag/js?id=<ID>` as an async script only after the gate passes, with the standard `window.dataLayer`/`gtag` shim defined first.
- **Rationale**: Smallest option (Constitution V), no dependency, and the script is not loaded at all when blocked by DNT/GPC or lacking consent (FR-006, FR-008, FR-011). Events fired before the script finishes loading queue on `dataLayer`.
- **Alternatives**: (a) Google Tag Manager: extra layer and owner-side config for five events. (b) `react-ga4` or similar: new dependency for a ~20-line wrapper. (c) Static `<script>` in `index.html` with Consent Mode "denied" default: still loads Google before opt-in, which the spec forbids. (d) GA Measurement Protocol from a function: needs a server, defeats retiring the functions, and bypasses consent semantics.

## D2. Configuration flags

- **Decision**: `gtag('config', ID, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false })`, never call `set user_id`, and set `cookie_expires` to a short lifetime (60 days). Every event includes `app: 'practice-english'`.
- **Rationale**: Covers FR-002a (no automatic page view), FR-005 (no ads/Signals/user ID) and keeps the cookie lifetime aligned with the retention the owner sets.
- **Notes**: GA4 has no IP-anonymisation toggle; it does not log full IPs (spec assumption). Verify during quickstart that no `ip`-bearing parameters are added.

## D3. Privacy-signal gate

- **Decision**: Reuse 003's `trackingAllowed` logic (`navigator.doNotTrack`, `window.doNotTrack`, `navigator.globalPrivacyControl`) and re-check it on every `track()` call, so a signal appearing mid-session stops further events. A signal also hides the banner and forces "off" regardless of any stored choice.
- **Rationale**: FR-006 and the edge case "DNT turns on mid-session". Stored `granted` must not override a later signal.
- **Alternatives**: Evaluate once at load: fails the mid-session edge case.

## D4. Consent: storage, scope, flag

- **Decision**: `localStorage['pe.consent']` = `granted` | `declined`. States: unset (banner shown, nothing sent), granted, declined. A footer "Privacy settings" button reopens the choice. Flag `VITE_CONSENT_PROMPT` (default on; `off` ⇒ treated as granted). Granting mid-session loads the script and sends the once-per-session `visit`. Declining after granting stops sending and removes the `_ga*` cookies best-effort.
- **Rationale**: FR-011, clarified answer "every visitor, nothing sent until opt-in, owner can turn off later". `localStorage` is already used for locale/progress, so no new storage type.
- **Alternatives**: Region detection (explicitly excluded by the spec); Google Consent Mode v2 with default `denied`: still loads Google first.

## D5. Enhanced measurement and retention are owner-side settings

- **Decision**: The code cannot turn off enhanced measurement; it is a web data stream setting. Rollout checklist (in quickstart): create a separate web data stream for PracticeEnglish in the owner's property, disable Enhanced measurement, set event data retention to 2 months, turn off Google signals, and register custom dimensions.
- **Rationale**: FR-002a is satisfied by `send_page_view: false` plus the stream setting; SC-002's "0 unexpected events" is verified in DebugView.
- **Alternatives**: Filtering unexpected events in the browser is impossible for automatic events emitted by gtag itself.

## D6. Event naming and parameters

- **Decision**: Keep 003 event names (`visit`, `track_started`, `resume_used`, `language_changed`, `error`). Rename parameters that clash with GA built-ins: `lang` → `ui_lang`, `device` → `device_class`; `label` splits into `source` (track_started) and `error_type` (error). Content ids become `level`, `book_type`, `unit`, `track`. Details in [contracts/ga-event-contract.md](./contracts/ga-event-contract.md).
- **Rationale**: GA4 auto-collects `language` and `device_category`; reusing those names would be ambiguous in reports. Separate `source`/`error_type` make custom dimensions self-describing.
- **Risk**: confirm in DebugView that none of the five names is reserved by GA4; if one is (e.g. `error`), prefix all five with `pe_` and update the contract. Done in quickstart step 3.
- **Alternatives**: Prefix everything from the start: rejected, breaks the owner's mental model (spec assumption).

## D7. Constitution amendment

- **Decision**: Version 2.1.0 (MINOR: materially expands guidance). Replace the "MUST NOT collect personal data" bullet with: no personal data deliberately collected; analytics limited to Google Analytics with opt-in consent, DNT/GPC honoured, no advertising features or user-level identifiers, no free text, minimal retention. Sync Impact Report notes 003 FR-007 superseded.
- **Rationale**: FR-013 and the spec's Constitution Justification (option b).

## D8. Test strategy for the swap

- **Decision**: Component/unit tests stub `window.gtag` (a recording `vi.fn`) and assert `(‘event’, name, params)`. Playwright intercepts `**/googletagmanager.com/gtag/js*` (fulfilled with an empty script) and `**/google-analytics.com/g/collect*`; the journey asserts the recorded `gtag` calls through `page.evaluate` on `dataLayer`, and the negative runs assert zero Google requests.
- **Rationale**: Nothing leaves the machine; assertions run on the same payload shape as before.

## D9. Removal of the collector

- **Decision**: Delete `netlify/functions/*`, `scripts/analytics-report.ts`, the `report` npm script, `@netlify/blobs`, the `/api/e` and `/api/report` redirects, and the three collector unit tests. Move vocabulary types from `netlify/functions/lib/schema.ts` to `src/analytics/events.ts` first. The old `analytics` blob store is left in place (historical data is not migrated).
- **Rationale**: FR-012, SC-005. Ordering: ship GA, verify in DebugView, then remove (separate tasks in the same branch; removal is last).
