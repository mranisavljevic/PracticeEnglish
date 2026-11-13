# Quickstart: Validate Google Analytics Migration

## Prerequisites

- Node ≥ 22.12, `npm install`.
- A GA4 property with a **separate web data stream** for PracticeEnglish; note its measurement ID (`G-XXXXXXXXXX`). Use a throwaway/test stream for steps 3–4.
- Stream settings: Enhanced measurement **off**, Google signals **off**, event data retention 2 months. Register the event-scoped custom dimensions listed in [contracts/ga-event-contract.md](./contracts/ga-event-contract.md).

## 1. Automated checks (no network to Google)

```sh
npm run check          # typecheck, lint, unit + component tests, catalog validation
npm run test:e2e       # includes the analytics project; Google hosts are intercepted
```

Expected: all pass. Covers off-by-default (no ID ⇒ no script), consent gate, DNT/GPC override, event→param mapping, dedupe, and locale parity.

## 2. Off by default

```sh
npm run dev            # no VITE_GA_MEASUREMENT_ID
```

Open the app, DevTools → Network: no request to `googletagmanager.com` or `google-analytics.com`; no consent banner.

## 3. Consent flow and events (against the test stream)

```sh
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX npm run dev
```

1. Fresh profile: banner appears; Network shows **no** Google requests yet.
2. Decline, reload: no Google requests; banner gone; footer "Privacy settings" reopens it.
3. Accept: `gtag/js` loads and a `visit` hit is sent. Confirm in GA **Admin → DebugView** (append `?debug_mode=1` or use the GA Debugger extension) that `visit` arrives with `app`, `ui_lang`, `device_class`.
4. Scripted session: scan/pick a track, replay, Next, resume from home, switch language, trigger a playback error. Expect exactly `track_started` (source `navigation`/`repeat`/`next`/`resume`/`scan`), `resume_used`, `language_changed`, `error`, with no `page_view`, `scroll`, `click` or other automatic events (SC-002).
5. If DebugView flags any of the five names as reserved, prefix all with `pe_` per research D6 and update the contract.

## 4. Privacy signals

1. Enable Global Privacy Control (e.g. a GPC-enabled browser or extension) or Do Not Track and reload: no banner, no Google requests, even with `pe.consent=granted` in `localStorage`.
2. Toggle the signal mid-session: no events after it turns on.
3. Block `googletagmanager.com` (uBlock or DevTools request blocking): app plays audio normally, no console errors.

## 5. Performance (SC-004)

Compare time-to-first-playback with analytics on and off (Playwright trace or `performance.now()` from tap to `playing`). Added time ≤ 50 ms.

## 6. Retirement (after step 3 passes)

```sh
git grep -nE "api/e|netlify/functions|@netlify/blobs|VITE_ANALYTICS_ENDPOINT|analytics-report"   # expect no matches outside specs/
npm run build && ls dist
```

Expected: no matches; `netlify/functions/` gone; requests to `/api/e` and `/api/report` return the SPA fallback or 404 after deploy (SC-005).

## 7. Release checklist

- Set `VITE_GA_MEASUREMENT_ID` in the Netlify production environment only (not in deploy previews).
- Constitution shows v2.1.0 and 003's FR-007 is noted as superseded.
- Privacy note renders in en and es (SC-006).
