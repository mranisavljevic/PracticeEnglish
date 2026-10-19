# Data Model

## Content (build-time, `src/content/catalog.json`)

```text
Catalog { version: 1, levels: Level[], books: Book[] }   // arrays are display order
Level   { id, title }                                    // e.g. "level-1", "Level 1"
Book    { id, levelId, type: "textbook"|"workbook", title, cover?, titleTranslations?, units: Unit[] }
Unit    { id, number, title, titleTranslations?, tracks: Track[] }
Track   { id, label, file, durationSec? }           // label = number as printed, e.g. "12a"
```

Relationships: Level 1—* Book 1—* Unit 1—* Track. Books are grouped by level on Home.

Validation rules (enforced by `scripts/validate-catalog.ts` and unit tests):
- IDs unique within their parent and URL-safe (`[a-z0-9-]+`).
- `type` ∈ {textbook, workbook}; `levelId` references an existing level.
- `label` is a non-empty string kept verbatim (never parsed as a number); unique within a unit.
- `file` is a relative path (no scheme, no `..`); the file exists in `audio-source/` at validation time.
- `title` is the printed English title; `titleTranslations` (optional) maps locale code → string and is secondary display only.
- Ordering is array order (not derived from labels).

## Interface text (`src/locales/<code>.json`)

`Locale { code, nativeName }` auto-discovered from `src/locales/<code>.json` (`code` = file name, `nativeName` = the file's `meta.nativeName`); translations are a flat `Record<string,string>`. Invariant: every key in `en.json` exists in every other locale (test-enforced); missing at runtime falls back to English.

## Device state (localStorage)

| Entity | Key | Shape | Notes |
|---|---|---|---|
| Learner Preferences | `pe.lang` | `"en"` \| `"es"` \| … | Absent ⇒ detect from browser |
| Listening Progress | `pe.progress` | `{ v:1, bookId, unitId, trackId }` | No playback position. Validated against catalogue on read; stale/invalid ⇒ ignored |

## State transitions

- **Progress**: `none → set(track)` whenever the student opens a track page (or presses play); each later track overwrites it. Stale on catalogue change ⇒ `none`.
- **Player (per track)**: `idle → loading → playing ⇄ paused → ended`; `error` reachable from loading/playing (offers retry/choose another); changing track resets to `idle`, speed 1×, stops previous audio.
