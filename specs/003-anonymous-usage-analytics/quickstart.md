# Quickstart: Validating Anonymous Usage Analytics

## Prerequisites
- Node ≥ 22.12, `npm install`.
- Netlify CLI for local function runs: `npx netlify dev` (serves app + functions + local Blobs).

## 1. Automated checks
```bash
npm run check          # typecheck, lint, unit + component tests, catalog validation
npm run test:e2e       # includes tests/e2e/analytics.spec.ts (collector intercepted)
```
Expected: all green. Key cases covered: privacy gate (endpoint unset / DNT / GPC ⇒ nothing sent), device class rule, visit once per tab session, track-start sources (scan, navigation, resume, repeat, next), failed play ⇒ no `track_started` but one `playback-failure`, dedupe, collector allowlist rejections, app journeys passing with the endpoint blocked.

## 2. Manual end-to-end (local)
```bash
VITE_ANALYTICS_ENDPOINT=/api/e ANALYTICS_REPORT_TOKEN=dev npx netlify dev
```
1. Open the app on a 390×844 viewport (mobile UA) → one `visit`. Reload → still one.
2. Switch language → `language_changed`. Pick a track, press Play → `track_started` (navigation); Replay → (repeat); Next → (next); use Continue card → `resume_used` + (resume).
3. Enable DNT in the browser, open a new tab → no requests to `/api/e` in the network panel.
4. Fetch the report:
   ```bash
   ANALYTICS_REPORT_TOKEN=dev npm run report -- --from $(date -u +%F) --to $(date -u +%F) --url http://localhost:8888
   ```
   Expected: counts match steps 1–2; no field other than the vocabulary in [data-model.md](./data-model.md).

## 3. Production smoke test
Set `VITE_ANALYTICS_ENDPOINT=/api/e` (Production context) and `ANALYTICS_REPORT_TOKEN` in Netlify, deploy, repeat step 2 on the live site, then run the report against `https://practiceenglish.net`. Confirm deploy previews send nothing.

## 4. Privacy review (SC-006)
Inspect a captured request body and a listed blob key: only fields from [contracts/collector-api.md](./contracts/collector-api.md); no UA, IP, cookie or persistent ID.
