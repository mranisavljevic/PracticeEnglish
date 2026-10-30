# Research: Anonymous Usage Analytics

All Technical Context unknowns resolved. No NEEDS CLARIFICATION remain.

## D1. Analytics backend: first-party collector vs. hosted service
- **Decision**: First-party Netlify Function (`collect`) writing to Netlify Blobs; report via a token-protected `report` function and a CLI script.
- **Rationale**: The spec forbids transmitting/storing UA, browser or OS detail and requires the plan to disable that or choose a service that doesn't. Hosted services (Plausible, Umami, GoatCounter, Fathom) read the UA header server-side to derive browser/OS/device; Plausible gates custom properties behind a paid tier. A collector we own reads only the JSON body, so FR-007 holds by construction, and the app is already on Netlify (no new vendor or DPA). Netlify's platform request logs are outside app control and are noted in the privacy note's scope, not used by us.
- **Alternatives considered**: Plausible/Umami cloud (UA derivation, vendor, cost); GoatCounter (no event properties); Cloudflare Web Analytics (no custom events); self-hosted Umami (a server to run, still derives UA); Google Analytics (cookies, personal data — rejected by constitution).

## D2. Storage: one empty blob per event, event encoded in the key
- **Decision**: Key = `YYYY-MM-DD/<type>~<lang>~<device>~<label>~<level>~<bookType>~<unit>~<track>/<uuid>` (unused slots `-`), empty value. Report = list keys by day prefix and count by dimensions.
- **Rationale**: Blobs have no atomic increment, so counters would lose events under concurrency; per-event keys are race-free. Listing returns keys without fetching values, so reports are cheap. A random UUID suffix links nothing to a person. Day-level timestamp (UTC, server-set) is all the owner needs and is less identifying than a precise time.
- **Alternatives considered**: Counter blobs per tuple (race conditions); a SQL/KV database (new service); append-only log file (not supported on serverless); full JSON value per event (needs a fetch per event to report).

## D3. Track-start source: router navigation state
- **Decision**: The arrival source is passed as react-router `state: { source }` on navigation: scan overlay → `scan`; ContinueCard → `resume`; Player "Next" link → `next`; everything else (lists, Previous, direct URL) → `navigation` (default when no state). In-page "Replay" → `repeat`.
- **Rationale**: Track.tsx can't otherwise tell how it was reached. State rides with the history entry, needs no globals or storage, and is invisible to URLs. Prev and direct links are folded into `navigation` since the spec's label set has no other fit.
- **Alternatives considered**: Query param (pollutes shareable URLs, can be forged into the link); module-level "last source" variable (stale on back/forward); context set by clickers (more plumbing).

## D4. When exactly "track started" fires
- **Decision**: Player marks a *pending start* when the learner begins a new play intent — first Play from idle/error-retry (source = arrival source), Replay, or Play after the track ended (source `repeat`). The next `playing` media event with a pending start sends one `track_started` and clears the flag. Pause→resume does not set it. Failed load/blocked play never reaches `playing`, so nothing is sent (FR-002).
- **Rationale**: Ties the event to audio actually playing (clarification), makes duplicate taps/`playing` re-fires harmless, and keeps one event per real action (edge case on rapid taps).
- **Alternatives considered**: Fire in `onPlay` handler (counts failures); fire on route change (counts without audio).

## D5. Privacy gate, device class, visit identity
- **Decision**: Tracking is allowed only if `VITE_ANALYTICS_ENDPOINT` is set **and** `navigator.doNotTrack !== '1'` (and `window.doNotTrack`) **and** `navigator.globalPrivacyControl !== true`. Device class: `/Mobi|Android|iPhone|iPad|iPod/i` on `navigator.userAgent` → `mobile`, else (including empty/missing) `desktop`, evaluated once, only the class sent. Visit = `sessionStorage['pe.visit']` flag; absent → send `visit`, set flag. Error dedupe = `sessionStorage['pe.errs']` set of `type|trackKey`. All storage access wrapped in try/catch; if unavailable, fall back to an in-memory flag (still once per page load, never persisted).
- **Rationale**: Directly implements the clarifications; sessionStorage is per tab and dies with it, matching "tab session". An unset endpoint means dev, tests and deploy previews send nothing (FR-011) with no extra mode logic.
- **Alternatives considered**: Viewport-based detection (rejected in clarification); localStorage visit ID (persistent identifier, forbidden).

## D6. Transport, validation, report access
- **Decision**: `navigator.sendBeacon(endpoint, Blob(JSON, 'text/plain'))`, falling back to `fetch(..., { method: 'POST', keepalive: true })`; errors swallowed. Collector rejects anything not matching the allowlist (fixed enums for type/lang/device/label; `^[a-z0-9-]{1,40}$` for level/book type/unit/track ids) with 400 and stores nothing; body capped at 1 KB. Report: `GET /api/report?from=YYYY-MM-DD&to=YYYY-MM-DD` with `Authorization: Bearer $ANALYTICS_REPORT_TOKEN`; returns counts grouped per spec FR-012. `scripts/analytics-report.ts` wraps it.
- **Rationale**: `text/plain` avoids a CORS preflight (also same-origin anyway); beacons survive page unload and never block. Allowlist validation keeps free text and junk out even from a hostile caller.
- **Alternatives considered**: Image-pixel GET (puts data in URLs/logs); public report page (needs auth UI); no auth (leaks usage data).

## D7. Errors
- **Decision**: `unexpected` from `window` `error` + `unhandledrejection` listeners (event payload ignored — type label only); `playback-failure` from Player's error path (audio `error` event or `play()` rejection other than AbortError) with content ids; `scan-failure` from ScanOverlay when scanner state becomes `error` or `notFound`. Each deduped per tab session by type + track.
- **Rationale**: Uses existing failure branches; no message/stack ever read.
- **Alternatives considered**: Error boundary only (misses async/media errors).

## D8. Privacy note
- **Decision**: One new key `analytics.privacy` rendered in the footer by `Credit`'s sibling; EN + ES. Text (EN): "This site counts anonymous visits and feature use (language, phone or desktop, which tracks are played). No personal data, cookies or tracking across visits."
- **Rationale**: FR-013; no consent banner needed with no cookies/identifiers (spec assumption).
- **Alternatives considered**: Separate privacy page (extra route, more taps/maintenance).
