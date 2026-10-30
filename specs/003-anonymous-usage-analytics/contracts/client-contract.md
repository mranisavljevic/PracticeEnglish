# Contract: Client Analytics Module

## `src/analytics/events.ts`
- `type EventType`, `type TrackSource`, `type ErrorType`, `type DeviceClass` — the fixed vocabularies from [data-model.md](../data-model.md).
- `detectDevice(userAgent: string | undefined): DeviceClass` — pure; unknown/empty ⇒ `'desktop'`.
- `trackingAllowed(env, nav): boolean` — pure; false if endpoint unset, DNT `'1'`, or GPC `true`.

## `src/analytics/track.ts`
- `track(event: Omit<UsageEvent,'lang'|'device'>, lang: string): void` — no-op when not allowed; builds the payload (adds `device`), sends via `sendBeacon`/`fetch keepalive`; never throws, never awaits.
- `trackOncePerSession(key: string, event, lang): void` — used for `visit` (`'visit'`) and `error` (`type|trackKey`); sessionStorage with in-memory fallback.

## `src/analytics/AnalyticsProvider.tsx`
- Mounted inside `LocaleProvider`. On mount: sends `visit`; installs `error` / `unhandledrejection` listeners that send `error/unexpected` (payload not read). Exposes `useAnalytics(): { trackStarted(source, ids), resumeUsed(), languageChanged(lang), playbackFailure(ids), scanFailure() }`, each bound to the current displayed language.

## Call sites (behaviour contract)

| Where | Trigger | Event |
|---|---|---|
| `AnalyticsProvider` | mount, once per tab session | `visit` |
| `LocaleProvider.setLang` | supported language chosen (changed value) | `language_changed` (new lang) |
| `ContinueCard` | link activated (`onClick`) | `resume_used`; link `state={{source:'resume'}}` |
| `ScanOverlay.open` | Open pressed | `navigate(..., {state:{source:'scan'}})` (no event itself) |
| `Player` next link | link rendered with `state={{source:'next'}}` | (no event itself) |
| `Player` | pending start + audio `playing` | `track_started` (source: arrival state for first start; `repeat` for Replay / Play-after-end) |
| `Player` | audio `error` / non-Abort `play()` rejection | `error/playback-failure` + ids (deduped) |
| `ScanOverlay` | scanner state → `error` or `notFound` | `error/scan-failure` (deduped) |
| `window` | `error`, `unhandledrejection` | `error/unexpected` (deduped) |

`Player` gains optional props `source: TrackSource` and `ids: {level,bookType,unit,track}` (supplied by `Track.tsx` from the catalog: `book.levelId`, `book.type`, `unit.id`, `track.id`). Existing props unchanged.

## i18n
`analytics.privacy` — required in `en.json` and `es.json` (parity test).
