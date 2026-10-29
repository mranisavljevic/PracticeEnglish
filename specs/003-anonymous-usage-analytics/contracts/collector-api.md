# Contract: Collector & Report API

## POST `/api/e` (Netlify Function `collect`)

- **Request**: `Content-Type: text/plain` (JSON body) or `application/json`; body ≤ 1 KB; shape = `UsageEvent` in [data-model.md](../data-model.md).
- **Behaviour**: validate against the allowlist; on success write one blob (see StoredEvent); never read `x-forwarded-for`, `client-ip`, `user-agent` or any header.
- **Responses**: `204` stored; `400` invalid (nothing stored); `405` non-POST. No body, no cookies set, `Cache-Control: no-store`.
- **Examples**
  - `{"type":"visit","lang":"es","device":"mobile"}` → 204
  - `{"type":"track_started","lang":"en","device":"desktop","label":"scan","level":"level-1","bookType":"textbook","unit":"unit-1","track":"track-2"}` → 204
  - `{"type":"error","lang":"en","device":"mobile","label":"scan-failure"}` → 204
  - `{"type":"visit","lang":"en","device":"mobile","ua":"…"}` → 400 (unknown field)
  - `{"type":"error","lang":"en","device":"mobile","label":"playback-failure"}` → 400 (missing content ids)

## GET `/api/report?from=YYYY-MM-DD&to=YYYY-MM-DD` (Function `report`)

- **Auth**: `Authorization: Bearer <ANALYTICS_REPORT_TOKEN>`; otherwise `401`. Range max 366 days; `to` ≥ `from` else `400`.
- **Response**: `200` `application/json` shaped as Report in [data-model.md](../data-model.md).
- **CLI**: `ANALYTICS_REPORT_TOKEN=… npm run report -- --from 2026-10-01 --to 2026-10-29 [--url https://practiceenglish.net]` prints tables for visits (language × device), track-start sources, resume uses, language changes, errors by type, and top tracks.

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `VITE_ANALYTICS_ENDPOINT` | Netlify build env, **Production context only** (e.g. `/api/e`) | Enables the client; unset in dev, tests, previews ⇒ no events (FR-011) |
| `ANALYTICS_REPORT_TOKEN` | Netlify function env | Guards `/api/report` |
