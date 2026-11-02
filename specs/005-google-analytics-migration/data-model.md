# Data Model: Google Analytics Migration

## Usage Event (unchanged vocabulary from 003)

| Field | Type | Notes |
|---|---|---|
| `type` | `visit` \| `track_started` \| `resume_used` \| `language_changed` \| `error` | Becomes the GA event name |
| `lang` | `[a-z]{2,3}` | Displayed interface language |
| `device` | `mobile` \| `desktop` | Derived locally from the user-agent; the UA string is never sent |
| `label` | `TrackSource` for `track_started`; `ErrorType` for `error`; absent otherwise | `scan`, `navigation`, `resume`, `repeat`, `next` / `playback-failure`, `scan-failure`, `unexpected` |
| `level`, `bookType`, `unit`, `track` | catalog ids, `^[a-z0-9][a-z0-9-]{0,39}$` | Only on `track_started` and `error/playback-failure` |

The type definitions move from `netlify/functions/lib/schema.ts` to `src/analytics/events.ts`. Runtime validation is no longer needed server-side; the client builds events only from these closed types.

**Mapping to GA parameters** is in [contracts/ga-event-contract.md](./contracts/ga-event-contract.md).

## Analytics Configuration

| Field | Source | Rule |
|---|---|---|
| `measurementId` | `VITE_GA_MEASUREMENT_ID` (build-time) | Must match `^G-[A-Z0-9]+$`; absent/invalid ⇒ analytics off, no script |
| `consentPrompt` | `VITE_CONSENT_PROMPT` | Default enabled; value `off` ⇒ consent treated as granted |

## Consent State

| State | Stored as | Banner | Events sent |
|---|---|---|---|
| unset | key absent | shown (unless privacy signal) | no |
| granted | `pe.consent=granted` | hidden; "Privacy settings" can reopen | yes (subject to signal) |
| declined | `pe.consent=declined` | hidden; "Privacy settings" can reopen | no |
| overridden | any stored value + DNT/GPC | hidden, no choice offered | no |

### Transitions

- unset → granted: load script, send `visit` (once per tab session).
- unset → declined: nothing loaded.
- granted → declined: stop sending; best-effort delete `_ga*` cookies; script stays loaded but inert (events are gated in `track()`).
- declined → granted: as unset → granted.
- any → overridden: when a privacy signal is detected; reverts when the signal is absent.

## Session flags (unchanged)

`sessionStorage` `pe.visit` (visit sent) and `pe.errs` (error keys already sent), with in-memory fallback. These only suppress duplicates within a tab session.
