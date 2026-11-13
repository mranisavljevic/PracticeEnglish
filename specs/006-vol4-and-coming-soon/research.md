# Research: Volume 4 & Coming Soon

No NEEDS CLARIFICATION remained; findings below come from the codebase.

## Where the mapping lives
- **Decision**: Fill the Level 4 "SB tracks" column in `docs/UNITS-DRAFT.md`; `scripts/build-catalog.ts` already turns that table into units.
- **Rationale**: Same pipeline as Vol 2; satisfies FR-009 (releasing a book = supplying its data).
- **Alternatives**: A separate `volume4.json` mapping (second source of truth) — rejected.

Ranges derived from the spec's first-track table (each runs to the track before the next chapter; ch. 14 runs to the last file, 84):

| Unit | Range | Unit | Range |
|---|---|---|---|
| 1 | 2-6 | 8 | 42-48 |
| 2 | 7-11 | 9 | 49-55 |
| 3 | 12-17 | 10 | 56-65 |
| 4 | 18-23 | 11 | 66-69 |
| 5 | 24-27 | 12 | 70-74 |
| 6 | 28-34 (no files) | 13 | 75-77 |
| 7 | 35-41 | 14 | 78-84 |

## Local audio facts (`audio-source/level-4/sb`)
- Files: 001–027 and 035–084 (77 files). 028–034 are missing at the source (documented in `docs/AUDIO-GAPS-AND-DUPLICATES.txt`).
- All 77 files already have rows in `docs/SOURCES.md` → FR-011 is already met; `checkSources` passes.
- Track 1 (intro) → add `'4/sb': [1]` to `OMITTED` in the generator (same mechanism as Vol 2).

## Empty unit 6
- **Decision**: Generator drops units whose tracks list is empty.
- **Rationale**: An openable unit with no tracks is a dead end; the gap is a known source issue. It self-heals when files are added.
- **Alternatives**: Show empty unit with `book.noUnits`-style message — rejected as confusing; flagged to owner in plan.

## Live vs placeholder rule
- **Decision**: A book is live iff its column in `UNITS-DRAFT.md` has ranges. Otherwise it is emitted as a placeholder. This replaces the current `HIDDEN_LEVELS` set and the "All tracks" fallback, which would otherwise expose Vol 1/3 and Vol 4 WB audio that has no mapping.
- **Rationale**: One rule, no per-book flags. Volume 4 WB audio exists locally but is intentionally not exposed.

## Placeholder representation
- **Decision**: New optional top-level `comingSoon: [{ id, levelId, type, title, titleTranslations }]` in `catalog.json`; schema gets an optional property; `levels` includes levels 1, 3, 4.
- **Rationale**: `getBook`, resume (`loadProgress`), scanner (`resolve`), analytics and unit/track routes only read `books`, so FR-008 holds by construction.
- **Alternatives**: `books` entries with `comingSoon: true` — rejected, every consumer would need a guard and a miss would be a silent bug.

## UI / accessibility
- Placeholder tile is a non-link `div` styled with `.card--soon`, containing the book title, a "Coming soon" badge as real text (screen readers read it; no `aria-hidden`), and no tab stop. Greyed via the `--muted` token and a dashed border, not low opacity, so the existing contrast test (≥4.5:1) still passes.
- Direct URL `/b/<placeholder-id>`: Book page checks `getComingSoon` and shows title + "This book isn't available yet" + link home. Deeper placeholder URLs fall through to the existing NotFound.

## i18n
- New keys `book.comingSoon`, `book.unavailable` in both locales; `locale-parity.test.ts` guards parity. Titles reuse the `English in Action N: …` pattern with `titleTranslations.es`.

## Analytics
- Placeholders have no handlers, so no events fire. No changes to `src/analytics`.
