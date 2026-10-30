# Data Model: Anonymous Usage Analytics

## UsageEvent (wire format, client → collector)

| Field | Type | Rules |
|---|---|---|
| `type` | enum | `visit` \| `track_started` \| `resume_used` \| `language_changed` \| `error` |
| `lang` | enum | A supported locale code (`en`, `es`, …) — the *displayed* language; for `language_changed` it is the new language |
| `device` | enum | `mobile` \| `desktop` |
| `label` | enum, optional | `track_started`: `scan` \| `navigation` \| `resume` \| `repeat` \| `next`. `error`: `playback-failure` \| `scan-failure` \| `unexpected`. Required for those two types; forbidden otherwise |
| `level` | id string, optional | `^[a-z0-9-]{1,40}$`; required for `track_started` and `error/playback-failure`; forbidden otherwise |
| `bookType` | enum, optional | `textbook` \| `workbook`; same presence rule as `level` |
| `unit` | id string, optional | same as `level` |
| `track` | id string, optional | same as `level` |

No other field is accepted. No free text, URL, user-agent, IP, timestamp, or identifier is sent by the client.

### Validation (collector)
Unknown fields → reject. Missing/forbidden field per the rules above → reject. Body > 1 KB → reject. Rejected events store nothing.

## StoredEvent (Netlify Blob, store `analytics`)

- **Key**: `<UTC date YYYY-MM-DD>/<type>~<lang>~<device>~<label|->~<level|->~<bookType|->~<unit|->~<track|->/<uuid>`
- **Value**: empty.
- The date is added server-side (day granularity). The UUID is random per event and carries no relation to any person or prior event.

## Client session state (not persisted beyond the tab)

| Key (`sessionStorage`) | Meaning |
|---|---|
| `pe.visit` | `"1"` once the visit event was sent in this tab session |
| `pe.errs` | JSON array of `type|level/unit/track` already reported this tab session |

## TrackSource (client, in-memory / router state)

`scan` \| `navigation` \| `resume` \| `repeat` \| `next`. Carried as `location.state.source`; absent ⇒ `navigation`.

## Report (collector → owner)

```json
{
  "from": "2026-10-01", "to": "2026-10-29",
  "visits": { "total": 0, "byLang": {}, "byDevice": {}, "byLangDevice": {} },
  "trackStarts": { "total": 0, "bySource": {}, "byTrack": [{ "level": "", "bookType": "", "unit": "", "track": "", "count": 0 }] },
  "resumeUsed": 0,
  "languageChanges": { "total": 0, "byLang": {} },
  "errors": { "total": 0, "byType": {} }
}
```

## State transitions

- Visit: `unsent → sent` per tab session (never reverts).
- Track start: `idle → pending (Play/Replay/Play-after-end) → sent (on audio "playing")`; failure path `pending → cleared` with an `error/playback-failure` instead.
- Error dedupe: `unreported(type, track) → reported` per tab session.
