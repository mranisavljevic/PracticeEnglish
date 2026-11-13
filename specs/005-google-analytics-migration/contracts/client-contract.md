# Contract: Client Analytics Module

## `src/analytics/events.ts`
- Vocabulary types `EventType`, `TrackSource`, `ErrorType`, `DeviceClass`, `BookType`, `UsageEvent` (moved from the removed schema file). Same values as 003.
- `detectDevice(userAgent): DeviceClass` unchanged.
- `privacySignalPresent(nav, win): boolean` pure; true for DNT `'1'` or GPC `true`.
- `trackingAllowed(env, nav, win, consent): boolean` pure; false unless `VITE_GA_MEASUREMENT_ID` is set, no privacy signal, and `consent === 'granted'` (or prompt disabled).

## `src/analytics/consent.ts`
- `getConsent(): 'unset' | 'granted' | 'declined'` (prompt flag off ⇒ `granted`); never throws if `localStorage` is blocked (falls back to memory).
- `setConsent(value: 'granted' | 'declined'): void` persists and notifies subscribers; declining deletes `_ga*` cookies best-effort.
- `subscribe(listener): () => void`; `promptVisible(): boolean` is true when consent is unset, the prompt flag is on, and no privacy signal is present.

## `src/analytics/ga.ts`
- `ensureGa(id): void` defines `window.dataLayer`/`gtag`, issues `config` with the flags in [ga-event-contract.md](./ga-event-contract.md), and appends the async script once.
- `sendEvent(event: UsageEvent): void` maps a `UsageEvent` to GA event name and params. Never throws.

## `src/analytics/track.ts`
- `track(event, lang): void` unchanged signature; each call re-evaluates `trackingAllowed`, calls `ensureGa` on first allowed call, then `sendEvent`. No-op otherwise. Never awaits, never throws.
- `trackOncePerSession(key, event, lang)` unchanged; the dedupe flag is only set when the event is actually sent, so a visit blocked by missing consent is still sent after opt-in.

## `src/analytics/AnalyticsProvider.tsx`
- Unchanged API (`useAnalytics()` with `trackStarted`, `resumeUsed`, `languageChanged`, `playbackFailure`, `scanFailure`). Additionally re-runs the `visit` effect when consent changes to granted.

## `src/analytics/ConsentBanner.tsx`
- Renders a `role="region"` bar labelled by `consent.title` when `promptVisible()`: text from `consent.body`, buttons `consent.accept` and `consent.decline`, link to the privacy note. Accept/decline call `setConsent`. Does not trap focus and does not block playback.
- Exports `PrivacySettingsButton` (footer): reopens the choice (shows the banner) unless a privacy signal is present, in which case it is not rendered.

## Call sites
Unchanged from [003's contract](../../003-anonymous-usage-analytics/contracts/client-contract.md); `Layout` additionally mounts `ConsentBanner` and `PrivacySettingsButton`.

## i18n (en + es, parity enforced)
`analytics.privacy` (rewritten: names Google Analytics, lists what is collected, mentions the `_ga` cookie, states no personal data is deliberately gathered), `consent.title`, `consent.body`, `consent.accept`, `consent.decline`, `consent.settings`.
